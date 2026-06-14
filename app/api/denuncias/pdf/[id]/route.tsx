import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import Link from 'next/link';
import { renderToBuffer } from '@react-pdf/renderer';
import DenunciaPDFDocument from '@/components/pdf/DenunciaPDF';
import QRCode from 'qrcode';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, bucketName } from '@/lib/s3';

// Función para descargar un adjunto de forma segura
async function descargarRecurso(url: string): Promise<Buffer | null> {
    console.warn(`[DEBUG-PDF] Inicio descargarRecurso para: ${url}`);
    try {
        const publicEndpoint = process.env.GARAGE_PUBLIC_URL || 'https://web.s1mple.cloud';
        
        // Si el archivo está en nuestro Garage S3 local
        if (url.startsWith(publicEndpoint) || url.includes('denuncias_cyberpol/')) {
            let key = url;
            if (url.startsWith(publicEndpoint)) {
                key = url.substring(publicEndpoint.length).replace(/^\//, '');
            } else {
                const idx = url.indexOf('denuncias_cyberpol/');
                if (idx !== -1) {
                    key = url.substring(idx);
                }
            }
            
            const decodedKey = decodeURIComponent(key);
            console.warn(`[DEBUG-PDF] S3 MATCH: key=${decodedKey}, bucket=${bucketName}`);
            
            console.warn(`[DEBUG-PDF] Enviando GetObjectCommand a S3...`);
            const response = await s3Client.send(
                new GetObjectCommand({
                    Bucket: bucketName,
                    Key: decodedKey,
                })
            );
            console.warn(`[DEBUG-PDF] Respuesta de GetObjectCommand recibida.`);
            
            if (response.Body) {
                console.warn(`[DEBUG-PDF] Consumiendo body con transformToByteArray...`);
                const bytes = await response.Body.transformToByteArray();
                console.warn(`[DEBUG-PDF] Body consumido con éxito, size=${bytes.length}`);
                return Buffer.from(bytes);
            } else {
                console.warn(`[DEBUG-PDF] GetObjectCommand retornó respuesta sin Body.`);
            }
        } else {
            console.warn(`[DEBUG-PDF] HTTP MATCH (externo): ${url}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.warn(`[DEBUG-PDF] HTTP timeout de 15s alcanzado para ${url}, abortando...`);
                controller.abort();
            }, 15000); // 15s timeout
            
            console.warn(`[DEBUG-PDF] Iniciando fetch HTTP para ${url}...`);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            console.warn(`[DEBUG-PDF] HTTP fetch completado, status=${response.status}`);
            
            if (!response.ok) {
                console.warn(`[DEBUG-PDF] HTTP fetch falló con status no-ok`);
                return null;
            }
            const arrayBuffer = await response.arrayBuffer();
            console.warn(`[DEBUG-PDF] HTTP body consumido con éxito, size=${arrayBuffer.byteLength}`);
            return Buffer.from(arrayBuffer);
        }
    } catch (e: any) {
        console.error(`[DEBUG-PDF] EXCEPCIÓN en descargarRecurso para ${url}:`, e.message || e);
        return null;
    }
    return null;
}


export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const startTime = Date.now();
        const { id: idStr_resolved } = await params;
        console.warn(`[DEBUG-PDF] Iniciando generación para denuncia ${idStr_resolved} - ${new Date().toISOString()}`);
        const id = parseInt(idStr_resolved);
        const { searchParams } = new URL(request.url);
        const tipo = searchParams.get('tipo') || 'oficio';
        const esCopiaManual = searchParams.get('es_copia') === 'true';
        const forzarOriginal = searchParams.get('forzar_original') === 'true';

        // 1. Obtener el usuario actual de la cookie de sesión
        const usuarioSesionCookie = request.cookies.get('usuario_sesion')?.value;
        let operadorActual = null;
        if (usuarioSesionCookie) {
            try {
                operadorActual = JSON.parse(decodeURIComponent(usuarioSesionCookie));
            } catch (e) {
                console.error('[PDF] Error parseando sesión:', e);
            }
        }

        // 2. Incrementar contador de impresiones y obtener valor previo
        const updateResult = await pool.query(
            `UPDATE denuncias 
             SET cantidad_impresiones = cantidad_impresiones + 1 
             WHERE id = $1 
             RETURNING cantidad_impresiones`,
            [id]
        );

        const impresionesTotal = updateResult.rows[0]?.cantidad_impresiones || 1;
        let isDuplicate = impresionesTotal > 1 || esCopiaManual;

        // Si se fuerza el original (para garv), ignoramos la bandera de duplicado
        if (forzarOriginal) {
            isDuplicate = false;
        }

        console.warn(`[DEBUG-PDF] DB Update impresiones completado en ${Date.now() - startTime}ms`);

        // Obtener datos de la base de datos (Unificado y robusto)
        const dbQueryStartTime = Date.now();
        const denunciaResult = await pool.query(
            `SELECT 
                d.*,
                COALESCE(NULLIF(d.operador_grado, ''), u.grado) as operador_grado_final,
                COALESCE(NULLIF(d.operador_nombre, ''), u.nombre) as operador_nombre_final,
                COALESCE(NULLIF(d.operador_apellido, ''), u.apellido) as operador_apellido_final,
                den.nombres as nombres_denunciante,
                den.cedula,
                den.tipo_documento,
                den.nacionalidad,
                den.estado_civil,
                den.edad,
                den.fecha_nacimiento,
                den.lugar_nacimiento,
                den.domicilio,
                den.telefono,
                den.correo,
                den.profesion,
                den.matricula
            FROM denuncias d
            INNER JOIN denunciantes den ON d.denunciante_id = den.id
            LEFT JOIN usuarios u ON d.usuario_id = u.id
            WHERE d.id = $1 AND d.estado = 'completada'
            LIMIT 1`,
            [id]
        );

        if (denunciaResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Denuncia no encontrada o no completada' },
                { status: 404 }
            );
        }

        const denuncia = denunciaResult.rows[0];

        // Obtener supuestos autores
        const autoresResult = await pool.query(
            `SELECT * FROM supuestos_autores WHERE denuncia_id = $1`,
            [id]
        );

        // Obtener involucrados
        const involucradosResult = await pool.query(
            `SELECT 
                di.*,
                den.nombres,
                den.cedula,
                den.tipo_documento,
                den.nacionalidad,
                den.estado_civil,
                den.edad,
                den.fecha_nacimiento,
                den.lugar_nacimiento,
                den.domicilio,
                den.telefono,
                den.profesion,
                den.matricula
            FROM denuncias_involucrados di
            INNER JOIN denunciantes den ON den.id = di.denunciante_id
            WHERE di.denuncia_id = $1
            ORDER BY 
                CASE WHEN di.rol = 'principal' THEN 0 ELSE 1 END,
                di.id`,
            [id]
        );

        // Obtener firmas digitales
        const firmasResult = await pool.query(
            'SELECT rol, firma_base64 FROM denuncia_firmas WHERE denuncia_id = $1 AND usado = TRUE',
            [id]
        );
        const firmas = firmasResult.rows.reduce((acc: any, row) => {
            acc[row.rol] = row.firma_base64;
            return acc;
        }, {});

        console.warn(`[DEBUG-PDF] Consultas DB completadas en ${Date.now() - dbQueryStartTime}ms`);

        // 5. Pre-cargar logos institucionales (Optimización crítica para Vercel)
        const loadLogos = async () => {
            const logoFiles = {
                policia: 'policianacional.png',
                dchef: 'dchef.png',
                gobierno: 'gobiernonacional.jpg'
            };
            const loadedLogos: Record<string, string> = {};

            for (const [key, filename] of Object.entries(logoFiles)) {
                try {
                    const pathsToTry = [
                        path.join(process.cwd(), 'public', filename),
                        path.join(process.cwd(), '..', 'public', filename),
                        path.join(process.cwd(), '.next', 'standalone', 'public', filename),
                    ];
                    
                    let found = false;
                    for (const filePath of pathsToTry) {
                        if (fs.existsSync(filePath)) {
                            const buffer = fs.readFileSync(filePath);
                            const extension = filename.split('.').pop();
                            loadedLogos[key] = `data:image/${extension === 'jpg' ? 'jpeg' : extension};base64,${buffer.toString('base64')}`;
                            console.warn(`[DEBUG-PDF] Logo ${key} cargado con éxito desde ruta local: ${filePath}`);
                            found = true;
                            break;
                        }
                    }
                    
                    if (!found) {
                        console.warn(`[DEBUG-PDF] ADVERTENCIA: Logo ${filename} no se encontró en ninguna de las rutas locales probadas: ${JSON.stringify(pathsToTry)}. Se omitirá el logo para evitar loopbacks HTTP.`);
                    }
                } catch (e: any) {
                    console.error(`[DEBUG-PDF] Error cargando logo ${filename}:`, e.message || e);
                }
            }
            return loadedLogos;
        };

        const logosStartTime = Date.now();
        const logosData = await loadLogos();
        console.warn(`[DEBUG-PDF] Logos cargados en ${Date.now() - logosStartTime}ms`);

        // 6. Pre-descargar TODOS los adjuntos (PDFs e Imágenes) en paralelo usando S3 local
        const allUrls = [...(denuncia.adjuntos_urls || [])];
        if (denuncia.es_denuncia_escrita && denuncia.archivo_denuncia_url) {
            allUrls.unshift(denuncia.archivo_denuncia_url);
        }

        // Coleccionar buffers de adjuntos procesados para fusión con pdf-lib
        const adjuntos_procesados: { tipo: 'pdf' | 'imagen'; buffer: Buffer; url: string }[] = [];

        if (allUrls.length > 0) {
            const downloadsStartTime = Date.now();
            console.warn(`[DEBUG-PDF] Iniciando pre-descarga de ${allUrls.length} recursos desde S3/HTTP...`);

            const downloadPromises = allUrls.map(async (url) => {
                const buffer = await descargarRecurso(url);
                return { url, data: buffer };
            });

            const results = await Promise.all(downloadPromises);

            results.forEach(res => {
                if (!res.data) return;

                const isPdf = res.url.toLowerCase().endsWith('.pdf');
                if (isPdf) {
                    adjuntos_procesados.push({ tipo: 'pdf', buffer: res.data, url: res.url });
                } else {
                    const ext = res.url.split('.').pop()?.toLowerCase() || 'png';
                    if (['jpg', 'jpeg', 'png'].includes(ext)) {
                        adjuntos_procesados.push({ tipo: 'imagen', buffer: res.data, url: res.url });
                    }
                }
            });

            const pdfCount = adjuntos_procesados.filter(x => x.tipo === 'pdf').length;
            const imgCount = adjuntos_procesados.filter(x => x.tipo === 'imagen').length;
            console.warn(`[DEBUG-PDF] Pre-descarga completada en ${Date.now() - downloadsStartTime}ms. PDFs: ${pdfCount}, Imágenes: ${imgCount}`);
        }

        // Generar código QR antes del objeto de datos
        console.warn(`[DEBUG-PDF] Generando código QR para hash ${denuncia.hash}...`);
        const qrCodeUrl = await QRCode.toDataURL(`${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}/verificar/${denuncia.hash}`);
        console.warn(`[DEBUG-PDF] Código QR generado.`);

        // Preparar datos para el PDF
        const denunciaData = {
            ...denuncia,
            orden: denuncia.orden,
            hash: String(denuncia.hash),
            fecha_denuncia: denuncia.fecha_denuncia instanceof Date
                ? denuncia.fecha_denuncia.toISOString().split('T')[0]
                : String(denuncia.fecha_denuncia),
            hora_denuncia: String(denuncia.hora_denuncia || ''),
            fecha_hecho: denuncia.fecha_hecho instanceof Date
                ? denuncia.fecha_hecho.toISOString().split('T')[0]
                : String(denuncia.fecha_hecho),
            hora_hecho: String(denuncia.hora_hecho || ''),
            usar_rango: Boolean(denuncia.usar_rango),
            fecha_hecho_fin: denuncia.fecha_hecho_fin instanceof Date
                ? denuncia.fecha_hecho_fin.toISOString().split('T')[0]
                : (denuncia.fecha_hecho_fin ? String(denuncia.fecha_hecho_fin) : undefined),
            hora_hecho_fin: denuncia.hora_hecho_fin ? String(denuncia.hora_hecho_fin) : undefined,
            tipo_denuncia: String(denuncia.tipo_denuncia),
            relato: String(denuncia.relato),
            lugar_hecho: String(denuncia.lugar_hecho),
            lugar_hecho_no_aplica: Boolean(denuncia.lugar_hecho_no_aplica),
            latitud: denuncia.latitud,
            longitud: denuncia.longitud,
            monto_dano: denuncia.monto_dano,
            moneda: denuncia.moneda ? String(denuncia.moneda) : undefined,
            operador_grado: String(denuncia.operador_grado_final || ''),
            operador_nombre: String(denuncia.operador_nombre_final || ''),
            operador_apellido: String(denuncia.operador_apellido_final || ''),
            oficina: String(denuncia.oficina || 'Asunción'),
            nombres_denunciante: String(denuncia.nombres_denunciante),
            cedula: String(denuncia.cedula),
            tipo_documento: denuncia.tipo_documento ? String(denuncia.tipo_documento) : undefined,
            nacionalidad: String(denuncia.nacionalidad),
            estado_civil: String(denuncia.estado_civil),
            edad: Number(denuncia.edad),
            fecha_nacimiento: denuncia.fecha_nacimiento instanceof Date
                ? denuncia.fecha_nacimiento.toISOString().split('T')[0]
                : String(denuncia.fecha_nacimiento),
            lugar_nacimiento: String(denuncia.lugar_nacimiento),
            domicilio: denuncia.domicilio ? String(denuncia.domicilio) : undefined,
            telefono: String(denuncia.telefono),
            correo: denuncia.correo ? String(denuncia.correo) : undefined,
            profesion: denuncia.profesion ? String(denuncia.profesion) : undefined,
            matricula: denuncia.matricula ? String(denuncia.matricula) : undefined,
            supuestos_autores: autoresResult.rows.map(autor => ({
                autor_conocido: String(autor.autor_conocido),
                nombre_autor: autor.nombre_autor ? String(autor.nombre_autor) : undefined,
                cedula_autor: autor.cedula_autor ? String(autor.cedula_autor) : undefined,
                domicilio_autor: autor.domicilio_autor ? String(autor.domicilio_autor) : undefined,
                nacionalidad_autor: autor.nacionalidad_autor ? String(autor.nacionalidad_autor) : undefined,
                estado_civil_autor: autor.estado_civil_autor ? String(autor.estado_civil_autor) : undefined,
                edad_autor: autor.edad_autor ? Number(autor.edad_autor) : undefined,
                telefono_autor: autor.telefono_autor ? String(autor.telefono_autor) : undefined,
                profesion_autor: autor.profesion_autor ? String(autor.profesion_autor) : undefined,
                descripcion_fisica: autor.descripcion_fisica ? String(autor.descripcion_fisica) : undefined,
                telefonos_involucrados: autor.telefonos_involucrados ? String(autor.telefonos_involucrados) : undefined,
                numero_cuenta_beneficiaria: autor.numero_cuenta_beneficiaria ? String(autor.numero_cuenta_beneficiaria) : undefined,
                nombre_cuenta_beneficiaria: autor.nombre_cuenta_beneficiaria ? String(autor.nombre_cuenta_beneficiaria) : undefined,
                entidad_bancaria: autor.entidad_bancaria ? String(autor.entidad_bancaria) : undefined,
            })),
            denunciantes_involucrados: involucradosResult.rows.map(inv => ({
                rol: String(inv.rol) as 'principal' | 'co-denunciante' | 'abogado',
                con_carta_poder: Boolean(inv.con_carta_poder),
                carta_poder_fecha: inv.carta_poder_fecha instanceof Date
                    ? inv.carta_poder_fecha.toISOString().split('T')[0]
                    : (inv.carta_poder_fecha ? String(inv.carta_poder_fecha) : undefined),
                carta_poder_numero: inv.carta_poder_numero ? String(inv.carta_poder_numero) : undefined,
                carta_poder_notario: inv.carta_poder_notario ? String(inv.carta_poder_notario) : undefined,
                nombres: String(inv.nombres),
                cedula: String(inv.cedula),
                tipo_documento: inv.tipo_documento ? String(inv.tipo_documento) : undefined,
                nacionalidad: String(inv.nacionalidad),
                estado_civil: String(inv.estado_civil),
                edad: Number(inv.edad),
                fecha_nacimiento: inv.fecha_nacimiento instanceof Date
                    ? inv.fecha_nacimiento.toISOString().split('T')[0]
                    : String(inv.fecha_nacimiento),
                lugar_nacimiento: String(inv.lugar_nacimiento),
                domicilio: inv.domicilio ? String(inv.domicilio) : undefined,
                telefono: String(inv.telefono),
                profesion: inv.profesion ? String(inv.profesion) : undefined,
                matricula: inv.matricula ? String(inv.matricula) : undefined,
            })),
            qr_code_url: qrCodeUrl,
            is_duplicate: isDuplicate,
            operador_actual: operadorActual ? {
                id: Number(operadorActual.id),
                nombre: String(operadorActual.nombre),
                apellido: String(operadorActual.apellido),
                grado: String(operadorActual.grado)
            } : undefined,
            usuario_id: denuncia.usuario_id,
            es_denuncia_escrita: Boolean(denuncia.es_denuncia_escrita),
            archivo_denuncia_url: denuncia.archivo_denuncia_url,
            adjuntos_urls: adjuntos_procesados.filter(x => x.tipo === 'imagen').map(x => x.url), // Pasar URLs de imágenes para pre-renderizar las páginas de adjuntos con membrete
            firmas: firmas,
            logos: logosData,
            imagenes_adjuntas: {} // Vacío para evitar procesamiento pesado en react-pdf
        };

        // Determinar el tamaño de página
        const pageSize = tipo === 'a4' ? 'A4' : 'LETTER';

        // Generar el PDF usando renderToBuffer con JSX
        const renderStartTime = Date.now();
        console.warn(`[DEBUG-PDF] Iniciando renderToBuffer (Solo Acta)...`);
        const pdfBuffer = await renderToBuffer(
            <DenunciaPDFDocument
                denuncia={denunciaData}
                pageSize={pageSize as 'A4' | 'LETTER'}
            />
        );
        console.warn(`[DEBUG-PDF] renderToBuffer completado en ${Date.now() - renderStartTime}ms`);

        // 7. Fusionar PDFs e Imágenes si existen (usando pdf-lib de forma lineal y rápida)
        if (adjuntos_procesados.length > 0) {
            try {
                const mergeStartTime = Date.now();
                console.warn(`[DEBUG-PDF] Iniciando fusión de ${adjuntos_procesados.length} adjuntos con pdf-lib...`);
                const mergedPdf = await PDFDocument.create();

                // Cargar el documento original (Carátula)
                console.warn(`[DEBUG-PDF] Cargando PDF principal en pdf-lib...`);
                const mainPdf = await PDFDocument.load(pdfBuffer);
                console.warn(`[DEBUG-PDF] PDF principal cargado. Copiando ${mainPdf.getPageCount()} páginas...`);
                const mainPages = await mergedPdf.copyPages(mainPdf, mainPdf.getPageIndices());
                mainPages.forEach((page) => mergedPdf.addPage(page));

                // Procesar cada adjunto ordenadamente
                let imageCount = 0;
                let pdfCount = 0;
                const totalImages = adjuntos_procesados.filter(x => x.tipo === 'imagen').length;

                for (const adjunto of adjuntos_procesados) {
                    if (adjunto.tipo === 'pdf') {
                        pdfCount++;
                        console.warn(`[DEBUG-PDF] Fusionando PDF adjunto #${pdfCount}: ${adjunto.url}`);
                        try {
                            const adjuntoPdf = await PDFDocument.load(adjunto.buffer);
                            const pages = await mergedPdf.copyPages(adjuntoPdf, adjuntoPdf.getPageIndices());
                            pages.forEach((page) => mergedPdf.addPage(page));
                            console.warn(`[DEBUG-PDF] Páginas del PDF adjunto #${pdfCount} copiadas con éxito.`);
                        } catch (err: any) {
                            console.error(`[DEBUG-PDF] Error cargando/fusionando PDF adjunto #${pdfCount}:`, err.message || err);
                        }
                    } else {
                        imageCount++;
                        console.warn(`[DEBUG-PDF] Incrustando imagen adjunta #${imageCount}: ${adjunto.url}`);
                        try {
                            const ext = adjunto.url.split('.').pop()?.toLowerCase() || 'png';
                            let image;
                            if (ext === 'png') {
                                image = await mergedPdf.embedPng(adjunto.buffer);
                            } else {
                                image = await mergedPdf.embedJpg(adjunto.buffer);
                            }
                            
                            const pages = mergedPdf.getPages();
                            const targetPageIndex = mainPdf.getPageCount() - totalImages + (imageCount - 1);
                            
                            if (targetPageIndex < 0 || targetPageIndex >= pages.length) {
                                console.error(`[DEBUG-PDF] ERROR: targetPageIndex ${targetPageIndex} fuera de rango. Total páginas: ${pages.length}. Creando página nueva...`);
                                const page = mergedPdf.addPage([612, 936]);
                                // Dibujar imagen en página de fallback
                                const maxImgWidth = 512;
                                const maxImgHeight = 796;
                                let imgWidth = image.width;
                                let imgHeight = image.height;
                                const scale = Math.min(maxImgWidth / imgWidth, maxImgHeight / imgHeight);
                                if (scale < 1) {
                                    imgWidth = imgWidth * scale;
                                    imgHeight = imgHeight * scale;
                                }
                                const x = (612 - imgWidth) / 2;
                                const y = 50 + (maxImgHeight - imgHeight) / 2;
                                page.drawImage(image, { x, y, width: imgWidth, height: imgHeight });
                            } else {
                                const page = pages[targetPageIndex];
                                
                                // Espacio en blanco está reservado de forma que la imagen se dibuje
                                // centrada dentro del área [x: 72 a 540] (ancho 468) e [y: 75 a 655] (alto 580)
                                const maxImgWidth = 468;
                                const maxImgHeight = 580;
                                const minY = 75;
                                
                                let imgWidth = image.width;
                                let imgHeight = image.height;
                                
                                const scale = Math.min(maxImgWidth / imgWidth, maxImgHeight / imgHeight);
                                if (scale < 1) {
                                    imgWidth = imgWidth * scale;
                                    imgHeight = imgHeight * scale;
                                }
                                
                                // Centrar horizontalmente en [72, 540]
                                const x = 72 + (maxImgWidth - imgWidth) / 2;
                                // Centrar verticalmente en [minY, minY + maxImgHeight]
                                const y = minY + (maxImgHeight - imgHeight) / 2;
                                
                                page.drawImage(image, {
                                    x,
                                    y,
                                    width: imgWidth,
                                    height: imgHeight,
                                });
                                console.warn(`[DEBUG-PDF] Imagen adjunta #${imageCount} dibujada con éxito sobre página pre-renderizada ${targetPageIndex}.`);
                            }
                        } catch (err: any) {
                            console.error(`[DEBUG-PDF] Error incrustando imagen adjunta #${imageCount}:`, err.message || err);
                        }
                    }
                }

                console.warn(`[DEBUG-PDF] Guardando documento PDF fusionado...`);
                const mergedPdfBytes = await mergedPdf.save();
                console.warn(`[DEBUG-PDF] Documento PDF fusionado guardado. Fusión completada en ${Date.now() - mergeStartTime}ms`);
                console.warn(`[DEBUG-PDF] Proceso total finalizado exitosamente en ${Date.now() - startTime}ms`);

                return new NextResponse(Buffer.from(mergedPdfBytes), {
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename="denuncia_${denuncia.orden}_${new Date().toISOString().split('T')[0]}.pdf"`,
                    },
                });

            } catch (mergeError: any) {
                console.error('[DEBUG-PDF] Error general fusionando PDFs e imágenes:', mergeError.message || mergeError);
            }
        }

        console.warn(`[DEBUG-PDF] Generación carátula simple completada en ${Date.now() - startTime}ms`);

        // Convertir Buffer a Uint8Array para NextResponse
        const uint8Array = new Uint8Array(pdfBuffer);

        // Retornar el PDF
        return new NextResponse(uint8Array, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="denuncia_${denuncia.orden}_${new Date().toISOString().split('T')[0]}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Error generando PDF:', error);
        return NextResponse.json(
            { error: 'Error al generar PDF' },
            { status: 500 }
        );
    }
}

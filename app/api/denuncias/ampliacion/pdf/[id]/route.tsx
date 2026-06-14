import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { renderToBuffer } from '@react-pdf/renderer';
import DenunciaPDFDocument from '@/components/pdf/DenunciaPDF';
import QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, bucketName } from '@/lib/s3';

// Función para descargar un adjunto de forma segura
async function descargarRecurso(url: string): Promise<Buffer | null> {
    console.warn(`[DEBUG-PDF-AMPLIACION] Inicio descargarRecurso para: ${url}`);
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
            console.warn(`[DEBUG-PDF-AMPLIACION] S3 MATCH: key=${decodedKey}, bucket=${bucketName}`);
            
            console.warn(`[DEBUG-PDF-AMPLIACION] Enviando GetObjectCommand a S3...`);
            const response = await s3Client.send(
                new GetObjectCommand({
                    Bucket: bucketName,
                    Key: decodedKey,
                })
            );
            console.warn(`[DEBUG-PDF-AMPLIACION] Respuesta de GetObjectCommand recibida.`);
            
            if (response.Body) {
                console.warn(`[DEBUG-PDF-AMPLIACION] Consumiendo body con transformToByteArray...`);
                const bytes = await response.Body.transformToByteArray();
                console.warn(`[DEBUG-PDF-AMPLIACION] Body consumido con éxito, size=${bytes.length}`);
                return Buffer.from(bytes);
            } else {
                console.warn(`[DEBUG-PDF-AMPLIACION] GetObjectCommand retornó respuesta sin Body.`);
            }
        } else {
            console.warn(`[DEBUG-PDF-AMPLIACION] HTTP MATCH (externo): ${url}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.warn(`[DEBUG-PDF-AMPLIACION] HTTP timeout de 15s alcanzado para ${url}, abortando...`);
                controller.abort();
            }, 15000); // 15s timeout
            
            console.warn(`[DEBUG-PDF-AMPLIACION] Iniciando fetch HTTP para ${url}...`);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            console.warn(`[DEBUG-PDF-AMPLIACION] HTTP fetch completado, status=${response.status}`);
            
            if (!response.ok) {
                console.warn(`[DEBUG-PDF-AMPLIACION] HTTP fetch falló con status no-ok`);
                return null;
            }
            const arrayBuffer = await response.arrayBuffer();
            console.warn(`[DEBUG-PDF-AMPLIACION] HTTP body consumido con éxito, size=${arrayBuffer.byteLength}`);
            return Buffer.from(arrayBuffer);
        }
    } catch (e: any) {
        console.error(`[DEBUG-PDF-AMPLIACION] EXCEPCIÓN en descargarRecurso para ${url}:`, e.message || e);
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
        const { id: idStr } = await params;
        console.warn(`[DEBUG-PDF-AMPLIACION] Iniciando generación para ampliacion ${idStr} - ${new Date().toISOString()}`);
        const id = parseInt(idStr);
        const { searchParams } = new URL(request.url);
        const tipo = searchParams.get('tipo') || 'oficio';

        // 1. Obtener datos de la ampliación
        const ampliacionResult = await pool.query(
            `SELECT * FROM ampliaciones_denuncia WHERE id = $1`,
            [id]
        );

        if (ampliacionResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Ampliación no encontrada' },
                { status: 404 }
            );
        }

        const ampliacion = ampliacionResult.rows[0];

        // 2. Obtener datos de la denuncia original
        const denunciaResult = await pool.query(
            `SELECT 
                d.*,
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
            WHERE d.id = $1`,
            [ampliacion.denuncia_id]
        );

        if (denunciaResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Denuncia original no encontrada' },
                { status: 404 }
            );
        }

        const denuncia = denunciaResult.rows[0];

        // 3. Obtener supuestos autores (de la original)
        const autoresResult = await pool.query(
            `SELECT * FROM supuestos_autores WHERE denuncia_id = $1`,
            [denuncia.id]
        );

        // 4. Obtener involucrados (de la original)
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
            [denuncia.id]
        );

        console.warn(`[DEBUG-PDF-AMPLIACION] Consultas DB completadas en ${Date.now() - startTime}ms`);

        // Pre-cargar logos institucionales (Optimización para Vercel/VPS)
        const loadLogos = async () => {
            const logoFiles = {
                policia: 'policianacional.png',
                dchef: 'dchef.png',
                gobierno: 'gobiernonacional.jpg'
            };
            const loadedLogos: Record<string, string> = {};

            for (const [key, filename] of Object.entries(logoFiles)) {
                try {
                    const filePath = path.join(process.cwd(), 'public', filename);
                    if (fs.existsSync(filePath)) {
                        const buffer = fs.readFileSync(filePath);
                        const extension = filename.split('.').pop();
                        loadedLogos[key] = `data:image/${extension === 'jpg' ? 'jpeg' : extension};base64,${buffer.toString('base64')}`;
                    } else {
                        loadedLogos[key] = `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}/${filename}`;
                    }
                } catch (e) {
                    console.error(`[PDF] Error cargando logo ${filename}:`, e);
                }
            }
            return loadedLogos;
        };

        const logosStartTime = Date.now();
        const logosData = await loadLogos();
        console.warn(`[DEBUG-PDF-AMPLIACION] Logos cargados en ${Date.now() - logosStartTime}ms`);

        // 6. Pre-descargar TODOS los adjuntos (PDFs e Imágenes) en paralelo usando S3 local
        const allUrls = [...(denuncia.adjuntos_urls || [])];
        if (denuncia.es_denuncia_escrita && denuncia.archivo_denuncia_url) {
            allUrls.unshift(denuncia.archivo_denuncia_url);
        }

        const imagenes_adjuntas: Record<string, string> = {};
        const pdf_adjuntos_buffers: any[] = [];

        if (allUrls.length > 0) {
            const downloadsStartTime = Date.now();
            console.warn(`[DEBUG-PDF-AMPLIACION] Iniciando pre-descarga de ${allUrls.length} recursos desde S3/HTTP...`);

            const downloadPromises = allUrls.map(async (url) => {
                const buffer = await descargarRecurso(url);
                return { url, data: buffer };
            });

            const results = await Promise.all(downloadPromises);

            results.forEach(res => {
                if (!res.data) return;

                const isPdf = res.url.toLowerCase().endsWith('.pdf');
                if (isPdf) {
                    pdf_adjuntos_buffers.push(res.data);
                } else {
                    // Es imagen
                    const extension = res.url.split('.').pop()?.toLowerCase() || 'png';
                    const base64 = res.data.toString('base64');
                    imagenes_adjuntas[res.url] = `data:image/${extension === 'jpg' ? 'jpeg' : extension};base64,${base64}`;
                }
            });

            console.warn(`[DEBUG-PDF-AMPLIACION] Pre-descarga completada en ${Date.now() - downloadsStartTime}ms. PDFs: ${pdf_adjuntos_buffers.length}, Imágenes: ${Object.keys(imagenes_adjuntas).length}`);
        }

        // 5. Preparar datos para el PDF usando la información de la ampliación
        // pero manteniendo los datos estructurales de la denuncia original
        const denunciaData = {
            orden: denuncia.orden, // Mismo número de acta
            hash: String(denuncia.hash),
            // Usar fecha y hora de la ampliación
            fecha_denuncia: ampliacion.fecha_ampliacion instanceof Date
                ? ampliacion.fecha_ampliacion.toISOString().split('T')[0]
                : String(ampliacion.fecha_ampliacion),
            hora_denuncia: String(ampliacion.hora_ampliacion || ''),

            // Datos del hecho original
            fecha_hecho: denuncia.fecha_hecho instanceof Date
                ? denuncia.fecha_hecho.toISOString().split('T')[0]
                : String(denuncia.fecha_hecho),
            hora_hecho: String(denuncia.hora_hecho || ''),
            usar_rango: Boolean(denuncia.usar_rango),
            fecha_hecho_fin: denuncia.fecha_hecho_fin instanceof Date
                ? denuncia.fecha_hecho_fin.toISOString().split('T')[0]
                : (denuncia.fecha_hecho_fin ? String(denuncia.fecha_hecho_fin) : undefined),
            hora_hecho_fin: denuncia.hora_hecho_fin ? String(denuncia.hora_hecho_fin) : undefined,
            tipo_denuncia: String(denuncia.tipo_denuncia), // Tipo original

            // Relato de la ampliación
            relato: String(ampliacion.relato),

            lugar_hecho: String(denuncia.lugar_hecho),
            lugar_hecho_no_aplica: Boolean(denuncia.lugar_hecho_no_aplica),
            latitud: denuncia.latitud,
            longitud: denuncia.longitud,
            monto_dano: denuncia.monto_dano,
            moneda: denuncia.moneda ? String(denuncia.moneda) : undefined,

            // Operador de la ampliación
            operador_grado: String(ampliacion.operador_grado || ''),
            operador_nombre: String(ampliacion.operador_nombre || ''),
            operador_apellido: String(ampliacion.operador_apellido || ''),
            oficina: String(denuncia.oficina || 'Asunción'),

            // Datos del denunciante original
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

            // Autores e involucrados originales
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
            qr_code_url: '', // Se asignará abajo
            usuario_id: ampliacion.usuario_id,
            es_denuncia_escrita: Boolean(denuncia.es_denuncia_escrita),
            archivo_denuncia_url: denuncia.archivo_denuncia_url,
            es_ampliacion: true,
            numero_ampliacion: ampliacion.numero_ampliacion,
            fecha_original: denuncia.fecha_denuncia instanceof Date
                ? denuncia.fecha_denuncia.toISOString().split('T')[0]
                : String(denuncia.fecha_denuncia),
            hora_original: String(denuncia.hora_denuncia || ''),
            logos: logosData,
            adjuntos_urls: denuncia.adjuntos_urls || [],
            imagenes_adjuntas: imagenes_adjuntas
        };

        // Generar código QR antes del renderizado
        console.warn(`[DEBUG-PDF-AMPLIACION] Generando código QR para hash ${denuncia.hash}...`);
        const qrCodeUrl = await QRCode.toDataURL(`${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}/verificar/${denuncia.hash}`);
        console.warn(`[DEBUG-PDF-AMPLIACION] Código QR generado.`);
        denunciaData.qr_code_url = qrCodeUrl;

        // Determinar el tamaño de página
        const pageSize = tipo === 'a4' ? 'A4' : 'LETTER';

        // Generar el PDF
        const renderStartTime = Date.now();
        console.warn(`[DEBUG-PDF-AMPLIACION] Iniciando renderToBuffer (Solo Acta)...`);
        const pdfBuffer = await renderToBuffer(
            <DenunciaPDFDocument
                denuncia={denunciaData}
                pageSize={pageSize as 'A4' | 'LETTER'}
            />
        );
        console.warn(`[DEBUG-PDF-AMPLIACION] renderToBuffer completado en ${Date.now() - renderStartTime}ms`);

        // Convertir Buffer a Uint8Array
        const uint8Array = new Uint8Array(pdfBuffer);

        // 7. Fusionar PDFs si existen (ya pre-cargados en pdf_adjuntos_buffers)
        if (pdf_adjuntos_buffers.length > 0) {
            try {
                const mergeStartTime = Date.now();
                console.warn(`[DEBUG-PDF-AMPLIACION] Iniciando fusión de ${pdf_adjuntos_buffers.length} PDFs...`);
                const mergedPdf = await PDFDocument.create();

                // Cargar el documento original (Carátula + Imágenes)
                console.warn(`[DEBUG-PDF-AMPLIACION] Cargando PDF principal en pdf-lib...`);
                const mainPdf = await PDFDocument.load(pdfBuffer);
                console.warn(`[DEBUG-PDF-AMPLIACION] PDF principal cargado en pdf-lib. Páginas: ${mainPdf.getPageCount()}`);
                const mainPages = await mergedPdf.copyPages(mainPdf, mainPdf.getPageIndices());
                mainPages.forEach((page) => mergedPdf.addPage(page));

                // Copiar páginas de cada adjunto pre-descargado
                let adjuntoIndex = 0;
                for (const buffer of pdf_adjuntos_buffers) {
                    try {
                        adjuntoIndex++;
                        console.warn(`[DEBUG-PDF-AMPLIACION] Cargando adjunto PDF #${adjuntoIndex} en pdf-lib (tamaño buffer: ${buffer.length})...`);
                        const adjuntoPdf = await PDFDocument.load(buffer);
                        console.warn(`[DEBUG-PDF-AMPLIACION] Adjunto PDF #${adjuntoIndex} cargado con éxito. Copiando ${adjuntoPdf.getPageCount()} páginas...`);
                        const pages = await mergedPdf.copyPages(adjuntoPdf, adjuntoPdf.getPageIndices());
                        pages.forEach((page) => mergedPdf.addPage(page));
                        console.warn(`[DEBUG-PDF-AMPLIACION] Páginas del adjunto PDF #${adjuntoIndex} copiadas con éxito.`);
                    } catch (err: any) {
                        console.error(`[DEBUG-PDF-AMPLIACION] Error cargando/fusionando adjunto PDF #${adjuntoIndex}:`, err.message || err);
                    }
                }

                console.warn(`[DEBUG-PDF-AMPLIACION] Guardando documento PDF fusionado...`);
                const mergedPdfBytes = await mergedPdf.save();
                console.warn(`[DEBUG-PDF-AMPLIACION] Documento PDF fusionado guardado. Fusión completada en ${Date.now() - mergeStartTime}ms`);
                console.warn(`[DEBUG-PDF-AMPLIACION] Proceso total finalizado exitosamente en ${Date.now() - startTime}ms`);

                return new NextResponse(Buffer.from(mergedPdfBytes), {
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename="ampliacion_${ampliacion.numero_ampliacion}_${denuncia.orden}.pdf"`,
                    },
                });

            } catch (mergeError: any) {
                console.error('[DEBUG-PDF-AMPLIACION] Error general fusionando PDFs:', mergeError.message || mergeError);
            }
        }

        console.warn(`[DEBUG-PDF-AMPLIACION] Generación carátula simple completada en ${Date.now() - startTime}ms`);
        return new NextResponse(Buffer.from(uint8Array), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="ampliacion_${ampliacion.numero_ampliacion}_${denuncia.orden}.pdf"`,
            },
        });
    } catch (error: any) {
        console.error('Error generando PDF de ampliación:', error.message || error);
        return NextResponse.json(
            { error: 'Error al generar PDF' },
            { status: 500 }
        );
    }
}

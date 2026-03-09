import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import Link from 'next/link';
import { renderToBuffer } from '@react-pdf/renderer';
import DenunciaPDFDocument from '@/components/pdf/DenunciaPDF';
import QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const startTime = Date.now();
        const { id: idStr_resolved } = await params;
        console.log(`[PDF] Iniciando generación para denuncia ${idStr_resolved} - ${new Date().toISOString()}`);
        const id = parseInt(idStr_resolved);
        const { searchParams } = new URL(request.url);
        const tipo = searchParams.get('tipo') || 'oficio';
        const esCopiaManual = searchParams.get('es_copia') === 'true';

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
        const isDuplicate = impresionesTotal > 1 || esCopiaManual;

        console.log(`[PDF] DB Update impresiones completado en ${Date.now() - startTime}ms`);

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

        console.log(`[PDF] Consultas DB completadas en ${Date.now() - dbQueryStartTime}ms`);

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
                    const filePath = path.join(process.cwd(), 'public', filename);
                    if (fs.existsSync(filePath)) {
                        const buffer = fs.readFileSync(filePath);
                        const extension = filename.split('.').pop();
                        loadedLogos[key] = `data:image/${extension === 'jpg' ? 'jpeg' : extension};base64,${buffer.toString('base64')}`;
                    } else {
                        // Fallback a URL si no existe localmente (raro)
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
        console.log(`[PDF] Logos cargados en ${Date.now() - logosStartTime}ms`);

        // 6. Pre-descargar TODOS los adjuntos (PDFs e Imágenes) en paralelo
        const allUrls = [...(denuncia.adjuntos_urls || [])];
        if (denuncia.es_denuncia_escrita && denuncia.archivo_denuncia_url) {
            allUrls.unshift(denuncia.archivo_denuncia_url);
        }

        const imagenes_adjuntas: Record<string, string> = {};
        const pdf_adjuntos_buffers: ArrayBuffer[] = [];

        if (allUrls.length > 0) {
            const downloadsStartTime = Date.now();
            console.log(`[PDF] Iniciando pre-descarga de ${allUrls.length} recursos en paralelo...`);

            const downloadPromises = allUrls.map(async (url) => {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

                    const response = await fetch(url, { signal: controller.signal });
                    clearTimeout(timeoutId);

                    if (!response.ok) return { url, data: null };

                    const buffer = await response.arrayBuffer();
                    return { url, data: buffer };
                } catch (e) {
                    console.error(`[PDF] Error descargando ${url}:`, e);
                    return { url, data: null };
                }
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
                    const base64 = Buffer.from(res.data).toString('base64');
                    imagenes_adjuntas[res.url] = `data:image/${extension === 'jpg' ? 'jpeg' : extension};base64,${base64}`;
                }
            });

            console.log(`[PDF] Pre-descarga completada en ${Date.now() - downloadsStartTime}ms. PDFs: ${pdf_adjuntos_buffers.length}, Imágenes: ${Object.keys(imagenes_adjuntas).length}`);
        }

        // Preparar datos para el PDF
        const denunciaData = {
            ...denuncia, // Atajo para no re-mapear todo si ya viene bien de la DB
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
            qr_code_url: await QRCode.toDataURL(`${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}/verificar/${denuncia.hash}`),
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
            adjuntos_urls: denuncia.adjuntos_urls || [],
            firmas: firmas,
            logos: logosData,
            imagenes_adjuntas: imagenes_adjuntas
        };

        // Determinar el tamaño de página
        const pageSize = tipo === 'a4' ? 'A4' : 'LETTER';

        // Generar el PDF usando renderToBuffer con JSX
        const renderStartTime = Date.now();
        console.log(`[PDF] Iniciando renderToBuffer...`);
        const pdfBuffer = await renderToBuffer(
            <DenunciaPDFDocument
                denuncia={denunciaData}
                pageSize={pageSize as 'A4' | 'LETTER'}
            />
        );
        console.log(`[PDF] renderToBuffer completado en ${Date.now() - renderStartTime}ms`);

        // 7. Fusionar PDFs si existen (ya pre-cargados en pdf_adjuntos_buffers)
        if (pdf_adjuntos_buffers.length > 0) {
            try {
                const mergeStartTime = Date.now();
                console.log(`[PDF] Iniciando fusión de ${pdf_adjuntos_buffers.length} PDFs...`);
                const mergedPdf = await PDFDocument.create();

                // Cargar el documento original (Carátula + Imágenes)
                const mainPdf = await PDFDocument.load(pdfBuffer);
                const mainPages = await mergedPdf.copyPages(mainPdf, mainPdf.getPageIndices());
                mainPages.forEach((page) => mergedPdf.addPage(page));

                // Copiar páginas de cada adjunto pre-descargado
                for (const buffer of pdf_adjuntos_buffers) {
                    try {
                        const adjuntoPdf = await PDFDocument.load(buffer);
                        const pages = await mergedPdf.copyPages(adjuntoPdf, adjuntoPdf.getPageIndices());
                        pages.forEach((page) => mergedPdf.addPage(page));
                    } catch (err) {
                        console.error(`[PDF] Error cargando/fusionando adjunto PDF:`, err);
                    }
                }

                console.log(`[PDF] Fusión de PDFs completada en ${Date.now() - mergeStartTime}ms`);

                const mergedPdfBytes = await mergedPdf.save();
                console.log(`[PDF] Proceso total finalizado exitosamente en ${Date.now() - startTime}ms`);

                return new NextResponse(Buffer.from(mergedPdfBytes), {
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename="denuncia_${denuncia.orden}_${new Date().toISOString().split('T')[0]}.pdf"`,
                    },
                });

            } catch (mergeError) {
                console.error('[PDF] Error general fusionando PDFs:', mergeError);
            }
        }

        console.log(`[PDF] Generación carátula simple completada en ${Date.now() - startTime}ms`);

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

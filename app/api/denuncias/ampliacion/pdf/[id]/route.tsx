
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { renderToBuffer } from '@react-pdf/renderer';
import DenunciaPDFDocument from '@/components/pdf/DenunciaPDF';
import QRCode from 'qrcode';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
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
            qr_code_url: await QRCode.toDataURL(`${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}/verificar/${denuncia.hash}`),
            usuario_id: ampliacion.usuario_id,
            es_ampliacion: true,
            numero_ampliacion: ampliacion.numero_ampliacion,
            fecha_original: denuncia.fecha_denuncia instanceof Date
                ? denuncia.fecha_denuncia.toISOString().split('T')[0]
                : String(denuncia.fecha_denuncia),
            hora_original: String(denuncia.hora_denuncia || '')
        };

        // Determinar el tamaño de página
        const pageSize = tipo === 'a4' ? 'A4' : 'LETTER';

        // Generar el PDF
        const pdfBuffer = await renderToBuffer(
            <DenunciaPDFDocument
                denuncia={denunciaData}
                pageSize={pageSize as 'A4' | 'LETTER'}
            />
        );

        // Convertir Buffer a Uint8Array
        const uint8Array = new Uint8Array(pdfBuffer);

        return new NextResponse(Buffer.from(uint8Array), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="ampliacion_${ampliacion.numero_ampliacion}_${denuncia.orden}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Error generando PDF de ampliación:', error);
        return NextResponse.json(
            { error: 'Error al generar PDF' },
            { status: 500 }
        );
    }
}

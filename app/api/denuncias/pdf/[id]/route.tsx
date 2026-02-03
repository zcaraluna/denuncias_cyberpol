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

        // 1. Obtener el usuario actual de la cookie de sesión
        const usuarioSesionCookie = request.cookies.get('usuario_sesion')?.value;
        let operadorActual = null;
        if (usuarioSesionCookie) {
            try {
                operadorActual = JSON.parse(decodeURIComponent(usuarioSesionCookie));
            } catch (e) {
                console.error('Error parseando sesión:', e);
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
        const isDuplicate = impresionesTotal > 1;

        // Obtener datos de la base de datos (Unificado y robusto)
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

        // Preparar datos serializados para el PDF (react-pdf no acepta Dates ni nulls)
        const denunciaData = {
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
            usuario_id: denuncia.usuario_id
        };

        // Determinar el tamaño de página
        const pageSize = tipo === 'a4' ? 'A4' : 'LETTER';

        // Generar el PDF usando renderToBuffer con JSX
        const pdfBuffer = await renderToBuffer(
            <DenunciaPDFDocument
                denuncia={denunciaData}
                pageSize={pageSize as 'A4' | 'LETTER'}
            />
        );

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

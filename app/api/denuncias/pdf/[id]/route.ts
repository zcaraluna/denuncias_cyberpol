import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        console.log('[PDF] ===== INICIANDO GENERACIÓN DE PDF AISLADA =====');

        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const { searchParams } = new URL(request.url);
        const tipo = searchParams.get('tipo') || 'oficio';

        // 1. Obtener datos de la base de datos (Esto es seguro)
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
      WHERE d.id = $1 AND d.estado = 'completada'`,
            [id]
        );

        if (denunciaResult.rows.length === 0) {
            return NextResponse.json({ error: 'Denuncia no encontrada' }, { status: 404 });
        }

        const denuncia = denunciaResult.rows[0];
        const autoresResult = await pool.query(
            `SELECT * FROM supuestos_autores WHERE denuncia_id = $1`,
            [id]
        );

        // CRÍTICO: Convertir TODAS las fechas y valores a strings primitivos
        // react-pdf NO puede renderizar objetos Date, null, o undefined directamente
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
            tipo_denuncia: String(denuncia.tipo_denuncia),
            otro_tipo: denuncia.otro_tipo ? String(denuncia.otro_tipo) : undefined,
            relato: String(denuncia.relato),
            lugar_hecho: String(denuncia.lugar_hecho),
            latitud: denuncia.latitud,
            longitud: denuncia.longitud,
            monto_dano: denuncia.monto_dano,
            moneda: denuncia.moneda ? String(denuncia.moneda) : undefined,
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
        };

        console.log('[PDF] ✅ Datos serializados correctamente');

        // 2. IMPORTANTE: Aislamiento total del renderizado
        const React = require('react');
        const { renderToBuffer } = require('@react-pdf/renderer');
        const DenunciaPDFDocument = require('@/components/pdf/DenunciaPDF').default;

        console.log('[PDF] 🔄 Renderizando PDF...');

        const pdfBuffer = await renderToBuffer(
            React.createElement(DenunciaPDFDocument, {
                denuncia: denunciaData,
                pageSize: 'LEGAL'
            })
        );

        console.log(`[PDF] ✅ PDF generado: ${pdfBuffer.length} bytes`);

        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="denuncia_${denuncia.orden}.pdf"`,
            },
        });
    } catch (error: any) {
        console.error('[PDF] ❌ Error fatal:', error);
        console.error('[PDF] Stack:', error?.stack);
        return NextResponse.json(
            {
                error: 'Error crítico en generación de PDF',
                details: error?.message || String(error),
                stack: error?.stack?.split('\n').slice(0, 5)
            },
            { status: 500 }
        );
    }
}

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

        const denunciaData = {
            ...denuncia,
            supuestos_autores: autoresResult.rows,
        };

        // 2. IMPORTANTE: Aislamiento total del renderizado
        // Cargamos react-pdf y el componente de forma dinámica para evitar conflictos de instancia
        const React = require('react');
        const { renderToBuffer } = require('@react-pdf/renderer');
        const DenunciaPDFDocument = require('@/components/pdf/DenunciaPDF').default;

        console.log('[PDF] 🔄 Renderizando con instancia aislada...');

        // Usamos React.createElement en lugar de JSX directo aquí para mayor seguridad
        const pdfBuffer = await renderToBuffer(
            React.createElement(DenunciaPDFDocument, {
                denuncia: denunciaData,
                pageSize: tipo === 'a4' ? 'A4' : 'LETTER'
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
        return NextResponse.json(
            {
                error: 'Error crítico en generación de PDF',
                details: error?.message || String(error),
                stack: error?.stack?.split('\n').slice(0, 3)
            },
            { status: 500 }
        );
    }
}

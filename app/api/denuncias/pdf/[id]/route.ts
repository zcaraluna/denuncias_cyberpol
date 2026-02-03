import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { renderToBuffer } from '@react-pdf/renderer';
import DenunciaPDF from '@/components/pdf/DenunciaPDF';
import React from 'react';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const { searchParams } = new URL(request.url);
        const tipo = searchParams.get('tipo') || 'oficio';

        // Obtener datos completos de la denuncia
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

        // Preparar datos para el PDF
        const denunciaData = {
            orden: denuncia.orden,
            hash: denuncia.hash,
            fecha_denuncia: denuncia.fecha_denuncia,
            hora_denuncia: denuncia.hora_denuncia,
            fecha_hecho: denuncia.fecha_hecho,
            hora_hecho: denuncia.hora_hecho,
            tipo_denuncia: denuncia.tipo_denuncia,
            otro_tipo: denuncia.otro_tipo,
            relato: denuncia.relato,
            lugar_hecho: denuncia.lugar_hecho,
            latitud: denuncia.latitud,
            longitud: denuncia.longitud,
            monto_dano: denuncia.monto_dano,
            moneda: denuncia.moneda,
            nombres_denunciante: denuncia.nombres_denunciante,
            cedula: denuncia.cedula,
            tipo_documento: denuncia.tipo_documento,
            nacionalidad: denuncia.nacionalidad,
            estado_civil: denuncia.estado_civil,
            edad: denuncia.edad,
            fecha_nacimiento: denuncia.fecha_nacimiento,
            lugar_nacimiento: denuncia.lugar_nacimiento,
            domicilio: denuncia.domicilio,
            telefono: denuncia.telefono,
            correo: denuncia.correo,
            profesion: denuncia.profesion,
            supuestos_autores: autoresResult.rows,
        };

        // Determinar el tamaño de página
        const pageSize = tipo === 'a4' ? 'A4' : 'LETTER';

        // Generar el PDF usando renderToBuffer
        const pdfBuffer = await renderToBuffer(
            React.createElement(DenunciaPDF, {
                denuncia: denunciaData,
                pageSize: pageSize as 'A4' | 'LETTER',
            })
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

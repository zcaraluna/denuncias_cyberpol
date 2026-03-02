import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        const query = `
            SELECT df.rol, df.usado, d.orden, d.fecha_denuncia, den.nombres as denunciante
            FROM denuncia_firmas df
            JOIN denuncias d ON df.denuncia_id = d.id
            JOIN denunciantes den ON d.denunciante_id = den.id
            WHERE df.token = $1
        `;
        const result = await pool.query(query, [token]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error al validar token de firma:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const { firma } = await request.json();

        if (!firma) {
            return NextResponse.json({ error: 'Firma requerida' }, { status: 400 });
        }

        const result = await pool.query(
            `UPDATE denuncia_firmas 
             SET firma_base64 = $1, usado = TRUE, fecha_uso = CURRENT_TIMESTAMP
             WHERE token = $2 AND usado = FALSE
             RETURNING id`,
            [firma, token]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Token ya usado o inválido' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error al guardar firma:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

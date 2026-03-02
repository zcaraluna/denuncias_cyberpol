import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const denunciaId = parseInt(id);

        // Diagnóstico temporal
        const diag = await pool.query('SELECT current_database(), current_user');
        console.log('DEBUG: Conectado a:', diag.rows[0]);

        const result = await pool.query(
            'SELECT rol, usado, fecha_uso FROM denuncia_firmas WHERE denuncia_id = $1',
            [denunciaId]
        );

        return NextResponse.json({
            firmas: result.rows
        });
    } catch (error) {
        console.error('Error al obtener firmas:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const denunciaId = parseInt(id);

        // Verificar si ya existen tokens para esta denuncia
        const existing = await pool.query(
            'SELECT rol, token, usado FROM denuncia_firmas WHERE denuncia_id = $1',
            [denunciaId]
        );

        if (existing.rows.length > 0) {
            return NextResponse.json({
                tokens: existing.rows.reduce((acc: any, row) => {
                    acc[row.rol] = row.token;
                    return acc;
                }, {})
            });
        }

        // Generar nuevos tokens
        const tokenOperador = crypto.randomBytes(32).toString('hex');
        const tokenDenunciante = crypto.randomBytes(32).toString('hex');

        await pool.query(
            `INSERT INTO denuncia_firmas (denuncia_id, token, rol) VALUES 
             ($1, $2, 'operador'),
             ($1, $3, 'denunciante')`,
            [denunciaId, tokenOperador, tokenDenunciante]
        );

        return NextResponse.json({
            tokens: {
                operador: tokenOperador,
                denunciante: tokenDenunciante
            }
        });
    } catch (error) {
        console.error('Error al generar tokens de firma:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

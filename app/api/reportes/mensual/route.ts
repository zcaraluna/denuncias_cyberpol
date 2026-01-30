import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const mes = searchParams.get('mes')
        const año = searchParams.get('año')

        if (!mes || !año) {
            return NextResponse.json(
                { error: 'El mes y el año son requeridos' },
                { status: 400 }
            )
        }

        const primerDia = `${año}-${mes.padStart(2, '0')}-01`
        const ultimoDia = new Date(parseInt(año), parseInt(mes), 0).toISOString().split('T')[0]

        // 1. Resumen por Tipo de Denuncia (Capítulo)
        // Nota: tipo_denuncia en la BD es el específico, pero a veces se guarda el genérico.
        const porCapituloResult = await pool.query(
            `SELECT 
        COALESCE(tipo_denuncia, 'SIN ESPECIFICAR') as tipo,
        COUNT(*) as total
      FROM denuncias
      WHERE fecha_denuncia BETWEEN $1::DATE AND $2::DATE
        AND estado = 'completada'
      GROUP BY tipo_denuncia
      ORDER BY total DESC`,
            [primerDia, ultimoDia]
        )

        // 2. Denunciantes Recurrentes (más de una vez al mes)
        const recurrentesResult = await pool.query(
            `SELECT 
        den.nombres as denunciante,
        den.cedula,
        COUNT(d.id) as cantidad,
        ARRAY_AGG(d.orden || '/' || EXTRACT(YEAR FROM d.fecha_denuncia)::integer) as numeros_denuncia,
        ARRAY_AGG(COALESCE(d.tipo_denuncia, 'SIN ESPECIFICAR')) as tipos
      FROM denuncias d
      JOIN denunciantes den ON d.denunciante_id = den.id
      WHERE d.fecha_denuncia BETWEEN $1::DATE AND $2::DATE
        AND d.estado = 'completada'
      GROUP BY den.nombres, den.cedula
      HAVING COUNT(d.id) > 1
      ORDER BY cantidad DESC`,
            [primerDia, ultimoDia]
        )

        return NextResponse.json({
            resumen_tipos: porCapituloResult.rows,
            denunciantes_recurrentes: recurrentesResult.rows
        })
    } catch (error) {
        console.error('Error obteniendo resumen mensual:', error)
        return NextResponse.json(
            { error: 'Error al obtener resumen', details: error instanceof Error ? error.message : 'Error desconocido' },
            { status: 500 }
        )
    }
}

import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')

    if (!fecha) {
      return NextResponse.json(
        { error: 'La fecha es requerida' },
        { status: 400 }
      )
    }

    // Obtener denuncias del día con denunciante e involucrados
    const result = await pool.query(
      `SELECT 
        d.orden as numero_denuncia,
        EXTRACT(YEAR FROM d.fecha_denuncia) as año,
        d.hora_denuncia,
        d.tipo_denuncia as shp,
        den.nombres as denunciante,
        COALESCE(
          (
            SELECT string_agg(di2.nombres, ', ')
            FROM denuncias_involucrados di
            INNER JOIN denunciantes di2 ON di.denunciante_id = di2.id
            WHERE di.denuncia_id = d.id
          ),
          ''
        ) as interviniente
      FROM denuncias d
      LEFT JOIN denunciantes den ON d.denunciante_id = den.id
      WHERE d.fecha_denuncia::text = $1
        AND d.estado = 'completada'
      ORDER BY d.hora_denuncia ASC`,
      [fecha]
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error obteniendo reporte simple:', error)
    return NextResponse.json(
      { error: 'Error al obtener reporte' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(
      `SELECT 
        d.id,
        d.denunciante_id,
        d.orden as numero_orden,
        d.fecha_denuncia,
        d.hora_denuncia,
        d.tipo_denuncia as tipo_hecho,
        d.hash as hash_denuncia,
        d.estado,
        den.nombres as nombre_denunciante,
        den.cedula as cedula_denunciante
      FROM denuncias d
      LEFT JOIN denunciantes den ON d.denunciante_id = den.id
      WHERE d.estado = 'completada'
      ORDER BY d.fecha_denuncia DESC, d.hora_denuncia DESC`
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error obteniendo denuncias:', error)
    return NextResponse.json(
      { error: 'Error al obtener denuncias' },
      { status: 500 }
    )
  }
}


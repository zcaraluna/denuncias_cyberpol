import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioId = parseInt((await params).id)

    const result = await pool.query(
      `SELECT 
        d.id,
        d.orden as numero_orden,
        den.nombres as nombre_denunciante,
        den.cedula as cedula_denunciante,
        d.tipo_denuncia as tipo_hecho,
        d.fecha_denuncia,
        d.hora_denuncia,
        d.hash as hash_denuncia
      FROM denuncias d
      LEFT JOIN denunciantes den ON d.denunciante_id = den.id
      WHERE d.usuario_id = $1 AND d.estado = 'completada'
      ORDER BY d.fecha_denuncia DESC, d.hora_denuncia DESC
      LIMIT 1000`,
      [usuarioId]
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error obteniendo denuncias tomadas por usuario:', error)
    return NextResponse.json(
      { error: 'Error al obtener denuncias tomadas por usuario' },
      { status: 500 }
    )
  }
}


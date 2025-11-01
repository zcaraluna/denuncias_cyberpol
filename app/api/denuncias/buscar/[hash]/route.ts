import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const hash = (await params).hash

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
      WHERE d.hash = $1 AND d.estado = 'completada'
      LIMIT 1`,
      [hash]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Denuncia no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error buscando denuncia:', error)
    return NextResponse.json(
      { error: 'Error al buscar denuncia' },
      { status: 500 }
    )
  }
}


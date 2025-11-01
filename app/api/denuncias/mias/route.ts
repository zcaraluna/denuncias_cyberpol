import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const usuarioId = searchParams.get('usuario_id')

    if (!usuarioId) {
      return NextResponse.json(
        { error: 'usuario_id es requerido' },
        { status: 400 }
      )
    }

    const result = await pool.query(
      `SELECT 
        d.id,
        den.nombres as nombre_denunciante,
        den.cedula as cedula_denunciante,
        d.fecha_denuncia,
        d.hora_denuncia,
        d.orden as numero_orden,
        d.tipo_denuncia as tipo_hecho,
        d.hash as hash_denuncia,
        d.estado
      FROM denuncias d
      INNER JOIN denunciantes den ON d.denunciante_id = den.id
      WHERE d.usuario_id = $1
      ORDER BY d.creado_en DESC`,
      [usuarioId]
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error obteniendo denuncias del usuario:', error)
    return NextResponse.json(
      { error: 'Error al obtener denuncias' },
      { status: 500 }
    )
  }
}


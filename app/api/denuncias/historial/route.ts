import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    const cedula = searchParams.get('cedula')
    const hash = searchParams.get('hash')

    let query = 'SELECT * FROM historial_denuncias WHERE 1=1'
    const params: any[] = []
    let paramCount = 1

    if (fecha) {
      query += ` AND fecha_denuncia = $${paramCount}`
      params.push(fecha)
      paramCount++
    }

    if (cedula) {
      query += ` AND cedula_denunciante ILIKE $${paramCount}`
      params.push(`%${cedula}%`)
      paramCount++
    }

    if (hash) {
      query += ` AND hash_denuncia ILIKE $${paramCount}`
      params.push(`%${hash}%`)
      paramCount++
    }

    query += ' ORDER BY creado_en DESC LIMIT 100'

    const result = await pool.query(query, params)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error obteniendo historial:', error)
    return NextResponse.json(
      { error: 'Error al obtener el historial' },
      { status: 500 }
    )
  }
}


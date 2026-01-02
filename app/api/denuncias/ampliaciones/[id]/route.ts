import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const denuncia_id = parseInt(idStr)

    // Obtener todas las ampliaciones de la denuncia ordenadas por número
    const result = await pool.query(
      `SELECT * FROM ampliaciones_denuncia 
       WHERE denuncia_id = $1 
       ORDER BY numero_ampliacion ASC`,
      [denuncia_id]
    )

    return NextResponse.json({
      ampliaciones: result.rows
    })
  } catch (error) {
    console.error('Error obteniendo ampliaciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener ampliaciones' },
      { status: 500 }
    )
  }
}








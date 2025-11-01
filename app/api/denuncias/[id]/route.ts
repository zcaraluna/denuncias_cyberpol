import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    const result = await pool.query(
      `SELECT d.*, den.nombres as denunciante_nombres
       FROM denuncias d
       JOIN denunciantes den ON d.denunciante_id = den.id
       WHERE d.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Denuncia no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error obteniendo denuncia:', error)
    return NextResponse.json(
      { error: 'Error al obtener la denuncia' },
      { status: 500 }
    )
  }
}


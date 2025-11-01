import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await params).id)
    
    // Obtener usuario de la sesión (ya validado en el cliente)
    const body = await request.json()
    const usuarioId = body.usuarioId

    if (!usuarioId) {
      console.error('UsuarioId no encontrado en el body:', body)
      return NextResponse.json(
        { error: 'Usuario no especificado' },
        { status: 400 }
      )
    }

    // Registrar la visita
    await pool.query(
      `INSERT INTO visitas_denuncias (denuncia_id, usuario_id)
       VALUES ($1, $2)`,
      [id, usuarioId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error registrando visita:', error)
    return NextResponse.json(
      { error: 'Error al registrar visita' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET: Obtener un usuario específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    const result = await pool.query(
      'SELECT id, usuario, nombre, apellido, grado, oficina, rol, activo FROM usuarios WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error obteniendo usuario:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}

// PUT: Actualizar un usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const body = await request.json()
    const { nombre, apellido, grado, oficina, rol, activo, contraseña } = body

    // Validar rol si se proporciona
    if (rol && !['superadmin', 'admin', 'operador', 'supervisor'].includes(rol)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      )
    }

    let query: string
    let values: any[]

    if (contraseña) {
      // Si se proporciona contraseña, actualizar todo incluyendo contraseña
      const hashedPassword = await bcrypt.hash(contraseña, 10)
      query = `
        UPDATE usuarios 
        SET nombre = $1, apellido = $2, grado = $3, oficina = $4, rol = $5, activo = $6, contraseña = $7
        WHERE id = $8
        RETURNING id, usuario, nombre, apellido, grado, oficina, rol, activo
      `
      values = [nombre, apellido, grado, oficina, rol, activo, hashedPassword, id]
    } else {
      // Si no se proporciona contraseña, no actualizarla
      query = `
        UPDATE usuarios 
        SET nombre = $1, apellido = $2, grado = $3, oficina = $4, rol = $5, activo = $6
        WHERE id = $7
        RETURNING id, usuario, nombre, apellido, grado, oficina, rol, activo
      `
      values = [nombre, apellido, grado, oficina, rol, activo, id]
    }

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      usuario: result.rows[0]
    })
  } catch (error) {
    console.error('Error actualizando usuario:', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar un usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    const result = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 RETURNING id',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error eliminando usuario:', error)
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}


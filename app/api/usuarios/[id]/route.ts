import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET: Obtener un usuario específico (con filtrado regional y enmascaramiento para supervisores)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    // 1. Obtener la sesión del usuario para aplicar filtrado regional y enmascaramiento
    const usuarioCookie = request.cookies.get('usuario_sesion')?.value
    if (!usuarioCookie) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    let solicitante: { id: number; rol: string; oficina: string }
    try {
      solicitante = JSON.parse(decodeURIComponent(usuarioCookie))
    } catch (e) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    if (solicitante.rol === 'operador') {
      return NextResponse.json({ error: 'Acción no autorizada' }, { status: 403 })
    }

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

    const targetUser = result.rows[0]

    // Si es supervisor, solo puede ver usuarios de su misma oficina regional
    if (solicitante.rol === 'supervisor') {
      if (targetUser.oficina !== solicitante.oficina) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' }, // 404 por seguridad
          { status: 404 }
        )
      }
    }

    // Enmascarar el nombre de usuario si el observador es supervisor y no es su propio perfil
    const enmascarar = solicitante.rol === 'supervisor' && solicitante.id !== targetUser.id
    const responseData = {
      ...targetUser,
      usuario: enmascarar ? '••••••' : targetUser.usuario
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error obteniendo usuario:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}

// PUT: Actualizar un usuario (solo administradores)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    // Verificar sesión y rol
    const usuarioCookie = request.cookies.get('usuario_sesion')?.value
    if (!usuarioCookie) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    let realizador: { rol: string }
    try {
      realizador = JSON.parse(decodeURIComponent(usuarioCookie))
    } catch (e) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    // Solo superadmin y admin pueden editar usuarios a través de esta ruta general
    if (realizador.rol !== 'superadmin' && realizador.rol !== 'admin') {
      return NextResponse.json({ error: 'Acción no autorizada' }, { status: 403 })
    }

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
      // Si se proporciona contraseña, actualizar todo incluyendo contraseña y forzar cambio al iniciar
      const hashedPassword = await bcrypt.hash(contraseña, 10)
      query = `
        UPDATE usuarios 
        SET nombre = $1, apellido = $2, grado = $3, oficina = $4, rol = $5, activo = $6, contraseña = $7, debe_cambiar_contraseña = TRUE
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

// DELETE: Eliminar un usuario (solo administradores)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    // Verificar sesión y rol
    const usuarioCookie = request.cookies.get('usuario_sesion')?.value
    if (!usuarioCookie) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    let realizador: { id: number; rol: string }
    try {
      realizador = JSON.parse(decodeURIComponent(usuarioCookie))
    } catch (e) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    // Solo superadmin y admin pueden eliminar usuarios
    if (realizador.rol !== 'superadmin' && realizador.rol !== 'admin') {
      return NextResponse.json({ error: 'Acción no autorizada' }, { status: 403 })
    }

    // No permitir eliminar al propio usuario
    if (id === realizador.id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propio usuario' }, { status: 400 })
    }

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


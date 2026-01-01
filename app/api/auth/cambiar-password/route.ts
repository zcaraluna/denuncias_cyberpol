import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { usuario_id, contraseña_actual, nueva_contraseña, confirmar_contraseña } = await request.json()

    // Validar campos requeridos
    if (!usuario_id || !contraseña_actual || !nueva_contraseña || !confirmar_contraseña) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validar que las contraseñas nuevas coincidan
    if (nueva_contraseña !== confirmar_contraseña) {
      return NextResponse.json(
        { error: 'Las contraseñas nuevas no coinciden' },
        { status: 400 }
      )
    }

    // Validar longitud mínima de contraseña
    if (nueva_contraseña.length < 6) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar que la contraseña actual sea correcta y obtener datos del usuario
    const result = await pool.query(
      'SELECT id, usuario, contraseña, nombre, apellido, grado, oficina, rol, activo FROM usuarios WHERE id = $1',
      [usuario_id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const user = result.rows[0]

    if (!user.activo) {
      return NextResponse.json(
        { error: 'Usuario inactivo' },
        { status: 403 }
      )
    }

    const contraseñaValida = await bcrypt.compare(contraseña_actual, user.contraseña)

    if (!contraseñaValida) {
      return NextResponse.json(
        { error: 'La contraseña actual es incorrecta' },
        { status: 401 }
      )
    }

    // Verificar que la nueva contraseña sea diferente a la actual
    const mismaContraseña = await bcrypt.compare(nueva_contraseña, user.contraseña)
    if (mismaContraseña) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe ser diferente a la actual' },
        { status: 400 }
      )
    }

    // Hashear la nueva contraseña y actualizar
    const hashedPassword = await bcrypt.hash(nueva_contraseña, 10)

    await pool.query(
      'UPDATE usuarios SET contraseña = $1, debe_cambiar_contraseña = FALSE WHERE id = $2',
      [hashedPassword, usuario_id]
    )

    // Obtener el usuario actualizado de la base de datos (sin la contraseña)
    const usuarioActualizado = {
      id: user.id,
      usuario: user.usuario,
      nombre: user.nombre,
      apellido: user.apellido,
      grado: user.grado,
      oficina: user.oficina,
      rol: user.rol,
      debe_cambiar_contraseña: false, // Ya se actualizó a FALSE
    }

    // Crear respuesta con el usuario actualizado
    const response = NextResponse.json({
      success: true,
      mensaje: 'Contraseña actualizada correctamente',
      usuario: usuarioActualizado,
    })

    // Actualizar la cookie con el usuario actualizado (sin debe_cambiar_contraseña)
    const usuarioJson = encodeURIComponent(JSON.stringify(usuarioActualizado))
    response.cookies.set('usuario_sesion', usuarioJson, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error cambiando contraseña:', error)
    return NextResponse.json(
      { error: 'Error del servidor al cambiar la contraseña' },
      { status: 500 }
    )
  }
}


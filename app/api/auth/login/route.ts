import { NextRequest, NextResponse } from 'next/server'
import { verificarCredenciales } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { usuario, contraseña } = await request.json()

    if (!usuario || !contraseña) {
      return NextResponse.json(
        { error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const usuarioValidado = await verificarCredenciales(usuario, contraseña)

    if (!usuarioValidado) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Crear respuesta con el usuario
    const response = NextResponse.json({
      success: true,
      usuario: usuarioValidado,
    })

    // Establecer cookie con la información del usuario (válida por 7 días)
    // Usar encodeURIComponent para manejar caracteres especiales
    const usuarioJson = encodeURIComponent(JSON.stringify(usuarioValidado))
    response.cookies.set('usuario_sesion', usuarioJson, {
      httpOnly: false, // Permitir acceso desde JS para compatibilidad con sessionStorage
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Cambiado de 'strict' a 'lax' para mejor compatibilidad
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}


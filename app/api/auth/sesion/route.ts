import { NextRequest, NextResponse } from 'next/server'
import { verificarCredenciales } from '@/lib/auth'

/**
 * GET: Verifica la sesión actual del usuario desde la cookie
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener la información del usuario de la cookie
    const usuarioCookie = request.cookies.get('usuario_sesion')?.value
    
    if (!usuarioCookie) {
      return NextResponse.json(
        { autenticado: false, usuario: null },
        { status: 200 }
      )
    }

    try {
      const usuario = JSON.parse(decodeURIComponent(usuarioCookie))
      return NextResponse.json({
        autenticado: true,
        usuario: usuario,
      })
    } catch (error) {
      // Cookie inválida, limpiarla
      const response = NextResponse.json(
        { autenticado: false, usuario: null },
        { status: 200 }
      )
      response.cookies.delete('usuario_sesion')
      return response
    }
  } catch (error) {
    console.error('Error verificando sesión:', error)
    return NextResponse.json(
      { autenticado: false, usuario: null, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST: Restaura la cookie desde los datos del usuario (útil cuando sessionStorage tiene datos pero la cookie se perdió)
 */
export async function POST(request: NextRequest) {
  try {
    const { usuario } = await request.json()
    
    if (!usuario || !usuario.id) {
      return NextResponse.json(
        { error: 'Datos de usuario requeridos' },
        { status: 400 }
      )
    }

    // Establecer cookie con la información del usuario
    const usuarioJson = encodeURIComponent(JSON.stringify(usuario))
    const response = NextResponse.json({
      success: true,
      mensaje: 'Cookie restaurada correctamente',
    })
    
    response.cookies.set('usuario_sesion', usuarioJson, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/',
    })
    
    return response
  } catch (error) {
    console.error('Error restaurando cookie:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE: Cierra la sesión del usuario
 */
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      mensaje: 'Sesión cerrada correctamente',
    })
    
    // Eliminar la cookie de sesión
    response.cookies.delete('usuario_sesion')
    
    return response
  } catch (error) {
    console.error('Error cerrando sesión:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { leerSesion, firmarSesion, verificarValorSesion, COOKIE_SESION, opcionesCookieSesion } from '@/lib/sesion'

/**
 * GET: Verifica la sesión actual del usuario desde la cookie firmada.
 */
export async function GET(request: NextRequest) {
  try {
    const usuario = leerSesion(request)

    if (!usuario) {
      // Cookie ausente, manipulada o en formato antiguo (sin firma): no autenticado.
      const response = NextResponse.json(
        { autenticado: false, usuario: null },
        { status: 200 }
      )
      // Limpiar cualquier cookie inválida/antigua para evitar reintentos.
      response.cookies.delete(COOKIE_SESION)
      return response
    }

    return NextResponse.json({
      autenticado: true,
      usuario,
    })
  } catch (error) {
    console.error('Error verificando sesión:', error)
    return NextResponse.json(
      { autenticado: false, usuario: null, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST: Refresca la cookie de sesión SOLO si ya existe una cookie firmada válida.
 *
 * A diferencia de la versión anterior, NO reconstruye la sesión a partir de los
 * datos que envía el cliente (eso permitía suplantar identidad y escalar
 * privilegios enviando un rol arbitrario). Si no hay una sesión firmada válida,
 * el usuario debe volver a iniciar sesión.
 */
export async function POST(request: NextRequest) {
  try {
    const usuario = verificarValorSesion(request.cookies.get(COOKIE_SESION)?.value)

    if (!usuario) {
      return NextResponse.json(
        { error: 'Sesión no válida. Debe iniciar sesión nuevamente.' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({
      success: true,
      mensaje: 'Sesión refrescada correctamente',
    })

    // Re-firmar con la misma identidad verificada (renueva la expiración).
    response.cookies.set(COOKIE_SESION, firmarSesion(usuario), opcionesCookieSesion())

    return response
  } catch (error) {
    console.error('Error refrescando sesión:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE: Cierra la sesión del usuario.
 */
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      mensaje: 'Sesión cerrada correctamente',
    })

    response.cookies.delete(COOKIE_SESION)

    return response
  } catch (error) {
    console.error('Error cerrando sesión:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

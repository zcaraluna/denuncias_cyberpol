import { NextRequest, NextResponse } from 'next/server'
import { verificarCredenciales, verificarRestriccionesDispositivo } from '@/lib/auth'
import { firmarSesion, COOKIE_SESION, opcionesCookieSesion } from '@/lib/sesion'

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

    // Verificar restricciones de dispositivo
    const fingerprint = request.cookies.get('device_fingerprint')?.value
    if (fingerprint) {
      const restriccion = await verificarRestriccionesDispositivo(
        fingerprint,
        usuarioValidado.id,
        usuarioValidado.oficina,
        usuarioValidado.rol
      )

      if (!restriccion.valido) {
        return NextResponse.json(
          { error: restriccion.mensaje || 'Dispositivo no autorizado para este usuario.' },
          { status: 403 }
        )
      }
    } else {
      // Bloquear login si no tiene fingerprint y no es developer
      if (usuarioValidado.rol !== 'developer') {
        return NextResponse.json(
          { error: 'Este terminal no está autorizado. Ingrese el código de activación primero.' },
          { status: 403 }
        )
      }
    }

    // Crear respuesta con el usuario
    const response = NextResponse.json({
      success: true,
      usuario: usuarioValidado,
      debe_cambiar_contraseña: usuarioValidado.debe_cambiar_contraseña ?? false,
    })

    // Establecer cookie de sesión FIRMADA (HMAC) para impedir manipulación del
    // rol/oficina desde el cliente. Es httpOnly: el cliente usa sessionStorage
    // (que recibe `usuario` en el cuerpo de la respuesta), no la cookie.
    response.cookies.set(COOKIE_SESION, firmarSesion(usuarioValidado), opcionesCookieSesion())

    return response
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { verificarCredenciales, verificarRestriccionesDispositivo } from '@/lib/auth'

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


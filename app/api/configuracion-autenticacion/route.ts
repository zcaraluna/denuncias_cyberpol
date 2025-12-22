import { NextRequest, NextResponse } from 'next/server';
import { seRequiereAutenticacionDispositivo, establecerRequiereAutenticacionDispositivo } from '@/lib/auth';

/**
 * GET: Obtiene el estado actual de si se requiere autenticación de dispositivo
 */
export async function GET(request: NextRequest) {
  try {
    const requiere = await seRequiereAutenticacionDispositivo();
    return NextResponse.json({ requiere });
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST: Establece si se requiere autenticación de dispositivo
 * Solo usuarios garv (o superadmin) pueden hacer esto
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requiere, usuario, usuario_rol } = body;

    // Verificar que sea garv o superadmin
    if (usuario !== 'garv' && usuario_rol !== 'superadmin') {
      return NextResponse.json(
        { error: 'Solo el usuario garv o superadmin puede cambiar esta configuración' },
        { status: 403 }
      );
    }

    if (typeof requiere !== 'boolean') {
      return NextResponse.json(
        { error: 'El parámetro requiere debe ser boolean' },
        { status: 400 }
      );
    }

    const exito = await establecerRequiereAutenticacionDispositivo(requiere);

    if (!exito) {
      return NextResponse.json(
        { error: 'Error al actualizar configuración' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      requiere,
      mensaje: requiere 
        ? 'Autenticación de dispositivo activada' 
        : 'Autenticación de dispositivo desactivada (modo demostración)'
    });

    // Si se desactiva el requisito, establecer cookie para que el middleware permita acceso
    // Si se reactiva, eliminar la cookie para que el middleware vuelva a requerir autenticación
    if (!requiere) {
      response.cookies.set('demo_mode_allowed', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 horas
        path: '/',
      });
    } else {
      response.cookies.delete('demo_mode_allowed');
    }

    return response;
  } catch (error) {
    console.error('Error estableciendo configuración:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}


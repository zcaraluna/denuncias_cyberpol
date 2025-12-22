import { NextRequest, NextResponse } from 'next/server';
import { verificarDispositivoAutorizado, generarFingerprint } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { fingerprint } = await request.json();

    if (!fingerprint || typeof fingerprint !== 'string') {
      return NextResponse.json(
        { error: 'Fingerprint requerido' },
        { status: 400 }
      );
    }

    // Verificar si el dispositivo está autorizado
    const estaAutorizado = await verificarDispositivoAutorizado(fingerprint);

    if (!estaAutorizado) {
      return NextResponse.json(
        { error: 'Dispositivo no autorizado' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      autorizado: true,
    });
  } catch (error) {
    console.error('Error verificando dispositivo:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

// GET endpoint para verificar usando la cookie del request
export async function GET(request: NextRequest) {
  try {
    // Verificar si el modo demo está activo (cookie establecida por el middleware o la API de configuración)
    const modoDemo = request.cookies.get('demo_mode_allowed')?.value === 'true';
    
    // Si el modo demo está activo, permitir acceso sin verificar dispositivo
    if (modoDemo) {
      return NextResponse.json({
        autorizado: true,
        fingerprint: null,
        modoDemo: true,
      });
    }

    // Obtener el fingerprint de la cookie
    const fingerprintCookie = request.cookies.get('device_fingerprint')?.value;
    
    // Si no hay cookie, directamente devolver que no está autorizado
    if (!fingerprintCookie) {
      return NextResponse.json({
        autorizado: false,
        fingerprint: null,
      });
    }

    // Verificar si el dispositivo está autorizado
    const estaAutorizado = await verificarDispositivoAutorizado(fingerprintCookie);

    // Si no está autorizado, limpiar la cookie
    if (!estaAutorizado) {
      const response = NextResponse.json({
        autorizado: false,
        fingerprint: fingerprintCookie,
      });
      response.cookies.delete('device_fingerprint');
      return response;
    }

    // Está autorizado
    return NextResponse.json({
      autorizado: true,
      fingerprint: fingerprintCookie,
    });
  } catch (error) {
    console.error('Error verificando dispositivo:', error);
    return NextResponse.json(
      { error: 'Error del servidor', autorizado: false, fingerprint: null },
      { status: 500 }
    );
  }
}


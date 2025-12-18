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

// GET endpoint para verificar usando la cookie del request (preferido) o user-agent
export async function GET(request: NextRequest) {
  try {
    // Primero intentar obtener el fingerprint de la cookie
    const fingerprintCookie = request.cookies.get('device_fingerprint')?.value;
    
    let fingerprint: string;
    let usarCookie = false;
    
    if (fingerprintCookie) {
      // Usar el fingerprint de la cookie
      fingerprint = fingerprintCookie;
      usarCookie = true;
    } else {
      // Si no hay cookie, generar del user-agent (pero esto no debería pasar en producción)
      const userAgent = request.headers.get('user-agent') || '';
      fingerprint = generarFingerprint(userAgent);
    }

    const estaAutorizado = await verificarDispositivoAutorizado(fingerprint);

    // Si no está autorizado y había cookie, limpiarla
    if (!estaAutorizado && usarCookie) {
      const response = NextResponse.json({
        autorizado: false,
        fingerprint: fingerprint,
      });
      response.cookies.delete('device_fingerprint');
      return response;
    }

    return NextResponse.json({
      autorizado: estaAutorizado,
      fingerprint: fingerprint,
    });
  } catch (error) {
    console.error('Error verificando dispositivo:', error);
    return NextResponse.json(
      { error: 'Error del servidor', autorizado: false },
      { status: 500 }
    );
  }
}


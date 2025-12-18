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

// GET endpoint para verificar usando el user-agent del request
export async function GET(request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent') || '';
    const fingerprint = generarFingerprint(userAgent);

    const estaAutorizado = await verificarDispositivoAutorizado(fingerprint);

    return NextResponse.json({
      autorizado: estaAutorizado,
      fingerprint: fingerprint,
    });
  } catch (error) {
    console.error('Error verificando dispositivo:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}


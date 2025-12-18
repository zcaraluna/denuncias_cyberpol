import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/debug-ip
 * Endpoint de debugging para verificar IP del cliente
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener IP del cliente desde headers
    const realIp = request.headers.get('x-real-ip');
    const forwardedFor = request.headers.get('x-forwarded-for');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    
    const clientIp = realIp || 
      (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || 
      cfConnectingIp || 
      'unknown';

    return NextResponse.json({
      clientIp,
      headers: {
        'x-real-ip': request.headers.get('x-real-ip'),
        'x-forwarded-for': request.headers.get('x-forwarded-for'),
        'cf-connecting-ip': request.headers.get('cf-connecting-ip'),
        'host': request.headers.get('host'),
      },
      debug: {
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Error al obtener información de IP',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware básico
 * 
 * Por ahora no realiza ninguna verificación especial.
 */
export async function middleware(request: NextRequest) {
  // Permitir todo el tráfico
  return NextResponse.next();
}

// Configurar qué rutas deben pasar por el middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

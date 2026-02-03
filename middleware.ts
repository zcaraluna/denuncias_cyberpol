import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware para verificar autorización de dispositivos
 * 
 * Verifica que el dispositivo tenga la cookie de autorización.
 * La validación real contra la base de datos se hace en las rutas API protegidas.
 * 
 * Nota: Este middleware corre en Edge Runtime, por lo que no puede acceder directamente
 * a la base de datos. La validación completaaaaaaaaaa se hace en las rutas API.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas que NO requieren autorización de dispositivo
  const rutasPublicas = [
    '/autenticar',
    '/api/autenticar',
    '/api/verificar-dispositivo',
    '/api/auth/login', // El login también debe ser accesible sin dispositivo autorizado
    '/api/auth/sesion', // Verificación de sesión
    '/api/auth/cambiar-password', // Cambio de contraseña (accesible después de login)
    '/cambiar-password', // Página de cambio de contraseña
    '/verificar', // Página pública para verificar denuncias
    '/api/verificar', // API pública para verificar denuncias
  ];

  // Verificar si es una ruta pública
  const esRutaPublica = rutasPublicas.some(ruta =>
    pathname === ruta || pathname.startsWith(ruta)
  );

  if (esRutaPublica) {
    return NextResponse.next();
  }

  // Obtener el fingerprint de la cookie
  const fingerprint = request.cookies.get('device_fingerprint')?.value;

  // Si no tiene fingerprint, redirigir a /autenticar
  if (!fingerprint) {
    // Solo redirigir si no está ya en /autenticar
    if (pathname !== '/autenticar') {
      const url = request.nextUrl.clone();
      url.pathname = '/autenticar';
      return NextResponse.redirect(url);
    }
  }

  // Permitir el acceso - la validación real se hace en las rutas API
  // Las páginas también pueden verificar en el cliente antes de cargar datos
  return NextResponse.next();
}

// Configurar qué rutas deben pasar por el middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};

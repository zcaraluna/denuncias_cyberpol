import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware para verificar autorización de dispositivos
 * 
 * Verifica que el dispositivo tenga la cookie de autorización.
 * La validación real contra la base de datos se hace en las rutas API protegidas.
 * 
 * Nota: Este middleware corre en Edge Runtime, por lo que no puede acceder directamente
 * a la base de datos. La validación completa (contra la BD) se hace en las rutas API;
 * aquí solo se comprueba la presencia y el formato del fingerprint.
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
    '/firmar', // Página pública para firmar denuncias
    '/api/firmas', // API pública para firmar denuncias
  ];

  // Verificar si es una ruta pública
  const esRutaPublica = rutasPublicas.some(ruta =>
    pathname === ruta || pathname.startsWith(ruta)
  );

  if (esRutaPublica) {
    return NextResponse.next();
  }

  // Obtener el fingerprint de la cookie. El fingerprint real es un SHA-256
  // (64 caracteres hexadecimales); cualquier otro valor se considera inválido
  // para descartar cookies manipuladas o basura antes de servir la página.
  // La validación fuerte contra la base de datos se realiza en las rutas API.
  const fingerprint = request.cookies.get('device_fingerprint')?.value;
  const fingerprintValido = typeof fingerprint === 'string' && /^[a-f0-9]{64}$/i.test(fingerprint);

  // Si no tiene un fingerprint válido, redirigir a /autenticar
  if (!fingerprintValido) {
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

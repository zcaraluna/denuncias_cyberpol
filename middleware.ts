import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verificarDispositivoAutorizado, generarFingerprint } from '@/lib/auth';

/**
 * Middleware para verificar autorización de dispositivos
 * 
 * Verifica que el dispositivo esté realmente autorizado en la base de datos.
 * Excepciones: /autenticar y rutas de API públicas.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas que NO requieren autorización de dispositivo
  const rutasPublicas = [
    '/autenticar',
    '/api/autenticar',
    '/api/verificar-dispositivo',
    '/api/auth/login', // El login también debe ser accesible sin dispositivo autorizado
  ];

  // Verificar si es una ruta pública
  const esRutaPublica = rutasPublicas.some(ruta => 
    pathname === ruta || pathname.startsWith(ruta)
  );

  if (esRutaPublica) {
    return NextResponse.next();
  }

  // Obtener el fingerprint de la cookie
  const fingerprintCookie = request.cookies.get('device_fingerprint')?.value;

  // Si no tiene fingerprint en cookie, generar uno del user-agent y verificar
  let fingerprint = fingerprintCookie;
  
  if (!fingerprint) {
    // Generar fingerprint del user-agent actual
    const userAgent = request.headers.get('user-agent') || '';
    fingerprint = generarFingerprint(userAgent);
    
    // Si no hay cookie, definitivamente no está autorizado
    const url = request.nextUrl.clone();
    url.pathname = '/autenticar';
    const response = NextResponse.redirect(url);
    // Limpiar cookie inválida si existe
    response.cookies.delete('device_fingerprint');
    return response;
  }

  // Verificar contra la base de datos que el dispositivo está realmente autorizado
  try {
    const estaAutorizado = await verificarDispositivoAutorizado(fingerprint);
    
    if (!estaAutorizado) {
      // Dispositivo no autorizado, redirigir a /autenticar y limpiar cookie
      const url = request.nextUrl.clone();
      url.pathname = '/autenticar';
      const response = NextResponse.redirect(url);
      response.cookies.delete('device_fingerprint');
      return response;
    }
    
    // Dispositivo autorizado, permitir acceso
    return NextResponse.next();
  } catch (error) {
    // En caso de error de BD, por seguridad redirigir a autenticar
    console.error('Error verificando dispositivo en middleware:', error);
    const url = request.nextUrl.clone();
    url.pathname = '/autenticar';
    const response = NextResponse.redirect(url);
    response.cookies.delete('device_fingerprint');
    return response;
  }
}

// Configurar qué rutas deben pasar por el middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};

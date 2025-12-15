import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isVpnConnected, getClientIp } from './lib/vpn-utils';

/**
 * Middleware para verificar conexión VPN
 * 
 * Si VPN_REQUIRED está habilitado, solo permite acceso desde IPs de la red VPN
 * Excepciones: rutas públicas, API de autenticación, y página de configuración VPN
 */
export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    const hostname = request.headers.get('host') || request.nextUrl.hostname;
    
    // Verificar si la verificación VPN está habilitada
    const vpnRequiredEnv = process.env.VPN_REQUIRED;
    const vpnRequired = vpnRequiredEnv === 'true';
  
    // Si VPN_REQUIRED no es exactamente 'true', permitir todo el tráfico
    if (!vpnRequired) {
      return NextResponse.next();
    }

    // Verificar si este dominio/subdominio requiere VPN
    const vpnRequiredDomains = process.env.VPN_REQUIRED_DOMAINS;
    if (vpnRequiredDomains) {
      const allowedDomains = vpnRequiredDomains.split(',').map(d => d.trim().toLowerCase());
      let currentHost = hostname.toLowerCase();
      
      // Si es localhost, IP, o puerto, usar NEXT_PUBLIC_URL_BASE para obtener el dominio real
      const isLocalhostOrIp = currentHost.startsWith('localhost') || 
                              currentHost.startsWith('127.0.0.1') || 
                              currentHost === 'localhost' ||
                              (currentHost.includes(':') && (currentHost.startsWith('localhost') || currentHost.startsWith('127.0.0.1') || /^\d+\.\d+\.\d+\.\d+/.test(currentHost)));
      
      if (isLocalhostOrIp) {
        const siteUrl = process.env.NEXT_PUBLIC_URL_BASE;
        if (siteUrl) {
          try {
            const url = new URL(siteUrl);
            currentHost = url.hostname.toLowerCase();
          } catch {
            if (process.env.NODE_ENV === 'development') {
              return NextResponse.next();
            }
          }
        } else if (process.env.NODE_ENV === 'development') {
          return NextResponse.next();
        }
      }
      
      // Verificar si el dominio actual requiere VPN
      const requiresVpn = allowedDomains.some(domain => 
        currentHost === domain || currentHost.endsWith('.' + domain)
      );
      
      if (!requiresVpn) {
        return NextResponse.next();
      }
    }

    // Rutas que no requieren VPN
    const isPublicPath = 
      pathname === '/favicon.ico' ||
      pathname.startsWith('/vpn-setup') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/vpn/check-status') ||
      pathname.startsWith('/api/vpn/connections') ||
      pathname.startsWith('/api/debug-ip');

    if (isPublicPath) {
      return NextResponse.next();
    }

    // Verificar conexión VPN
    const clientIp = getClientIp(request);
    const isConnected = await isVpnConnected(request);

    if (!isConnected) {
      // Redirigir a página de instrucciones VPN
      const url = request.nextUrl.clone();
      url.pathname = '/vpn-setup';
      url.searchParams.set('redirect', pathname);
      url.searchParams.set('ip', clientIp);
      
      return NextResponse.redirect(url);
    }

    // Agregar header con información de VPN para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      const response = NextResponse.next();
      response.headers.set('X-VPN-IP', clientIp);
      response.headers.set('X-VPN-Status', 'connected');
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    // Si hay un error, loguearlo pero permitir el acceso para no romper la aplicación
    console.error(`[VPN Middleware] ERROR:`, error);
    return NextResponse.next();
  }
}

// Configurar qué rutas deben pasar por el middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};


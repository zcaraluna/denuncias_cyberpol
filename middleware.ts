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
  // Logging inicial para verificar que el middleware se ejecuta
  try {
    const pathname = request.nextUrl.pathname;
    const hostname = request.headers.get('host') || request.nextUrl.hostname;
    console.log(`[VPN Middleware] INICIO - Host: ${hostname}, Path: ${pathname}`);
    
    // Verificar si la verificación VPN está habilitada
    const vpnRequiredEnv = process.env.VPN_REQUIRED;
    const vpnRequired = vpnRequiredEnv === 'true';
    console.log(`[VPN Middleware] VPN_REQUIRED env=${vpnRequiredEnv}, parsed=${vpnRequired}`);
  
    // Si VPN_REQUIRED no es exactamente 'true', permitir todo el tráfico
    if (!vpnRequired) {
      console.log(`[VPN Middleware] VPN no requerido (env=${vpnRequiredEnv}), permitiendo acceso`);
      return NextResponse.next();
    }

    // Verificar si este dominio/subdominio requiere VPN
    const vpnRequiredDomains = process.env.VPN_REQUIRED_DOMAINS;
    if (vpnRequiredDomains) {
      const allowedDomains = vpnRequiredDomains.split(',').map(d => d.trim().toLowerCase());
      let currentHost = hostname.toLowerCase();
      
      // Si es localhost, IP, o puerto, usar NEXT_PUBLIC_SITE_URL o NEXT_PUBLIC_URL_BASE para obtener el dominio real
      const isLocalhostOrIp = currentHost.startsWith('localhost') || 
                              currentHost.startsWith('127.0.0.1') || 
                              currentHost === 'localhost' ||
                              (currentHost.includes(':') && (currentHost.startsWith('localhost') || currentHost.startsWith('127.0.0.1') || /^\d+\.\d+\.\d+\.\d+/.test(currentHost)));
      
      if (isLocalhostOrIp) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_URL_BASE;
        if (siteUrl) {
          try {
            const url = new URL(siteUrl);
            currentHost = url.hostname.toLowerCase();
            console.log(`[VPN Middleware] Hostname detectado como ${hostname}, usando dominio ${currentHost} desde NEXT_PUBLIC_SITE_URL`);
          } catch (e) {
            console.error(`[VPN Middleware] Error parseando NEXT_PUBLIC_SITE_URL: ${siteUrl}`, e);
            if (process.env.NODE_ENV === 'development') {
              console.log(`[VPN Middleware] Modo desarrollo - permitiendo acceso desde localhost`);
              return NextResponse.next();
            }
          }
        } else if (process.env.NODE_ENV === 'development') {
          console.log(`[VPN Middleware] Modo desarrollo - permitiendo acceso desde localhost`);
          return NextResponse.next();
        } else {
          console.log(`[VPN Middleware] Acceso por localhost/IP en producción sin NEXT_PUBLIC_SITE_URL - aplicando VPN`);
        }
      }
      
      // Verificar si el dominio actual requiere VPN
      const requiresVpn = allowedDomains.some(domain => 
        currentHost === domain || currentHost.endsWith('.' + domain)
      );
      
      if (!requiresVpn) {
        console.log(`[VPN Middleware] Dominio ${currentHost} no requiere VPN (no está en VPN_REQUIRED_DOMAINS), permitiendo acceso`);
        return NextResponse.next();
      }
      
      console.log(`[VPN Middleware] Dominio ${currentHost} requiere VPN`);
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
      console.log(`[VPN Middleware] Ruta pública, permitiendo acceso: ${pathname}`);
      return NextResponse.next();
    }

    // Verificar conexión VPN
    const clientIp = getClientIp(request);
    const isConnected = await isVpnConnected(request);
    const vpnRange = process.env.VPN_RANGE || '10.8.0.0/24';

    // Logging para debugging
    console.log(`[VPN Middleware] Path: ${pathname}, IP: ${clientIp}, VPN Range: ${vpnRange}, Connected: ${isConnected}`);

    if (!isConnected) {
      // Redirigir a página de instrucciones VPN
      const url = request.nextUrl.clone();
      url.pathname = '/vpn-setup';
      url.searchParams.set('redirect', pathname);
      url.searchParams.set('ip', clientIp);
      
      console.log(`[VPN Middleware] Bloqueando acceso - IP: ${clientIp} no está en rango VPN ${vpnRange}`);
      return NextResponse.redirect(url);
    }

    console.log(`[VPN Middleware] Acceso permitido - IP: ${clientIp} está en rango VPN`);

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



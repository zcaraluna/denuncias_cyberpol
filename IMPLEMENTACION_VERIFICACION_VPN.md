# Implementación de Verificación VPN

Esta documentación describe cómo implementar la verificación VPN en un proyecto Next.js, similar a como está implementado en `cyberpol-denuncias` y `controldeacceso`.

## 📋 Resumen

El sistema verifica que los usuarios estén conectados a una VPN antes de permitir el acceso a la aplicación. Utiliza el archivo de estado de OpenVPN (`/var/log/openvpn-status.log`) para verificar conexiones activas.

## 🏗️ Arquitectura

```
Cliente → Nginx (con headers) → Next.js Middleware → Verificación VPN → API de Estado → Archivo OpenVPN
```

## 📁 Archivos a Crear/Modificar

### 1. Middleware (`middleware.ts`)

**Ubicación:** `middleware.ts` (raíz del proyecto)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isVpnConnected, getClientIp } from './lib/vpn-utils';

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    const hostname = request.headers.get('host') || request.nextUrl.hostname;
    console.log(`[VPN Middleware] INICIO - Host: ${hostname}, Path: ${pathname}`);

    const vpnRequiredEnv = process.env.VPN_REQUIRED;
    const vpnRequired = vpnRequiredEnv === 'true';
    console.log(`[VPN Middleware] VPN_REQUIRED env=${vpnRequiredEnv}, parsed=${vpnRequired}`);

    if (!vpnRequired) {
      console.log(`[VPN Middleware] VPN no requerido (env=${vpnRequiredEnv}), permitiendo acceso`);
      return NextResponse.next();
    }

    const vpnRequiredDomains = process.env.VPN_REQUIRED_DOMAINS;
    if (vpnRequiredDomains) {
      const allowedDomains = vpnRequiredDomains.split(',').map(d => d.trim().toLowerCase());
      let currentHost = hostname.toLowerCase();

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

      const requiresVpn = allowedDomains.some(domain =>
        currentHost === domain || currentHost.endsWith('.' + domain)
      );

      if (!requiresVpn) {
        console.log(`[VPN Middleware] Dominio ${currentHost} no requiere VPN (no está en VPN_REQUIRED_DOMAINS), permitiendo acceso`);
        return NextResponse.next();
      }

      console.log(`[VPN Middleware] Dominio ${currentHost} requiere VPN`);
    }

    const isPublicPath =
      pathname === '/favicon.ico' ||
      pathname.startsWith('/vpn-setup') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/vpn/connections') ||
      pathname.startsWith('/api/vpn/check-status') ||
      pathname.startsWith('/api/debug-ip');

    if (isPublicPath) {
      console.log(`[VPN Middleware] Ruta pública, permitiendo acceso: ${pathname}`);
      return NextResponse.next();
    }

    const clientIp = getClientIp(request);
    const isConnected = await isVpnConnected(request);
    const vpnRange = process.env.VPN_RANGE || '10.8.0.0/24';

    console.log(`[VPN Middleware] Path: ${pathname}, IP: ${clientIp}, VPN Range: ${vpnRange}, Connected: ${isConnected}`);

    if (!isConnected) {
      const url = request.nextUrl.clone();
      url.pathname = '/vpn-setup';
      url.searchParams.set('redirect', pathname);
      url.searchParams.set('ip', clientIp);

      console.log(`[VPN Middleware] Bloqueando acceso - IP: ${clientIp} no está en rango VPN ${vpnRange}`);
      return NextResponse.redirect(url);
    }

    if (process.env.NODE_ENV === 'development') {
      const response = NextResponse.next();
      response.headers.set('X-VPN-IP', clientIp);
      response.headers.set('X-VPN-Status', 'connected');
      return response;
    }

    console.log(`[VPN Middleware] Acceso permitido - IP: ${clientIp} está en rango VPN`);
    return NextResponse.next();
  } catch (error) {
    console.error(`[VPN Middleware] ERROR:`, error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 2. Utilidades VPN (`lib/vpn-utils.ts`)

**Ubicación:** `lib/vpn-utils.ts`

```typescript
/**
 * Verifica si una IP está en el rango VPN especificado
 * @param ip - IP a verificar (ej: "10.8.0.6")
 * @param vpnRange - Rango VPN en formato CIDR (ej: "10.8.0.0/24")
 * @returns true si la IP está en el rango
 */
export function isIpInVpnRange(ip: string, vpnRange: string = '10.8.0.0/24'): boolean {
  const [rangeIp, prefixLength] = vpnRange.split('/');
  const prefix = parseInt(prefixLength, 10);
  
  if (!prefix || prefix < 0 || prefix > 32) {
    return false;
  }
  
  const ipToNumber = (ip: string): number => {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  };
  
  const rangeNum = ipToNumber(rangeIp);
  const ipNum = ipToNumber(ip);
  const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0;
  
  return (rangeNum & mask) === (ipNum & mask);
}

/**
 * Extrae la IP real del cliente desde los headers de la solicitud
 * Prioridad: x-real-ip > x-forwarded-for > cf-connecting-ip
 * @param request - Request de Next.js
 * @returns IP del cliente
 */
export function getClientIp(request: Request): string {
  const headers = (request as any).headers || new Headers();
  
  // Prioridad 1: X-Real-IP (Nginx)
  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) {
    const ip = xRealIp.split(',')[0].trim();
    if (ip) return ip;
  }
  
  // Prioridad 2: X-Forwarded-For
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const ip = xForwardedFor.split(',')[0].trim();
    if (ip) return ip;
  }
  
  // Prioridad 3: CF-Connecting-IP (Cloudflare)
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  
  // Fallback: intentar obtener desde la URL o usar IP por defecto
  try {
    const url = new URL(request.url);
    return url.hostname || '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
}

/**
 * Verifica si el cliente tiene una conexión VPN activa
 * @param request - Request de Next.js
 * @returns Promise<boolean> - true si hay conexión VPN activa
 */
export async function isVpnConnected(request: Request): Promise<boolean> {
  const clientIp = getClientIp(request);
  const vpnRange = process.env.VPN_RANGE || '10.8.0.0/24';

  // Primera verificación: IP está en rango VPN
  if (isIpInVpnRange(clientIp, vpnRange)) {
    return true;
  }

  // Segunda verificación: consultar archivo de estado de OpenVPN
  try {
    const apiUrl = process.env.VPN_API_URL || 'http://127.0.0.1:3000';
    const checkUrl = `${apiUrl}/api/vpn/check-status?realIp=${encodeURIComponent(clientIp)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    try {
      const response = await fetch(checkUrl, {
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log(`[VPN Utils] Verificación para IP ${clientIp}:`, data);
        return data.isActive === true;
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name !== 'AbortError') {
        console.error('[VPN Utils] Error verificando estado:', fetchError.message);
      }
    }
  } catch (error) {
    console.error('[VPN Utils] Error verificando conexión activa:', error);
  }

  return false;
}
```

### 3. API de Verificación de Estado (`app/api/vpn/check-status/route.ts`)

**Ubicación:** `app/api/vpn/check-status/route.ts`

Este archivo lee y parsea el archivo de estado de OpenVPN. Ver archivo completo en el proyecto, pero los puntos clave son:

- Lee `/var/log/openvpn-status.log`
- Parsea secciones `CLIENT_LIST` y `ROUTING_TABLE`
- Detecta líneas que empiezan con `CLIENT_LIST,` y `ROUTING_TABLE,`
- Determina si la conexión está activa basándose en `Last Ref` (últimos 15 segundos)

**Formato del archivo de estado:**
```
HEADER,CLIENT_LIST,Common Name,Real Address,Virtual Address,...
CLIENT_LIST,DCHPEF-1-ASU,181.91.85.248:30517,10.8.0.6,,58735,59234,2025-12-16 02:06:42,...
HEADER,ROUTING_TABLE,Virtual Address,Common Name,Real Address,Last Ref,...
ROUTING_TABLE,10.8.0.6,DCHPEF-1-ASU,181.91.85.248:30517,2025-12-16 02:17:36,...
```

### 4. API de Debug (`app/api/debug-ip/route.ts`)

**Ubicación:** `app/api/debug-ip/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, isIpInVpnRange, isVpnConnected } from '@/lib/vpn-utils';

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const vpnRange = process.env.VPN_RANGE || '10.8.0.0/24';
    const isInRange = isIpInVpnRange(clientIp, vpnRange);
    
    const isConnected = await isVpnConnected(request);

    return NextResponse.json({
      clientIp,
      vpnRange,
      isInVpnRange: isInRange,
      isVpnConnected: isConnected,
      headers: {
        'x-real-ip': request.headers.get('x-real-ip'),
        'x-forwarded-for': request.headers.get('x-forwarded-for'),
        'cf-connecting-ip': request.headers.get('cf-connecting-ip'),
      },
      env: {
        VPN_REQUIRED: process.env.VPN_REQUIRED,
        VPN_RANGE: process.env.VPN_RANGE,
        VPN_REQUIRED_DOMAINS: process.env.VPN_REQUIRED_DOMAINS,
        VPN_API_URL: process.env.VPN_API_URL,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error al obtener información de IP',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

### 5. Página de Configuración VPN (`app/vpn-setup/page.tsx`)

**Ubicación:** `app/vpn-setup/page.tsx`

```typescript
'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function VpnSetupContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const redirectPath = searchParams.get('redirect') || '/'
  const clientIp = searchParams.get('ip') || 'N/A'

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const checkVpnStatus = async () => {
      try {
        const response = await fetch('/api/debug-ip', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })

        if (response.ok) {
          const data = await response.json()

          if (data.isVpnConnected === true) {
            clearInterval(intervalId)
            const targetPath = redirectPath && redirectPath !== '/' ? redirectPath : '/'
            router.push(targetPath)
          }
        }
      } catch (error) {
        console.error('Error verificando VPN:', error)
      }
    }

    checkVpnStatus()
    intervalId = setInterval(checkVpnStatus, 3000)

    return () => {
      clearInterval(intervalId)
    }
  }, [redirectPath, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">
            ACCESO NO AUTORIZADO
          </h1>
          <p className="text-slate-600 mb-4">
            No se puede acceder al sistema desde este equipo. Se requiere conexión VPN autorizada.
          </p>
          <p className="text-sm text-slate-500">
            IP detectada: <span className="font-semibold">{clientIp}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VpnSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    }>
      <VpnSetupContent />
    </Suspense>
  )
}
```

## ⚙️ Variables de Entorno

Agregar al archivo `.env.local` o `.env.production`:

```bash
# Verificación VPN
VPN_REQUIRED=true
VPN_RANGE=10.8.0.0/24
VPN_REQUIRED_DOMAINS=tu-dominio.com,otro-dominio.com
VPN_API_URL=http://localhost:PUERTO_APP
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

### Descripción de Variables

- **`VPN_REQUIRED`**: `true` para activar verificación VPN, `false` para desactivar
- **`VPN_RANGE`**: Rango de IPs VPN en formato CIDR (ej: `10.8.0.0/24`)
- **`VPN_REQUIRED_DOMAINS`**: Dominios que requieren VPN (separados por comas)
- **`VPN_API_URL`**: URL interna de la aplicación Next.js (usualmente `http://localhost:PUERTO`)
- **`NEXT_PUBLIC_SITE_URL`**: URL pública del sitio (necesaria para detectar dominio correcto desde localhost)

## 🔧 Configuración de Nginx

### Archivo: `nginx.conf` (HTTP)

```nginx
location / {
    proxy_pass http://localhost:PUERTO_APP;
    # ... otras configuraciones ...
}

location @fallback {
    proxy_pass http://localhost:PUERTO_APP;
}
```

### Archivo: `nginx.ssl.conf` (HTTPS)

```nginx
location / {
    proxy_ssl_server_name on;
    proxy_ssl_name $host;
    proxy_pass http://localhost:PUERTO_APP;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    # ... otras configuraciones ...
}

location @fallback {
    proxy_ssl_server_name on;
    proxy_ssl_name $host;
    proxy_pass http://localhost:PUERTO_APP;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Importante:** Los headers `X-Real-IP` y `X-Forwarded-For` son esenciales para que el sistema detecte correctamente la IP del cliente.

## 📝 Pasos de Implementación

### 1. Crear Archivos

```bash
# Crear estructura de directorios
mkdir -p lib
mkdir -p app/api/vpn/check-status
mkdir -p app/api/debug-ip
mkdir -p app/vpn-setup

# Crear archivos (copiar contenido de arriba)
touch middleware.ts
touch lib/vpn-utils.ts
touch app/api/vpn/check-status/route.ts
touch app/api/debug-ip/route.ts
touch app/vpn-setup/page.tsx
```

### 2. Configurar Variables de Entorno

Editar `.env.local` o `.env.production` con las variables mencionadas arriba.

### 3. Configurar Nginx

Modificar los archivos de configuración de Nginx para:
- Agregar headers `X-Real-IP` y `X-Forwarded-For`
- Configurar `proxy_pass` al puerto correcto de la aplicación

### 4. Verificar Archivo de Estado de OpenVPN

Asegurarse de que OpenVPN está configurado para escribir el archivo de estado:

```bash
# Verificar que el archivo existe
sudo cat /var/log/openvpn-status.log

# Verificar configuración de OpenVPN
sudo cat /etc/openvpn/server.conf | grep status
```

El archivo debe tener una línea como:
```
status /var/log/openvpn-status.log 10
```

### 5. Probar la Implementación

1. Acceder a `/api/debug-ip` para verificar que detecta la IP correctamente
2. Conectar VPN y verificar que `isVpnConnected: true`
3. Desconectar VPN y verificar que redirige a `/vpn-setup`
4. Verificar que la página de setup detecta automáticamente cuando se conecta VPN

## 🐛 Troubleshooting

### Problema: `isVpnConnected: false` aunque esté conectado

**Solución:**
1. Verificar que el archivo `/var/log/openvpn-status.log` existe y tiene contenido
2. Verificar que la IP del cliente aparece en `CLIENT_LIST` o `ROUTING_TABLE`
3. Verificar que `VPN_API_URL` apunta al puerto correcto
4. Revisar logs del servidor para ver errores de parsing

### Problema: `isInVpnRange: false` siempre

**Solución:**
- Esto es normal si la IP pública no está en el rango VPN
- El sistema debe detectar la conexión mediante el archivo de estado, no por rango IP

### Problema: No detecta IP correctamente

**Solución:**
1. Verificar headers de Nginx (`X-Real-IP`, `X-Forwarded-For`)
2. Acceder a `/api/debug-ip` para ver qué IP está detectando
3. Verificar que Nginx está pasando los headers correctamente

### Problema: Redirección infinita

**Solución:**
1. Verificar que `/vpn-setup` está en la lista de rutas públicas en `middleware.ts`
2. Verificar que `/api/vpn/check-status` está en la lista de rutas públicas

## ✅ Checklist de Implementación

- [ ] Archivo `middleware.ts` creado
- [ ] Archivo `lib/vpn-utils.ts` creado
- [ ] Archivo `app/api/vpn/check-status/route.ts` creado
- [ ] Archivo `app/api/debug-ip/route.ts` creado
- [ ] Archivo `app/vpn-setup/page.tsx` creado
- [ ] Variables de entorno configuradas
- [ ] Nginx configurado con headers correctos
- [ ] Archivo de estado de OpenVPN verificado
- [ ] Pruebas realizadas con VPN conectado
- [ ] Pruebas realizadas con VPN desconectado
- [ ] Logs verificados para debugging

## 📚 Referencias

- OpenVPN Status File Format: https://openvpn.net/community-resources/management-interface/
- Next.js Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware
- Nginx Proxy Headers: https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_set_header



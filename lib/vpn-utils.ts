/**
 * Utilidades para verificación y gestión de VPN
 */

/**
 * Verifica si una IP está en el rango de la red VPN
 * Por defecto, OpenVPN usa 10.8.0.0/24
 */
export function isIpInVpnRange(ip: string, vpnRange: string = '10.8.0.0/24'): boolean {
  if (!ip || ip === 'unknown' || ip === '::1' || ip === '127.0.0.1') {
    // Permitir localhost para desarrollo
    return process.env.NODE_ENV === 'development';
  }

  const [rangeIp, prefixLength] = vpnRange.split('/');
  const mask = parseInt(prefixLength, 10);
  
  const ipToNumber = (ip: string): number => {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  };

  const rangeNum = ipToNumber(rangeIp);
  const ipNum = ipToNumber(ip);
  const maskNum = (0xffffffff << (32 - mask)) >>> 0;

  return (ipNum & maskNum) === (rangeNum & maskNum);
}

/**
 * Extrae la IP real del cliente desde los headers de la request
 */
export function getClientIp(request: Request): string {
  // Intentar obtener IP desde varios headers comunes (en orden de prioridad)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for puede contener múltiples IPs, tomar la primera (IP original del cliente)
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Si no hay headers, intentar desde la conexión directa (solo en desarrollo)
  return 'unknown';
}

/**
 * Verifica si el cliente está conectado a través de VPN
 * Primero verifica si la IP está en el rango VPN
 * Si no, verifica si hay una conexión activa registrada en el archivo de estado de OpenVPN
 */
/**
 * Verifica si el cliente está conectado a través de VPN
 * Para el middleware inicial: solo verifica que haya VPN activa (permisivo)
 * Para rutas protegidas: requiere puerto VPN si hay múltiples conexiones (estricto)
 */
export async function isVpnConnected(request: Request, requireStrictCheck: boolean = false): Promise<boolean> {
  const clientIp = getClientIp(request);
  const vpnRange = process.env.VPN_RANGE || '10.8.0.0/24';
  
  // Primero verificar si la IP está en el rango VPN (método directo y rápido)
  if (isIpInVpnRange(clientIp, vpnRange)) {
    return true;
  }
  
  // Si no está en el rango VPN, verificar usando el archivo de estado de OpenVPN
  // Esto es más confiable que depender de hooks que pueden fallar
  try {
    const apiUrl = process.env.VPN_API_URL || 'http://127.0.0.1:6368';
    // Intentar obtener puerto VPN del header si está disponible
    const vpnPort = request.headers.get('x-vpn-port');
    
    // Para el middleware inicial, usar verificación permisiva (sin puerto requerido)
    // Para rutas protegidas, usar verificación estricta (con puerto requerido si hay múltiples conexiones)
    // Para el middleware inicial, usar modo permisivo (sin strict)
    // Para rutas protegidas de API, usar modo estricto (con strict=true)
    const checkUrl = `${apiUrl}/api/vpn/check-status?realIp=${encodeURIComponent(clientIp)}${vpnPort ? `&vpnPort=${encodeURIComponent(vpnPort)}` : ''}${requireStrictCheck ? '&strict=true' : ''}`;
    
    const controller = new AbortController();
    // Aumentado timeout de 1s a 2s para dar más tiempo si el servidor está bajo carga
    // o si el archivo de estado es grande
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    // Preparar headers para la solicitud
    const headers: HeadersInit = {
      'Cache-Control': 'no-store',
    };
    // Si el cliente envió el puerto VPN, pasarlo también
    if (vpnPort) {
      headers['X-VPN-Port'] = vpnPort;
    }
    
    try {
      const response = await fetch(checkUrl, {
        signal: controller.signal,
        headers,
        cache: 'no-store',
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[VPN Utils] Verificación para IP ${clientIp} (strict=${requireStrictCheck}):`, data);
        return data.isActive === true;
      } else {
        console.warn(`[VPN Utils] Verificación falló para IP ${clientIp}, status: ${response.status}`);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // Si es timeout, loguearlo pero no es crítico (puede ser carga del servidor)
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          console.warn(`[VPN Utils] Timeout verificando estado VPN para IP ${clientIp} (2s)`);
        } else {
          console.error('[VPN Utils] Error verificando estado:', fetchError.message);
        }
      }
    }
  } catch (error) {
    console.error('[VPN Utils] Error verificando conexión activa:', error);
  }
  
  return false;
}



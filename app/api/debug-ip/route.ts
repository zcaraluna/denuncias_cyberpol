import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, isIpInVpnRange } from '@/lib/vpn-utils';
import { isVpnConnected } from '@/lib/vpn-utils';

/**
 * GET /api/debug-ip
 * Endpoint de debugging para verificar IP y estado VPN
 */
export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const vpnRange = process.env.VPN_RANGE || '10.8.0.0/24';
    const isInRange = isIpInVpnRange(clientIp, vpnRange);
    
    // Verificar estado VPN con más detalles
    let vpnCheckDetails: any = null;
    try {
      const apiUrl = process.env.VPN_API_URL || 'http://127.0.0.1:6368';
      const checkUrl = `${apiUrl}/api/vpn/check-status?realIp=${encodeURIComponent(clientIp)}`;
      
      const response = await fetch(checkUrl, {
        cache: 'no-store',
      });
      
      if (response.ok) {
        vpnCheckDetails = await response.json();
      } else {
        vpnCheckDetails = {
          error: `HTTP ${response.status}`,
          statusText: response.statusText
        };
      }
    } catch (fetchError) {
      vpnCheckDetails = {
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        type: fetchError instanceof Error ? fetchError.name : 'Unknown'
      };
    }
    
    const isConnected = vpnCheckDetails?.isActive === true;

    return NextResponse.json({
      clientIp,
      vpnRange,
      isInVpnRange: isInRange,
      isVpnConnected: isConnected,
      vpnCheckDetails,
      headers: {
        'x-real-ip': request.headers.get('x-real-ip'),
        'x-forwarded-for': request.headers.get('x-forwarded-for'),
        'cf-connecting-ip': request.headers.get('cf-connecting-ip'),
        'host': request.headers.get('host'),
      },
      env: {
        VPN_REQUIRED: process.env.VPN_REQUIRED,
        VPN_RANGE: process.env.VPN_RANGE,
        VPN_REQUIRED_DOMAINS: process.env.VPN_REQUIRED_DOMAINS,
        VPN_API_URL: process.env.VPN_API_URL,
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
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}



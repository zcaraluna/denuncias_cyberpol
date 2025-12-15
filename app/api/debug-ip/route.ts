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


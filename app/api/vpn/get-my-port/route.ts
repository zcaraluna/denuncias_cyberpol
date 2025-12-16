import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { getClientIp } from '@/lib/vpn-utils';

/**
 * GET /api/vpn/get-my-port
 * Devuelve el puerto VPN del cliente basándose en su IP pública
 */
export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const statusFile = '/var/log/openvpn-status.log';
    
    if (!existsSync(statusFile)) {
      return NextResponse.json({ 
        error: 'Archivo de estado no encontrado',
        port: null
      });
    }
    
    try {
      const content = await readFile(statusFile, 'utf-8');
      const lines = content.split('\n');
      
      // Buscar en CLIENT LIST la conexión que corresponde a esta IP
      let inClientList = false;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine === 'OpenVPN CLIENT LIST' || trimmedLine === 'CLIENT LIST' || trimmedLine.startsWith('HEADER,CLIENT_LIST')) {
          inClientList = true;
          continue;
        }
        
        if (trimmedLine === 'ROUTING TABLE' || trimmedLine.startsWith('HEADER,ROUTING_TABLE') || 
            trimmedLine === 'GLOBAL STATS' || trimmedLine === 'END') {
          inClientList = false;
          continue;
        }
        
        // Buscar líneas que empiezan con CLIENT_LIST,
        if (trimmedLine.startsWith('CLIENT_LIST,')) {
          const parts = trimmedLine.substring('CLIENT_LIST,'.length).split(',');
          if (parts.length >= 2) {
            const addr = parts[1].trim();
            if (addr.includes(':')) {
              const ipFromAddress = addr.split(':')[0];
              const port = addr.split(':')[1];
              
              if (ipFromAddress === clientIp) {
                return NextResponse.json({
                  ip: clientIp,
                  port: port,
                  commonName: parts[0]?.trim() || '',
                  virtualAddress: parts[2]?.trim() || '',
                  found: true
                });
              }
            }
          }
          continue;
        }
        
        // Buscar líneas normales en CLIENT LIST
        if (inClientList && trimmedLine && !trimmedLine.startsWith('#') && 
            !trimmedLine.startsWith('Updated,') && !trimmedLine.startsWith('Common Name,') && 
            !trimmedLine.startsWith('HEADER,')) {
          const parts = trimmedLine.split(',');
          if (parts.length >= 2) {
            const addr = parts[1].trim();
            if (addr.includes(':')) {
              const ipFromAddress = addr.split(':')[0];
              const port = addr.split(':')[1];
              
              if (ipFromAddress === clientIp) {
                return NextResponse.json({
                  ip: clientIp,
                  port: port,
                  commonName: parts[0]?.trim() || '',
                  virtualAddress: parts[2]?.trim() || '',
                  found: true
                });
              }
            }
          }
        }
      }
      
      // No se encontró conexión para esta IP
      return NextResponse.json({
        ip: clientIp,
        port: null,
        found: false,
        message: 'No se encontró conexión VPN activa para esta IP'
      });
      
    } catch (readError) {
      console.error('[VPN Get Port] Error leyendo archivo de estado:', readError);
      return NextResponse.json({ 
        error: 'Error al leer archivo de estado',
        details: readError instanceof Error ? readError.message : 'Unknown error',
        port: null
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[VPN Get Port] Error:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener puerto VPN', 
        details: error instanceof Error ? error.message : 'Unknown error',
        port: null
      },
      { status: 500 }
    );
  }
}


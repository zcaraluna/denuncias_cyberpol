import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * GET /api/vpn/check-status
 * Verifica conexiones VPN activas leyendo el archivo de estado de OpenVPN
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const realIp = searchParams.get('realIp');
    
    if (!realIp) {
      return NextResponse.json({ error: 'realIp es requerido' }, { status: 400 });
    }

    const statusFile = '/var/log/openvpn-status.log';
    
    // Verificar si el archivo existe
    if (!existsSync(statusFile)) {
      return NextResponse.json({ 
        isActive: false,
        error: 'Archivo de estado no encontrado',
        statusFile 
      });
    }
    
    // Obtener información del archivo
    let fileStats: any = null;
    try {
      const stats = await stat(statusFile);
      fileStats = {
        exists: true,
        size: stats.size,
        lastModified: stats.mtime.toISOString(),
        ageSeconds: Math.floor((Date.now() - stats.mtime.getTime()) / 1000),
      };
    } catch (statError) {
      fileStats = {
        error: statError instanceof Error ? statError.message : 'Unknown error'
      };
    }

    try {
      const content = await readFile(statusFile, 'utf-8');
      
      const lines = content.split('\n');
      let found = false;
      let connectionInfo = null;
      let inClientList = false;
      let inRoutingTable = false;
      let fileUpdatedAt: Date | null = null;
      let routingTableLastRef: Date | null = null;
      
      // Obtener la fecha de actualización del archivo
      for (const line of lines) {
        if (line.trim().startsWith('Updated,')) {
          const updateTimeStr = line.trim().split(',')[1]?.trim();
          if (updateTimeStr) {
            try {
              fileUpdatedAt = new Date(updateTimeStr);
            } catch {
              fileUpdatedAt = new Date();
            }
          }
          break;
        }
      }
      
      if (!fileUpdatedAt) {
        fileUpdatedAt = new Date();
      }
      
      // Buscar en CLIENT LIST
      let foundInClientList = false;
      let connectedSinceStr = '';
      let commonName = '';
      let realAddress = '';
      let virtualAddress = '';
      const allClientListIps: string[] = []; // Para debugging
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine === 'OpenVPN CLIENT LIST' || trimmedLine === 'CLIENT LIST' || trimmedLine.startsWith('HEADER,CLIENT_LIST')) {
          inClientList = true;
          inRoutingTable = false;
          continue;
        }
        
        // Las líneas de datos pueden empezar directamente con CLIENT_LIST,
        if (trimmedLine.startsWith('CLIENT_LIST,')) {
          inClientList = true;
          inRoutingTable = false;
          // Procesar esta línea como línea de datos
          const parts = trimmedLine.substring('CLIENT_LIST,'.length).split(',');
          if (parts.length >= 2) {
            const addr = parts[1].trim(); // Real Address está en el índice 1 después de quitar "CLIENT_LIST,"
            if (addr.includes(':')) {
              const ipFromAddress = addr.split(':')[0];
              
              // Guardar todas las IPs encontradas para debugging
              if (/^\d+\.\d+\.\d+\.\d+$/.test(ipFromAddress)) {
                allClientListIps.push(ipFromAddress);
              }
              
              if (ipFromAddress === realIp) {
                foundInClientList = true;
                commonName = parts[0]?.trim() || ''; // Common Name está en el índice 0
                realAddress = addr;
                virtualAddress = parts[2]?.trim() || ''; // Virtual Address está en el índice 2
                connectedSinceStr = parts[6]?.trim() || ''; // Connected Since está en el índice 6 (después de quitar CLIENT_LIST,)
              }
            }
          }
          continue;
        }
        
        if (trimmedLine === 'ROUTING TABLE' || trimmedLine.startsWith('HEADER,ROUTING_TABLE')) {
          inClientList = false;
          inRoutingTable = true;
          continue;
        }
        
        if (trimmedLine === 'GLOBAL STATS' || trimmedLine === 'END') {
          inClientList = false;
          inRoutingTable = false;
          continue;
        }
        
        // Buscar en CLIENT LIST (líneas normales, sin prefijo CLIENT_LIST,)
        if (inClientList && trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('Updated,') && !trimmedLine.startsWith('Common Name,') && !trimmedLine.startsWith('HEADER,') && !trimmedLine.startsWith('CLIENT_LIST,')) {
          const parts = trimmedLine.split(',');
          if (parts.length >= 2) {
            const addr = parts[1].trim();
            if (addr.includes(':')) {
              const ipFromAddress = addr.split(':')[0];
              
              // Guardar todas las IPs encontradas para debugging
              if (/^\d+\.\d+\.\d+\.\d+$/.test(ipFromAddress)) {
                allClientListIps.push(ipFromAddress);
              }
              
              if (ipFromAddress === realIp) {
                foundInClientList = true;
                commonName = parts[0]?.trim() || '';
                realAddress = addr;
                virtualAddress = parts[2]?.trim() || '';
                connectedSinceStr = parts[6]?.trim() || '';
              }
            }
          }
        }
      }
      
      // Buscar Last Ref en ROUTING TABLE
      inRoutingTable = false;
      const allRoutingTableIps: string[] = []; // Para debugging
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine === 'ROUTING TABLE' || trimmedLine.startsWith('HEADER,ROUTING_TABLE')) {
          inRoutingTable = true;
          continue;
        }
        
        // Las líneas de datos pueden empezar directamente con ROUTING_TABLE,
        if (trimmedLine.startsWith('ROUTING_TABLE,')) {
          inRoutingTable = true;
          // Procesar esta línea como línea de datos
          const routingParts = trimmedLine.substring('ROUTING_TABLE,'.length).split(',');
          if (routingParts.length >= 3) {
            const routingRealAddress = routingParts[2]?.trim();
            if (routingRealAddress && routingRealAddress.includes(':')) {
              const routingIpFromAddress = routingRealAddress.split(':')[0];
              if (/^\d+\.\d+\.\d+\.\d+$/.test(routingIpFromAddress)) {
                allRoutingTableIps.push(routingIpFromAddress);
              }
              if (routingIpFromAddress === realIp) {
                const lastRefStr = routingParts[3]?.trim();
                if (lastRefStr) {
                  try {
                    routingTableLastRef = new Date(lastRefStr);
                  } catch {
                    // Ignorar si no se puede parsear
                  }
                }
              }
            }
          }
          continue;
        }
        
        if (trimmedLine === 'GLOBAL STATS' || trimmedLine === 'END') {
          inRoutingTable = false;
          continue;
        }
        
        // Las líneas de datos en ROUTING_TABLE pueden empezar con "ROUTING_TABLE," o ser líneas normales
        // (Las que empiezan con ROUTING_TABLE, ya fueron procesadas arriba)
        if (inRoutingTable && trimmedLine && !trimmedLine.startsWith('Virtual Address,') && !trimmedLine.startsWith('HEADER,') && !trimmedLine.startsWith('ROUTING_TABLE,')) {
          // Si la línea empieza con "ROUTING_TABLE,", es una línea de datos
          const isDataLine = trimmedLine.startsWith('ROUTING_TABLE,');
          const routingParts = isDataLine ? trimmedLine.substring('ROUTING_TABLE,'.length).split(',') : trimmedLine.split(',');
          
          if (routingParts.length >= 3) {
            // Si es línea que empieza con ROUTING_TABLE, los índices son diferentes:
            // ROUTING_TABLE,10.8.0.6,DCHPEF-1-ASU,181.91.85.248:30517,2025-12-16 02:07:09,1765850829
            // parts[0] = Virtual Address, parts[1] = Common Name, parts[2] = Real Address, parts[3] = Last Ref
            // Si es línea normal:
            // parts[0] = Virtual Address, parts[1] = Common Name, parts[2] = Real Address, parts[3] = Last Ref
            const routingRealAddress = routingParts[2]?.trim();
            const lastRefIndex = isDataLine ? 3 : 3; // Mismo índice en ambos casos
            
            if (routingRealAddress && routingRealAddress.includes(':')) {
              const routingIpFromAddress = routingRealAddress.split(':')[0];
              // Guardar todas las IPs encontradas para debugging
              if (/^\d+\.\d+\.\d+\.\d+$/.test(routingIpFromAddress)) {
                allRoutingTableIps.push(routingIpFromAddress);
              }
              
              if (routingIpFromAddress === realIp) {
                const lastRefStr = routingParts[lastRefIndex]?.trim();
                if (lastRefStr) {
                  try {
                    routingTableLastRef = new Date(lastRefStr);
                  } catch {
                    // Ignorar si no se puede parsear
                  }
                }
                break;
              }
            }
          }
        }
      }
      
      // Determinar si la conexión está activa
      const now = Date.now();
      let isActive = false;
      
      if (routingTableLastRef) {
        const timeSinceLastRef = now - routingTableLastRef.getTime();
        isActive = timeSinceLastRef <= 15 * 1000; // 15 segundos de umbral
      } else if (foundInClientList) {
        if (connectedSinceStr) {
          try {
            const connectedSince = new Date(connectedSinceStr);
            const timeSinceConnection = now - connectedSince.getTime();
            const timeSinceFileUpdate = now - fileUpdatedAt.getTime();
            isActive = timeSinceConnection <= 20 * 1000 && timeSinceFileUpdate <= 15 * 1000;
          } catch {
            isActive = false;
          }
        } else {
          isActive = false;
        }
      }
      
      if (isActive) {
        found = true;
        connectionInfo = {
          commonName: commonName || '',
          realAddress: realAddress || '',
          virtualAddress: virtualAddress || '',
          connectedSince: connectedSinceStr || '',
          lastRef: routingTableLastRef?.toISOString() || null
        };
      }
      
      const stats = await stat(statusFile);
      const lastModified = stats.mtime;
      
      const response = NextResponse.json({ 
        isActive: found,
        realIp,
        connectionInfo,
        checkedAt: new Date().toISOString(),
        fileLastModified: lastModified.toISOString(),
        fileAgeSeconds: Math.floor((Date.now() - lastModified.getTime()) / 1000),
        fileStats,
        debug: {
          foundInClientList,
          hasRoutingTableLastRef: routingTableLastRef !== null,
          routingTableLastRef: routingTableLastRef?.toISOString() || null,
          fileUpdatedAt: fileUpdatedAt?.toISOString() || null,
          searchedIp: realIp,
          allClientListIps, // Todas las IPs encontradas en CLIENT LIST
          allRoutingTableIps, // Todas las IPs encontradas en ROUTING TABLE
          clientListCount: allClientListIps.length,
          routingTableCount: allRoutingTableIps.length,
        }
      });
      
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
    } catch (readError) {
      console.error('[VPN Status] Error leyendo archivo de estado:', readError);
      return NextResponse.json({ 
        isActive: false,
        error: 'Error al leer archivo de estado',
        details: readError instanceof Error ? readError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[VPN Status] Error:', error);
    return NextResponse.json(
      { error: 'Error al verificar estado VPN', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}



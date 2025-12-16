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
      // Obtener información del archivo ANTES de leerlo para verificar consistencia
      const statsBefore = await stat(statusFile);
      const mtimeBefore = statsBefore.mtime.getTime();
      
      const content = await readFile(statusFile, 'utf-8');
      
      // Verificar que el archivo no cambió mientras se leía (consistencia)
      const statsAfter = await stat(statusFile);
      const mtimeAfter = statsAfter.mtime.getTime();
      const fileChangedDuringRead = mtimeBefore !== mtimeAfter;
      
      // Log para debugging
      console.log(`[VPN Status] Verificando IP: ${realIp}`);
      console.log(`[VPN Status] Archivo existe, tamaño: ${content.length} bytes`);
      if (fileChangedDuringRead) {
        console.log(`[VPN Status] ⚠️ Archivo cambió durante la lectura (mtime antes: ${mtimeBefore}, después: ${mtimeAfter})`);
      }
      
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
      
      // Buscar en CLIENT LIST - ahora buscamos TODAS las conexiones desde esa IP
      interface VpnConnection {
        commonName: string;
        realAddress: string;
        virtualAddress: string;
        connectedSince: string;
        port: string | null;
      }
      
      const connectionsFromIp: VpnConnection[] = [];
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
                // Guardar TODAS las conexiones desde esta IP
                const port = addr.includes(':') ? addr.split(':')[1] : null;
                connectionsFromIp.push({
                  commonName: parts[0]?.trim() || '',
                  realAddress: addr,
                  virtualAddress: parts[2]?.trim() || '',
                  connectedSince: parts[6]?.trim() || '',
                  port: port
                });
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
                // Guardar TODAS las conexiones desde esta IP (líneas normales)
                const port = addr.includes(':') ? addr.split(':')[1] : null;
                connectionsFromIp.push({
                  commonName: parts[0]?.trim() || '',
                  realAddress: addr,
                  virtualAddress: parts[2]?.trim() || '',
                  connectedSince: parts[6]?.trim() || '',
                  port: port
                });
              }
            }
          }
        }
      }
      
      // Verificar si encontramos conexiones
      const foundInClientList = connectionsFromIp.length > 0;
      
      // Buscar Last Ref en ROUTING TABLE para TODAS las conexiones encontradas
      // Mapear Virtual Address -> Last Ref para cada conexión
      const lastRefByVirtualAddress = new Map<string, Date>();
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
                // Guardar Last Ref para esta conexión (usando Virtual Address como clave)
                const virtualAddr = routingParts[0]?.trim();
                const lastRefStr = routingParts[3]?.trim();
                if (virtualAddr && lastRefStr) {
                  try {
                    lastRefByVirtualAddress.set(virtualAddr, new Date(lastRefStr));
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
                // Guardar Last Ref para esta conexión (usando Virtual Address como clave)
                const virtualAddr = routingParts[0]?.trim();
                const lastRefStr = routingParts[lastRefIndex]?.trim();
                if (virtualAddr && lastRefStr) {
                  try {
                    lastRefByVirtualAddress.set(virtualAddr, new Date(lastRefStr));
                  } catch {
                    // Ignorar si no se puede parsear
                  }
                }
                // No hacer break, seguir buscando todas las conexiones
              }
            }
          }
        }
      }
      
      // REGLA PRINCIPAL: La conexión está activa SOLO si:
      // 1. Está en CLIENT LIST (requisito obligatorio)
      // 2. Y tiene al menos UNA conexión con Last Ref reciente (≤15s) O Connected Since reciente (≤30s)
      
      // REGLA 1: Si NO está en CLIENT LIST → INACTIVA (sin excepciones)
      // NOTA: Confiamos en el parsing estructurado, NO en búsqueda simple de strings
      // porque la IP podría aparecer en comentarios u otras secciones que no cuentan
      
      // Determinar si la conexión está activa
      const now = Date.now();
      let isActive = false;
      let activeConnection: VpnConnection | null = null;
      let activeLastRef: Date | null = null;
      const activeConnections: Array<{connection: VpnConnection, lastRef: Date | null}> = [];
      
      // Verificar que el archivo se actualizó recientemente
      const timeSinceFileUpdate = now - fileUpdatedAt.getTime();
      // Aumentado a 30 segundos para dar más tolerancia al delay de actualización
      // El archivo se actualiza cada 10s, así que 30s es un margen seguro
      const fileIsRecent = timeSinceFileUpdate <= 30 * 1000; // 30 segundos
      
      if (!foundInClientList) {
        // REGLA 1: Si NO está en CLIENT LIST → INACTIVA (sin excepciones)
        isActive = false;
        console.log(`[VPN Status] ❌ IP ${realIp} NO está en CLIENT LIST → INACTIVA`);
      } else {
        // Verificar TODAS las conexiones encontradas desde esta IP
        console.log(`[VPN Status] Encontradas ${connectionsFromIp.length} conexión(es) desde IP ${realIp}`);
        
        for (const conn of connectionsFromIp) {
          const lastRef = lastRefByVirtualAddress.get(conn.virtualAddress) || null;
          let connectionIsActive = false;
          
          if (lastRef) {
            // Tiene Last Ref: verificar si es reciente (≤15s)
            const timeSinceLastRef = now - lastRef.getTime();
            const lastRefSeconds = Math.floor(timeSinceLastRef / 1000);
            connectionIsActive = timeSinceLastRef <= 15 * 1000;
            console.log(`[VPN Status] Conexión ${conn.commonName} (${conn.virtualAddress}): Last Ref hace ${lastRefSeconds}s (umbral: 15s) → activa: ${connectionIsActive}`);
          } else if (conn.connectedSince) {
            // NO tiene Last Ref: usar Connected Since
            try {
              const connectedSince = new Date(conn.connectedSince);
              const timeSinceConnection = now - connectedSince.getTime();
              const connectionSeconds = Math.floor(timeSinceConnection / 1000);
              
              // Solo activa si Connected Since es reciente (≤30s) Y el archivo se actualizó recientemente
              const fileIsRecentExtended = timeSinceFileUpdate <= 30 * 1000;
              connectionIsActive = timeSinceConnection <= 30 * 1000 && fileIsRecentExtended;
              console.log(`[VPN Status] Conexión ${conn.commonName} (${conn.virtualAddress}): Connected Since hace ${connectionSeconds}s (umbral: 30s), archivo reciente: ${fileIsRecentExtended} → activa: ${connectionIsActive}`);
            } catch (error) {
              connectionIsActive = false;
              console.log(`[VPN Status] ❌ Error parseando Connected Since para ${conn.commonName}: ${error}`);
            }
          } else {
            // Sin Last Ref ni Connected Since
            connectionIsActive = fileIsRecent && timeSinceFileUpdate <= 15 * 1000;
            console.log(`[VPN Status] ⚠️ Conexión ${conn.commonName} (${conn.virtualAddress}): Sin Last Ref ni Connected Since, archivo reciente: ${fileIsRecent} → activa: ${connectionIsActive}`);
          }
          
          if (connectionIsActive) {
            activeConnections.push({ connection: conn, lastRef });
            if (!isActive) {
              // Usar la primera conexión activa encontrada
              isActive = true;
              activeConnection = conn;
              activeLastRef = lastRef;
            }
          }
        }
        
        // Si hay múltiples conexiones activas, registrar warning
        if (activeConnections.length > 1) {
          console.log(`[VPN Status] ⚠️ ADVERTENCIA: Múltiples conexiones VPN activas (${activeConnections.length}) desde IP ${realIp}:`);
          activeConnections.forEach((ac, idx) => {
            console.log(`[VPN Status]   ${idx + 1}. ${ac.connection.commonName} (${ac.connection.virtualAddress}) - Last Ref: ${ac.lastRef ? ac.lastRef.toISOString() : 'N/A'}`);
          });
        }
        
        if (!isActive) {
          console.log(`[VPN Status] ❌ Ninguna de las ${connectionsFromIp.length} conexión(es) desde IP ${realIp} está activa`);
        }
      }
      
      if (isActive && activeConnection) {
        found = true;
        connectionInfo = {
          commonName: activeConnection.commonName || '',
          realAddress: activeConnection.realAddress || '',
          virtualAddress: activeConnection.virtualAddress || '',
          connectedSince: activeConnection.connectedSince || '',
          lastRef: activeLastRef?.toISOString() || null
        };
      }
      
      // Obtener información de última actualización del archivo (ya tenemos statsAfter)
      const lastModified = statsAfter.mtime;
      
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
          connectionsFound: connectionsFromIp.length,
          connectionsFromIp: connectionsFromIp.map(c => ({
            commonName: c.commonName,
            virtualAddress: c.virtualAddress,
            port: c.port
          })),
          activeConnectionsCount: activeConnections.length,
          hasRoutingTableLastRef: activeLastRef !== null,
          routingTableLastRef: activeLastRef?.toISOString() || null,
          fileUpdatedAt: fileUpdatedAt?.toISOString() || null,
          fileChangedDuringRead, // Indica si el archivo cambió mientras se leía
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



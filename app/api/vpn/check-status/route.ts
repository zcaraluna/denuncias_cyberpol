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
        statusFile,
        debug: {
          fileExists: false,
          searchedIp: realIp,
        }
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
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine === 'OpenVPN CLIENT LIST' || trimmedLine === 'CLIENT LIST') {
          inClientList = true;
          inRoutingTable = false;
          continue;
        }
        
        if (trimmedLine === 'ROUTING TABLE') {
          inClientList = false;
          inRoutingTable = true;
          continue;
        }
        
        if (trimmedLine === 'GLOBAL STATS' || trimmedLine === 'END') {
          inClientList = false;
          inRoutingTable = false;
          continue;
        }
        
        // Buscar en CLIENT LIST
        if (inClientList && trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('Updated,') && !trimmedLine.startsWith('Common Name,')) {
          const parts = trimmedLine.split(',');
          if (parts.length >= 2) {
            const addr = parts[1].trim();
            if (addr.includes(':')) {
              const ipFromAddress = addr.split(':')[0];
              
              if (/^\d+\.\d+\.\d+\.\d+$/.test(ipFromAddress) && ipFromAddress === realIp) {
                foundInClientList = true;
                commonName = parts[0]?.trim() || '';
                realAddress = addr;
                virtualAddress = parts[2]?.trim() || '';
                connectedSinceStr = parts[5]?.trim() || '';
                break;
              }
            }
          }
        }
      }
      
      // Buscar Last Ref en ROUTING TABLE
      inRoutingTable = false;
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine === 'ROUTING TABLE') {
          inRoutingTable = true;
          continue;
        }
        
        if (trimmedLine === 'GLOBAL STATS' || trimmedLine === 'END') {
          inRoutingTable = false;
          continue;
        }
        
        if (inRoutingTable && trimmedLine && !trimmedLine.startsWith('Virtual Address,') && trimmedLine.includes(realIp)) {
          const routingParts = trimmedLine.split(',');
          if (routingParts.length >= 4) {
            const routingRealAddress = routingParts[2]?.trim();
            if (routingRealAddress && routingRealAddress.includes(':')) {
              const routingIpFromAddress = routingRealAddress.split(':')[0];
              if (routingIpFromAddress === realIp) {
                const lastRefStr = routingParts[3]?.trim();
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
          fileContentPreview: content.substring(0, 500), // Primeros 500 caracteres para debugging
          fileContentFull: content, // Contenido completo del archivo
          fileLines: lines.length,
          clientListLines: lines.filter((line, idx) => {
            // Encontrar líneas que están en la sección CLIENT LIST
            let inClientList = false;
            for (let i = 0; i <= idx; i++) {
              const trimmed = lines[i].trim();
              if (trimmed === 'OpenVPN CLIENT LIST' || trimmed === 'CLIENT LIST') {
                inClientList = true;
              }
              if (trimmed === 'ROUTING TABLE' || trimmed === 'GLOBAL STATS' || trimmed === 'END') {
                inClientList = false;
              }
            }
            return inClientList && !line.trim().startsWith('#') && !line.trim().startsWith('HEADER') && line.trim() !== '';
          }).slice(0, 10), // Primeras 10 líneas de clientes
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



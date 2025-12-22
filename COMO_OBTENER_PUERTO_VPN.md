# Cómo Obtener el Puerto VPN para el Header

Para que el sistema pueda identificar específicamente qué computadora está haciendo la solicitud cuando múltiples computadoras comparten la misma IP pública, cada cliente debe enviar su puerto VPN en el header `X-VPN-Port`.

## ¿Qué es el Puerto VPN?

El puerto VPN es el puerto UDP/TCP que OpenVPN asigna a cada conexión. Aparece en el archivo de estado como:
```
CLIENT_LIST,DCHPEF-1-ASU,181.91.85.248:30517,10.8.0.6,...
```
Donde `30517` es el puerto VPN único de esa conexión.

## Cómo Obtener el Puerto VPN

### Opción 1: Script JavaScript en el Cliente (Recomendado)

Agregar este código al inicio de la aplicación Next.js (en `app/layout.tsx` o un componente global):

```typescript
// Obtener puerto VPN y agregarlo a todas las solicitudes fetch
if (typeof window !== 'undefined') {
  // Interceptar fetch para agregar header
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options = {}] = args;
    
    // Obtener puerto VPN desde sessionStorage o hacer una solicitud para obtenerlo
    let vpnPort = sessionStorage.getItem('vpn-port');
    
    if (!vpnPort) {
      // Intentar obtener el puerto VPN desde el servidor
      try {
        const response = await fetch('/api/vpn/get-my-port', {
          method: 'GET',
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          vpnPort = data.port;
          if (vpnPort) {
            sessionStorage.setItem('vpn-port', vpnPort);
          }
        }
      } catch (error) {
        console.warn('No se pudo obtener puerto VPN:', error);
      }
    }
    
    // Agregar header si tenemos el puerto
    const headers = new Headers(options.headers);
    if (vpnPort) {
      headers.set('X-VPN-Port', vpnPort);
    }
    
    return originalFetch(url, { ...options, headers });
  };
}
```

### Opción 2: API Endpoint para Obtener Puerto VPN

Crear un endpoint `/api/vpn/get-my-port` que lea el archivo de estado y devuelva el puerto VPN del cliente basándose en su IP pública.

### Opción 3: Script del Lado del Servidor (Nginx)

Si tienes acceso a Nginx, puedes crear un script que lea el archivo de estado de OpenVPN y agregue el header automáticamente basándose en la IP del cliente.

## Configuración en el Cliente

El cliente debe:
1. Obtener su puerto VPN (desde el archivo de estado o desde una API)
2. Enviarlo en el header `X-VPN-Port` en todas las solicitudes HTTP
3. Actualizar el puerto si la conexión VPN se reconecta (el puerto puede cambiar)

## Ventajas de Usar el Puerto VPN

- ✅ Identificación única por computadora
- ✅ Más seguro que solo usar IP pública
- ✅ No requiere split tunneling
- ✅ Funciona con múltiples computadoras en la misma red

## Nota Importante

Si el puerto VPN no se envía en el header, el sistema usará la verificación anterior (más estricta con múltiples conexiones). El puerto VPN es opcional pero recomendado para máxima seguridad.






'use client'

import { useEffect } from 'react'

/**
 * Componente que intercepta todas las solicitudes fetch para agregar
 * automáticamente el puerto VPN en el header X-VPN-Port
 */
export default function VpnPortInterceptor() {
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return

    // Función para obtener el puerto VPN
    const getVpnPort = async (): Promise<string | null> => {
      try {
        // Intentar obtener desde sessionStorage primero
        const cachedPort = sessionStorage.getItem('vpn-port')
        const cachedTimestamp = sessionStorage.getItem('vpn-port-timestamp')
        
        // Si tenemos un puerto en cache y tiene menos de 5 minutos, usarlo
        if (cachedPort && cachedTimestamp) {
          const age = Date.now() - parseInt(cachedTimestamp, 10)
          if (age < 5 * 60 * 1000) { // 5 minutos
            return cachedPort
          }
        }

        // Obtener puerto VPN desde el servidor
        const response = await fetch('/api/vpn/get-my-port', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.port) {
            // Guardar en sessionStorage con timestamp
            sessionStorage.setItem('vpn-port', data.port)
            sessionStorage.setItem('vpn-port-timestamp', Date.now().toString())
            return data.port
          }
        }
      } catch (error) {
        console.warn('[VPN Port] No se pudo obtener puerto VPN:', error)
      }
      return null
    }

    // Interceptar fetch global
    const originalFetch = window.fetch
    window.fetch = async function(...args) {
      const [url, options = {}] = args
      
      // No agregar header a solicitudes internas de Next.js o a la propia API de puerto
      const urlString = typeof url === 'string' ? url : url.toString()
      if (urlString.includes('/api/vpn/get-my-port') || 
          urlString.includes('/_next/') ||
          urlString.startsWith('data:') ||
          urlString.startsWith('blob:')) {
        return originalFetch(url, options)
      }

      // Obtener puerto VPN
      const vpnPort = await getVpnPort()
      
      // Preparar headers
      const headers = new Headers(options.headers)
      if (vpnPort) {
        headers.set('X-VPN-Port', vpnPort)
      }

      // Llamar fetch original con headers actualizados
      return originalFetch(url, { ...options, headers })
    }

    // Cleanup: restaurar fetch original cuando el componente se desmonte
    return () => {
      window.fetch = originalFetch
    }
  }, [])

  // Este componente no renderiza nada
  return null
}


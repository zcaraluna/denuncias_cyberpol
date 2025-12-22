'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Hook para verificar que el dispositivo esté autorizado
 * Redirige a /autenticar si no está autorizado
 */
export function useDeviceAuth() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const verificarDispositivo = async () => {
      try {
        // Verificar con el servidor si el dispositivo está autorizado
        const response = await fetch('/api/verificar-dispositivo', {
          method: 'GET',
          credentials: 'include', // Incluir cookies
        })

        const data = await response.json()

        if (data.autorizado) {
          setIsAuthorized(true)
        } else {
          // No autorizado, redirigir a /autenticar
          router.push('/autenticar')
        }
      } catch (error) {
        console.error('Error verificando dispositivo:', error)
        // En caso de error, redirigir por seguridad
        router.push('/autenticar')
      } finally {
        setIsChecking(false)
      }
    }

    verificarDispositivo()
  }, [router])

  return { isAuthorized, isChecking }
}




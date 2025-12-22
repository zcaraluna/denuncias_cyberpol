'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Usuario {
  id: number
  usuario: string
  nombre: string
  apellido: string
  grado: string
  oficina: string
  rol: string
}

/**
 * Hook para verificar y mantener la sesión del usuario
 * Verifica primero la cookie del servidor, luego sessionStorage como respaldo
 */
export function useAuth() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarUsuario = async () => {
      // Primero verificar sessionStorage (más rápido y confiable)
      if (typeof window !== 'undefined') {
        const usuarioStr = sessionStorage.getItem('usuario')
        if (usuarioStr) {
          try {
            const usuarioData = JSON.parse(usuarioStr)
            setUsuario(usuarioData)
            setLoading(false)
            
            // En segundo plano, verificar/restaurar cookie del servidor
            try {
              const response = await fetch('/api/auth/sesion', {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
              })
              
              const data = await response.json()
              
              if (data.autenticado && data.usuario) {
                // Cookie válida, sincronizar
                sessionStorage.setItem('usuario', JSON.stringify(data.usuario))
                setUsuario(data.usuario)
              } else {
                // No hay cookie válida, restaurarla desde sessionStorage
                try {
                  await fetch('/api/auth/sesion', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ usuario: usuarioData }),
                  })
                } catch (e) {
                  // Ignorar errores al restaurar cookie
                }
              }
            } catch (e) {
              // Ignorar errores de red, sessionStorage es suficiente
            }
            
            return
          } catch (error) {
            // sessionStorage corrupto, limpiarlo
            sessionStorage.removeItem('usuario')
          }
        }
      }
      
      // Si no hay sessionStorage, intentar desde cookie del servidor
      try {
        const response = await fetch('/api/auth/sesion', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })

        if (response.ok) {
          const data = await response.json()

          if (data.autenticado && data.usuario) {
            // Usuario autenticado desde cookie del servidor
            setUsuario(data.usuario)
            // Sincronizar con sessionStorage como respaldo
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('usuario', JSON.stringify(data.usuario))
            }
          } else {
            // No hay sesión válida
            router.push('/')
            return
          }
        } else {
          // Error en la respuesta
          router.push('/')
          return
        }
      } catch (error) {
        console.error('Error cargando usuario:', error)
        router.push('/')
        return
      } finally {
        setLoading(false)
      }
    }

    cargarUsuario()
  }, [router])

  const logout = async () => {
    try {
      // Cerrar sesión en el servidor
      await fetch('/api/auth/sesion', {
        method: 'DELETE',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Error cerrando sesión:', error)
    }
    
    // Limpiar sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('usuario')
    }
    
    setUsuario(null)
    router.push('/')
  }

  return { usuario, loading, logout }
}


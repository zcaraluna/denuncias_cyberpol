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
      try {
        // Primero intentar obtener la sesión del servidor (cookie)
        const response = await fetch('/api/auth/sesion', {
          method: 'GET',
          credentials: 'include',
        })

        const data = await response.json()

        if (data.autenticado && data.usuario) {
          // Usuario autenticado desde cookie del servidor
          setUsuario(data.usuario)
          // Sincronizar con sessionStorage como respaldo
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('usuario', JSON.stringify(data.usuario))
          }
        } else {
          // Si no hay cookie, intentar desde sessionStorage (compatibilidad)
          if (typeof window !== 'undefined') {
            const usuarioStr = sessionStorage.getItem('usuario')
            if (usuarioStr) {
              try {
                const usuarioData = JSON.parse(usuarioStr)
                setUsuario(usuarioData)
              } catch (error) {
                router.push('/')
                return
              }
            } else {
              router.push('/')
              return
            }
          } else {
            router.push('/')
            return
          }
        }
      } catch (error) {
        console.error('Error cargando usuario:', error)
        // En caso de error, intentar desde sessionStorage
        if (typeof window !== 'undefined') {
          const usuarioStr = sessionStorage.getItem('usuario')
          if (usuarioStr) {
            try {
              const usuarioData = JSON.parse(usuarioStr)
              setUsuario(usuarioData)
            } catch (err) {
              router.push('/')
              return
            }
          } else {
            router.push('/')
            return
          }
        } else {
          router.push('/')
          return
        }
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


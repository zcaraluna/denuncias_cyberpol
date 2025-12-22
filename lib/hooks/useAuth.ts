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
 * Usa sessionStorage como fuente principal (persiste durante la sesión del navegador)
 * Las cookies se usan como respaldo y sincronización
 */
export function useAuth() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Función helper para obtener usuario de sessionStorage
  const obtenerUsuarioDeSessionStorage = (): Usuario | null => {
    if (typeof window === 'undefined') return null
    try {
      const usuarioStr = sessionStorage.getItem('usuario')
      if (usuarioStr) {
        return JSON.parse(usuarioStr)
      }
    } catch (error) {
      console.error('Error leyendo sessionStorage:', error)
      sessionStorage.removeItem('usuario')
    }
    return null
  }

  useEffect(() => {
    // Cargar usuario inmediatamente desde sessionStorage si está disponible
    const usuarioSession = obtenerUsuarioDeSessionStorage()
    if (usuarioSession) {
      setUsuario(usuarioSession)
      setLoading(false)
      
      // En segundo plano, sincronizar con cookie del servidor
      fetch('/api/auth/sesion', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })
        .then(res => res.json())
        .then(data => {
          if (data.autenticado && data.usuario) {
            // Cookie válida, actualizar sessionStorage
            sessionStorage.setItem('usuario', JSON.stringify(data.usuario))
            setUsuario(data.usuario)
          } else {
            // No hay cookie, intentar restaurarla
            fetch('/api/auth/sesion', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ usuario: usuarioSession }),
            }).catch(() => {
              // Ignorar errores, sessionStorage es suficiente
            })
          }
        })
        .catch(() => {
          // Ignorar errores de red, sessionStorage es suficiente
        })
      
      return
    }
    
    // Si no hay sessionStorage, intentar desde cookie del servidor
    fetch('/api/auth/sesion', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    })
      .then(res => res.json())
      .then(data => {
        if (data.autenticado && data.usuario) {
          setUsuario(data.usuario)
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('usuario', JSON.stringify(data.usuario))
          }
        } else {
          // No hay sesión válida
          router.push('/')
        }
      })
      .catch(error => {
        console.error('Error cargando usuario:', error)
        router.push('/')
      })
      .finally(() => {
        setLoading(false)
      })
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


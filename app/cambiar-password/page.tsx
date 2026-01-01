'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

export default function CambiarPasswordPage() {
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()
  const [contraseñaActual, setContraseñaActual] = useState('')
  const [nuevaContraseña, setNuevaContraseña] = useState('')
  const [confirmarContraseña, setConfirmarContraseña] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Si ya terminó de cargar y no hay usuario, redirigir al login
    if (!authLoading && !usuario) {
      router.push('/')
    }
    // Si hay usuario pero no debe cambiar contraseña, redirigir al dashboard
    if (!authLoading && usuario && !usuario.debe_cambiar_contraseña) {
      router.push('/dashboard')
    }
  }, [usuario, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validaciones básicas
    if (nuevaContraseña.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    if (nuevaContraseña !== confirmarContraseña) {
      setError('Las contraseñas nuevas no coinciden')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/cambiar-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario_id: usuario?.id,
          contraseña_actual: contraseñaActual,
          nueva_contraseña: nuevaContraseña,
          confirmar_contraseña: confirmarContraseña,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al cambiar la contraseña')
        setLoading(false)
        return
      }

      // Actualizar el usuario en sessionStorage para reflejar que ya no debe cambiar la contraseña
      if (typeof window !== 'undefined' && usuario) {
        const usuarioActualizado = { ...usuario, debe_cambiar_contraseña: false }
        sessionStorage.setItem('usuario', JSON.stringify(usuarioActualizado))
      }

      // Redirigir al dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('Error de conexión. Por favor, intente nuevamente.')
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Cambiar Contraseña
          </h1>
          <p className="text-gray-600">
            Por seguridad, debes cambiar tu contraseña antes de continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="contraseña_actual" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña Actual
            </label>
            <input
              id="contraseña_actual"
              type="password"
              value={contraseñaActual}
              onChange={(e) => setContraseñaActual(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Ingrese su contraseña actual"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="nueva_contraseña" className="block text-sm font-medium text-gray-700 mb-2">
              Nueva Contraseña
            </label>
            <input
              id="nueva_contraseña"
              type="password"
              value={nuevaContraseña}
              onChange={(e) => setNuevaContraseña(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Mínimo 6 caracteres"
            />
            <p className="mt-1 text-xs text-gray-500">
              La contraseña debe tener al menos 6 caracteres
            </p>
          </div>

          <div>
            <label htmlFor="confirmar_contraseña" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nueva Contraseña
            </label>
            <input
              id="confirmar_contraseña"
              type="password"
              value={confirmarContraseña}
              onChange={(e) => setConfirmarContraseña(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Confirme su nueva contraseña"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Cambiando contraseña...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}


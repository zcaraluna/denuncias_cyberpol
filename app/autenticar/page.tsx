'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function AutenticarPage() {
  const router = useRouter()
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificando, setVerificando] = useState(true)

  // Verificar si el dispositivo ya está autorizado
  useEffect(() => {
    const verificarAutorizacion = async () => {
      try {
        // Primero verificar si hay cookie válida en el servidor
        const response = await fetch('/api/verificar-dispositivo', {
          method: 'GET',
          credentials: 'include', // Incluir cookies
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.autorizado && data.fingerprint) {
            // Hay cookie válida y está autorizado
            // Guardar en localStorage como respaldo y redirigir
            localStorage.setItem('device_fingerprint', data.fingerprint)
            router.push('/')
            return
          }
        }
        
        // Si llegamos aquí, no está autorizado o no hay cookie
        // Limpiar localStorage por si acaso
        localStorage.removeItem('device_fingerprint')
        
        // Mostrar el formulario
        setVerificando(false)
      } catch (err) {
        console.error('Error verificando autorización:', err)
        // En caso de error, también mostrar el formulario
        localStorage.removeItem('device_fingerprint')
        setVerificando(false)
      }
    }

    verificarAutorizacion()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/autenticar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codigo: codigo.trim().toUpperCase() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al autenticar el dispositivo')
        setLoading(false)
        return
      }

      // Guardar el fingerprint en localStorage (como respaldo)
      // La cookie se establece automáticamente desde el servidor
      if (data.fingerprint) {
        localStorage.setItem('device_fingerprint', data.fingerprint)
      }

      // Redirigir al login
      router.push('/')
    } catch (err) {
      setError('Error de conexión. Por favor, intente nuevamente.')
      setLoading(false)
    }
  }

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autorización...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Autenticación de Dispositivo
          </h1>
          <p className="text-gray-600">
            Ingrese el código de activación proporcionado por el administrador
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-2">
              Código de Activación
            </label>
            <input
              id="codigo"
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-center text-lg font-mono tracking-wider"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              maxLength={64}
              autoFocus
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
            {loading ? 'Autenticando...' : 'Autenticar Dispositivo'}
          </button>

          <div className="text-center text-sm text-gray-500">
            <p>
              Este código solo puede ser utilizado una vez.
              <br />
              Contacte al administrador si necesita un nuevo código.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}


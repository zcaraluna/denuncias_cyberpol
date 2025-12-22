'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Usuario {
  id: number
  usuario: string
  nombre: string
  apellido: string
  grado: string
  oficina: string
  rol: string
}

// Componente para activar/desactivar modo demo (sin requisito de autenticación de dispositivo)
function ModoDemoToggle({ usuario }: { usuario: Usuario }) {
  const [requiere, setRequiere] = useState<boolean | null>(null)
  const [cargando, setCargando] = useState(true)
  const [cambiando, setCambiando] = useState(false)

  useEffect(() => {
    cargarEstado()
  }, [])

  const cargarEstado = async () => {
    try {
      const response = await fetch('/api/configuracion-autenticacion')
      if (response.ok) {
        const data = await response.json()
        setRequiere(data.requiere)
      }
    } catch (error) {
      console.error('Error cargando configuración:', error)
    } finally {
      setCargando(false)
    }
  }

  const cambiarModo = async () => {
    if (cambiando) return

    setCambiando(true)
    try {
      const nuevoEstado = !requiere
      const response = await fetch('/api/configuracion-autenticacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requiere: nuevoEstado,
          usuario: usuario.usuario,
          usuario_rol: usuario.rol,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setRequiere(nuevoEstado)
        alert(data.mensaje || (nuevoEstado ? 'Modo normal activado' : 'Modo demostración activado'))
        // Recargar la página para que el middleware aplique los cambios
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al cambiar el modo')
      }
    } catch (error) {
      console.error('Error cambiando modo:', error)
      alert('Error al cambiar el modo')
    } finally {
      setCambiando(false)
    }
  }

  if (cargando) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-300">
        <div className="text-gray-600">Cargando configuración...</div>
      </div>
    )
  }

  const estaEnModoDemo = requiere === false

  return (
    <div className={`rounded-lg shadow-md p-6 border-2 transition ${
      estaEnModoDemo 
        ? 'bg-yellow-50 border-yellow-400' 
        : 'bg-white border-gray-300'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            {estaEnModoDemo && (
              <span className="px-2 py-1 text-xs font-bold bg-yellow-400 text-yellow-900 rounded">
                MODO DEMO ACTIVO
              </span>
            )}
            Autenticación de Dispositivo
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            {estaEnModoDemo
              ? 'Cualquier usuario puede acceder sin código de activación (ideal para demostraciones)'
              : 'Se requiere código de activación para nuevos dispositivos'}
          </p>
        </div>
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      </div>
      
      <button
        onClick={cambiarModo}
        disabled={cambiando}
        className={`w-full px-4 py-2 rounded-lg font-medium transition ${
          estaEnModoDemo
            ? 'bg-gray-700 hover:bg-gray-800 text-white'
            : 'bg-yellow-500 hover:bg-yellow-600 text-yellow-900'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {cambiando
          ? 'Cambiando...'
          : estaEnModoDemo
          ? 'Activar Requisito de Código'
          : 'Desactivar Requisito (Modo Demo)'}
      </button>
      
      {estaEnModoDemo && (
        <p className="text-xs text-yellow-700 mt-3 text-center">
          ⚠️ Recuerda reactivar el requisito después de la demostración
        </p>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const usuarioStr = sessionStorage.getItem('usuario')
    if (!usuarioStr) {
      router.push('/')
      return
    }

    try {
      const usuarioData = JSON.parse(usuarioStr)
      setUsuario(usuarioData)
    } catch (error) {
      router.push('/')
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    sessionStorage.removeItem('usuario')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  if (!usuario) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">
                Sistema de Denuncias
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{usuario.grado} {usuario.nombre} {usuario.apellido}</span>
                <span className="ml-2 text-gray-400">•</span>
                <span className="ml-2">{usuario.oficina}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Panel de Control
          </h2>
          <p className="text-gray-600">
            Gestión de denuncias policiales
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/nueva-denuncia"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Nueva Denuncia
              </h3>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              Crear una nueva denuncia policial
            </p>
          </Link>

          <Link
            href="/mis-denuncias"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Mis Denuncias
              </h3>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              Ver mis denuncias y borradores
            </p>
          </Link>

          {(usuario.rol === 'admin' || usuario.rol === 'superadmin') && (
            <>
              <Link
                href="/gestion-usuarios"
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-orange-500"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Gestión de Usuarios
                  </h3>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Administrar usuarios del sistema
                </p>
              </Link>
              
              <Link
                href="/log-visitas"
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-indigo-500"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Log de Visitas
                  </h3>
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Ver registro de consultas a denuncias
                </p>
              </Link>
            </>
          )}

          {usuario.rol === 'superadmin' && (
            <>
              <Link
                href="/gestion-dispositivos"
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Gestión de Dispositivos
                  </h3>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Administrar dispositivos autorizados y códigos de activación
                </p>
              </Link>
              
              <ModoDemoToggle usuario={usuario} />
            </>
          )}

          <Link
            href="/denuncias"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-purple-500"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Denuncias
              </h3>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              {usuario.rol === 'admin' || usuario.rol === 'superadmin' 
                ? 'Ver todas las denuncias del sistema'
                : 'Buscar denuncia por hash'}
            </p>
          </Link>

          <div
            className="bg-gray-100 rounded-lg shadow-md p-6 border-2 border-gray-300 opacity-60 cursor-not-allowed"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-500">
                Reportes
              </h3>
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-500 text-sm">
              Generar reportes y estadísticas (Deshabilitado)
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}


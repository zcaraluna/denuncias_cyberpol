'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'

interface Usuario {
  id: number
  usuario: string
  nombre: string
  apellido: string
  grado: string
  oficina: string
  rol: string
  activo: boolean
}

interface Dispositivo {
  id: number
  fingerprint: string
  nombre: string | null
  user_agent: string | null
  ip_address: string | null
  autorizado_en: string
  ultimo_acceso: string
  activo: boolean
  codigo_activacion: string | null
  codigo_usado: boolean | null
  codigo_expira_en: string | null
  codigo_activo: boolean | null
}

interface Codigo {
  id: number
  codigo: string
  nombre: string | null
  usado: boolean
  usado_en: string | null
  dispositivo_fingerprint: string | null
  creado_en: string
  expira_en: string | null
  activo: boolean
  dias_restantes: number | null
  esta_expirado: boolean
}

export default function GestionDispositivosPage() {
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
  const [codigos, setCodigos] = useState<Codigo[]>([])
  const [loading, setLoading] = useState(true)
  const [tabActivo, setTabActivo] = useState<'dispositivos' | 'codigos'>('dispositivos')

  useEffect(() => {
    if (usuario) {
      // Solo superadmin puede acceder a esta página
      if (usuario.rol !== 'superadmin') {
        router.push('/dashboard')
        return
      }
      cargarDatos()
    }
  }, [usuario, router])

  const cargarDatos = async () => {
    if (!usuario) return

    try {
      const response = await fetch(`/api/dispositivos?usuario_id=${usuario.id}&usuario_rol=${usuario.rol}`)
      if (!response.ok) throw new Error('Error al cargar datos')
      
      const data = await response.json()
      setDispositivos(data.dispositivos)
      setCodigos(data.codigos)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (usuario && usuario.rol === 'superadmin') {
      cargarDatos()
    }
  }, [usuario])

  const handleDesactivar = async (tipo: 'dispositivo' | 'codigo', id: number) => {
    const nombreTipo = tipo === 'dispositivo' ? 'dispositivo' : 'código'
    if (!confirm(`¿Está seguro de que desea desactivar este ${nombreTipo}?`)) {
      return
    }

    if (!usuario) return

    try {
      const response = await fetch('/api/dispositivos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, id, usuario_rol: usuario.rol })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || `Error al desactivar ${nombreTipo}`)
        return
      }

      alert(`${nombreTipo.charAt(0).toUpperCase() + nombreTipo.slice(1)} desactivado exitosamente`)
      cargarDatos()
    } catch (error) {
      console.error('Error:', error)
      alert(`Error al desactivar ${nombreTipo}`)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('usuario')
    router.push('/')
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-PY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatearCodigo = (codigo: string) => {
    // Formatear código con guiones cada 4 caracteres
    return codigo.match(/.{1,4}/g)?.join('-') || codigo
  }

  const obtenerEstadoCodigo = (codigo: Codigo) => {
    if (!codigo.activo) return { texto: 'Desactivado', className: 'bg-red-100 text-red-800' }
    if (codigo.usado) return { texto: 'Usado', className: 'bg-gray-100 text-gray-800' }
    if (codigo.esta_expirado) return { texto: 'Expirado', className: 'bg-orange-100 text-orange-800' }
    if (codigo.dias_restantes !== null) {
      if (codigo.dias_restantes <= 7) return { texto: `Expira en ${codigo.dias_restantes} días`, className: 'bg-yellow-100 text-yellow-800' }
      return { texto: `Válido (${codigo.dias_restantes} días)`, className: 'bg-green-100 text-green-800' }
    }
    return { texto: 'Válido', className: 'bg-green-100 text-green-800' }
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
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Sistema de Denuncias</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/gestion-usuarios" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Usuarios
                </Link>
                <Link href="/gestion-dispositivos" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dispositivos
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">
                {usuario.nombre} {usuario.apellido}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Dispositivos y Códigos</h2>
            <p className="text-gray-600">Administra los dispositivos autorizados y códigos de activación</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setTabActivo('dispositivos')}
                className={`${
                  tabActivo === 'dispositivos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Dispositivos Autorizados ({dispositivos.length})
              </button>
              <button
                onClick={() => setTabActivo('codigos')}
                className={`${
                  tabActivo === 'codigos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Códigos de Activación ({codigos.length})
              </button>
            </nav>
          </div>

          {/* Tab Dispositivos */}
          {tabActivo === 'dispositivos' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {dispositivos.length === 0 ? (
                  <li className="px-6 py-4 text-center text-gray-500">
                    No hay dispositivos autorizados
                  </li>
                ) : (
                  dispositivos.map((dispositivo) => (
                    <li key={dispositivo.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-gray-900">
                              {dispositivo.nombre || 'Dispositivo sin nombre'}
                            </h3>
                            {dispositivo.activo ? (
                              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Activo
                              </span>
                            ) : (
                              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Desactivado
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-sm text-gray-500 space-y-1">
                            <p><strong>Fingerprint:</strong> {dispositivo.fingerprint.substring(0, 16)}...</p>
                            <p><strong>IP:</strong> {dispositivo.ip_address || 'N/A'}</p>
                            <p><strong>Autorizado:</strong> {formatearFecha(dispositivo.autorizado_en)}</p>
                            <p><strong>Último acceso:</strong> {formatearFecha(dispositivo.ultimo_acceso)}</p>
                            {dispositivo.codigo_activacion && (
                              <p><strong>Código usado:</strong> {formatearCodigo(dispositivo.codigo_activacion)}</p>
                            )}
                          </div>
                        </div>
                        {dispositivo.activo && (
                          <button
                            onClick={() => handleDesactivar('dispositivo', dispositivo.id)}
                            className="ml-4 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                          >
                            Desactivar
                          </button>
                        )}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          {/* Tab Códigos */}
          {tabActivo === 'codigos' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {codigos.length === 0 ? (
                  <li className="px-6 py-4 text-center text-gray-500">
                    No hay códigos de activación
                  </li>
                ) : (
                  codigos.map((codigo) => {
                    const estado = obtenerEstadoCodigo(codigo)
                    return (
                      <li key={codigo.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h3 className="text-lg font-medium text-gray-900">
                                {codigo.nombre || 'Código sin nombre'}
                              </h3>
                              <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estado.className}`}>
                                {estado.texto}
                              </span>
                            </div>
                            <div className="mt-2 text-sm text-gray-500 space-y-1">
                              <p><strong>Código:</strong> {formatearCodigo(codigo.codigo)}</p>
                              <p><strong>Creado:</strong> {formatearFecha(codigo.creado_en)}</p>
                              {codigo.expira_en && (
                                <p><strong>Expira:</strong> {formatearFecha(codigo.expira_en)}</p>
                              )}
                              {codigo.usado && codigo.usado_en && (
                                <p><strong>Usado:</strong> {formatearFecha(codigo.usado_en)}</p>
                              )}
                              {codigo.dispositivo_fingerprint && (
                                <p><strong>Fingerprint dispositivo:</strong> {codigo.dispositivo_fingerprint.substring(0, 16)}...</p>
                              )}
                            </div>
                          </div>
                          {codigo.activo && !codigo.usado && (
                            <button
                              onClick={() => handleDesactivar('codigo', codigo.id)}
                              className="ml-4 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                            >
                              Desactivar
                            </button>
                          )}
                        </div>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


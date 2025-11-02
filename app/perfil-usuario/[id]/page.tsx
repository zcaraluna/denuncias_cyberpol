'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Visita {
  id: number
  denuncia_id: number
  fecha_visita: string
  numero_orden: number
  nombre_denunciante: string
  hash_denuncia: string
  tipo_hecho: string
  fecha_denuncia: string
}

interface DenunciaTomada {
  id: number
  numero_orden: number
  nombre_denunciante: string
  cedula_denunciante: string
  tipo_hecho: string
  fecha_denuncia: string
  hora_denuncia: string
  hash_denuncia: string
}

interface Usuario {
  id: number
  nombre: string
  apellido: string
  grado: string
  oficina: string
  rol: string
  usuario: string
  activo: boolean
}

export default function PerfilUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [usuarioActivo, setUsuarioActivo] = useState<Usuario | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [denunciasTomadas, setDenunciasTomadas] = useState<DenunciaTomada[]>([])
  const [loading, setLoading] = useState(true)
  const [usuarioId, setUsuarioId] = useState<string>('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [paginaActualTomadas, setPaginaActualTomadas] = useState(1)
  const [pestañaActiva, setPestañaActiva] = useState<'consultadas' | 'tomadas'>('consultadas')
  const itemsPorPagina = 10

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setUsuarioId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    const usuarioStr = sessionStorage.getItem('usuario')
    if (!usuarioStr) {
      router.push('/')
      return
    }

    try {
      const usuarioData = JSON.parse(usuarioStr)
      setUsuarioActivo(usuarioData)
      
      if (usuarioData.rol !== 'superadmin' && usuarioData.rol !== 'admin') {
        router.push('/dashboard')
        return
      }
    } catch (error) {
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    if (!usuarioId || !usuarioActivo) return

    const cargarDatos = async () => {
      try {
        const [usuarioResponse, visitasResponse, denunciasTomadasResponse] = await Promise.all([
          fetch(`/api/usuarios/${usuarioId}`, { cache: 'no-store' }),
          fetch(`/api/log-visitas/usuario/${usuarioId}`, { cache: 'no-store' }),
          fetch(`/api/denuncias/usuario/${usuarioId}`, { cache: 'no-store' })
        ])

        if (!usuarioResponse.ok) throw new Error('Error al cargar usuario')
        if (!visitasResponse.ok) throw new Error('Error al cargar visitas')
        if (!denunciasTomadasResponse.ok) throw new Error('Error al cargar denuncias tomadas')

        const usuarioData = await usuarioResponse.json()
        const visitasData = await visitasResponse.json()
        const denunciasTomadasData = await denunciasTomadasResponse.json()

        setUsuario(usuarioData)
        setVisitas(visitasData)
        setDenunciasTomadas(denunciasTomadasData)
      } catch (error) {
        console.error('Error:', error)
        alert('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [usuarioId, usuarioActivo])

  const handleLogout = () => {
    sessionStorage.removeItem('usuario')
    router.push('/')
  }

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Asuncion'
    })
  }

  // Cálculos de paginación para denuncias consultadas
  const totalPaginasConsultadas = Math.ceil(visitas.length / itemsPorPagina)
  const indiceInicioConsultadas = (paginaActual - 1) * itemsPorPagina
  const indiceFinConsultadas = indiceInicioConsultadas + itemsPorPagina
  const visitasPaginaActual = visitas.slice(indiceInicioConsultadas, indiceFinConsultadas)

  // Cálculos de paginación para denuncias tomadas
  const totalPaginasTomadas = Math.ceil(denunciasTomadas.length / itemsPorPagina)
  const indiceInicioTomadas = (paginaActualTomadas - 1) * itemsPorPagina
  const indiceFinTomadas = indiceInicioTomadas + itemsPorPagina
  const denunciasTomadasPaginaActual = denunciasTomadas.slice(indiceInicioTomadas, indiceFinTomadas)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  if (!usuarioActivo || !usuario) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/gestion-usuarios" className="text-gray-600 hover:text-gray-900">
              ← Volver a Gestión de Usuarios
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Perfil de Usuario</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Información del Usuario</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuario</p>
              <p className="text-base text-gray-900">{usuario.usuario}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Rol</p>
              <p className="text-base text-gray-900">{usuario.rol}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Nombre Completo</p>
              <p className="text-base text-gray-900">{usuario.nombre} {usuario.apellido}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Grado</p>
              <p className="text-base text-gray-900">{usuario.grado}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Oficina</p>
              <p className="text-base text-gray-900">{usuario.oficina}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Estado</p>
              <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                usuario.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {usuario.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => {
                setPestañaActiva('consultadas')
                setPaginaActual(1)
              }}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                pestañaActiva === 'consultadas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Denuncias Consultadas ({visitas.length})
            </button>
            <button
              onClick={() => {
                setPestañaActiva('tomadas')
                setPaginaActualTomadas(1)
              }}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                pestañaActiva === 'tomadas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Denuncias Tomadas ({denunciasTomadas.length})
            </button>
          </div>
        </div>

        {/* Pestaña: Denuncias Consultadas */}
        {pestañaActiva === 'consultadas' && (
          <>
            {visitas.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">Este usuario no ha consultado ninguna denuncia</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            FECHA Y HORA
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            DENUNCIA #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            DENUNCIANTE
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            TIPO
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            HASH
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ACCIÓN
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {visitasPaginaActual.map((visita) => (
                          <tr key={visita.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatearFecha(visita.fecha_visita)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {visita.numero_orden}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {visita.nombre_denunciante}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {visita.tipo_hecho}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                              {visita.hash_denuncia}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link
                                href={`/ver-denuncia/${visita.denuncia_id}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Ver
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {totalPaginasConsultadas > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                      disabled={paginaActual === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    <span className="px-4 py-2 text-gray-700">
                      Página {paginaActual} de {totalPaginasConsultadas}
                    </span>
                    <button
                      onClick={() => setPaginaActual(prev => Math.min(totalPaginasConsultadas, prev + 1))}
                      disabled={paginaActual === totalPaginasConsultadas}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Pestaña: Denuncias Tomadas */}
        {pestañaActiva === 'tomadas' && (
          <>
            {denunciasTomadas.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">Este usuario no ha tomado ninguna denuncia</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            DENUNCIA #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            DENUNCIANTE
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            CÉDULA
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            TIPO
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            FECHA Y HORA
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ACCIÓN
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {denunciasTomadasPaginaActual.map((denuncia) => (
                          <tr key={denuncia.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {denuncia.numero_orden}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {denuncia.nombre_denunciante}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {denuncia.cedula_denunciante}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {denuncia.tipo_hecho}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(denuncia.fecha_denuncia + 'T' + denuncia.hora_denuncia).toLocaleString('es-PY', { timeZone: 'America/Asuncion', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link
                                href={`/ver-denuncia/${denuncia.id}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Ver
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {totalPaginasTomadas > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPaginaActualTomadas(prev => Math.max(1, prev - 1))}
                      disabled={paginaActualTomadas === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    <span className="px-4 py-2 text-gray-700">
                      Página {paginaActualTomadas} de {totalPaginasTomadas}
                    </span>
                    <button
                      onClick={() => setPaginaActualTomadas(prev => Math.min(totalPaginasTomadas, prev + 1))}
                      disabled={paginaActualTomadas === totalPaginasTomadas}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}


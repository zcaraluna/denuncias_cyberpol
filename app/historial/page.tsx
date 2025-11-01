'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Denuncia {
  id: number
  nombre_denunciante: string
  cedula_denunciante: string
  operador: string
  fecha_denuncia: string
  hora_denuncia: string
  numero_orden: number
  tipo_hecho: string
  hash_denuncia: string
}

interface Usuario {
  id: number
  nombre: string
  apellido: string
  grado: string
  oficina: string
}

export default function HistorialPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [denuncias, setDenuncias] = useState<Denuncia[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroFecha, setFiltroFecha] = useState('')
  const [filtroCedula, setFiltroCedula] = useState('')
  const [filtroHash, setFiltroHash] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [tipoPapelSeleccionado, setTipoPapelSeleccionado] = useState<'oficio' | 'a4'>('oficio')
  const [denunciaSeleccionada, setDenunciaSeleccionada] = useState<number | null>(null)

  useEffect(() => {
    const usuarioStr = sessionStorage.getItem('usuario')
    if (!usuarioStr) {
      router.push('/')
      return
    }

    try {
      const usuarioData = JSON.parse(usuarioStr)
      setUsuario(usuarioData)
      cargarDenuncias()
    } catch (error) {
      router.push('/')
    }
  }, [router])

  const cargarDenuncias = async () => {
    try {
      const params = new URLSearchParams()
      if (filtroFecha) params.append('fecha', filtroFecha)
      if (filtroCedula) params.append('cedula', filtroCedula)
      if (filtroHash) params.append('hash', filtroHash)

      const response = await fetch(`/api/denuncias/historial?${params.toString()}`)
      if (!response.ok) throw new Error('Error al cargar denuncias')
      
      const data = await response.json()
      setDenuncias(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (usuario) {
      const timeout = setTimeout(() => {
        cargarDenuncias()
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [filtroFecha, filtroCedula, filtroHash])

  const handleLogout = () => {
    sessionStorage.removeItem('usuario')
    router.push('/')
  }

  const descargarPDF = async (id: number) => {
    setDenunciaSeleccionada(id)
    setMostrarModal(true)
  }

  const handleConfirmarDescarga = () => {
    if (denunciaSeleccionada) {
      window.open(`/api/denuncias/pdf/${denunciaSeleccionada}?tipo=${tipoPapelSeleccionado}`, '_blank')
      setMostrarModal(false)
      setDenunciaSeleccionada(null)
    }
  }

  const formatearFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString('es-PY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return fecha
    }
  }

  if (loading && !usuario) {
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
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← Volver
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Historial de Denuncias</h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{usuario.grado} {usuario.nombre} {usuario.apellido}</span>
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
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros de Búsqueda</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cédula
              </label>
              <input
                type="text"
                value={filtroCedula}
                onChange={(e) => setFiltroCedula(e.target.value)}
                placeholder="Buscar por cédula..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hash
              </label>
              <input
                type="text"
                value={filtroHash}
                onChange={(e) => setFiltroHash(e.target.value)}
                placeholder="Buscar por hash..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Tabla de denuncias */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Denunciante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cédula
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center">
                      Cargando...
                    </td>
                  </tr>
                ) : denuncias.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No se encontraron denuncias
                    </td>
                  </tr>
                ) : (
                  denuncias.map((denuncia) => (
                    <tr key={denuncia.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {denuncia.numero_orden}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {denuncia.nombre_denunciante}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {denuncia.cedula_denunciante}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatearFecha(denuncia.fecha_denuncia)} {denuncia.hora_denuncia}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {denuncia.tipo_hecho}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {denuncia.hash_denuncia}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {denuncia.operador}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => descargarPDF(denuncia.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal de selección de tipo de papel */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Seleccionar Tipo de Papel
            </h3>
            <p className="text-gray-600 mb-6">
              Elija el tamaño de papel para la impresión del documento:
            </p>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                <input
                  type="radio"
                  value="oficio"
                  checked={tipoPapelSeleccionado === 'oficio'}
                  onChange={(e) => setTipoPapelSeleccionado(e.target.value as 'oficio' | 'a4')}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Oficio (8.5" x 13")</p>
                  <p className="text-sm text-gray-600">Formato estándar para documentos oficiales</p>
                </div>
              </label>
              
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                <input
                  type="radio"
                  value="a4"
                  checked={tipoPapelSeleccionado === 'a4'}
                  onChange={(e) => setTipoPapelSeleccionado(e.target.value as 'oficio' | 'a4')}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">A4 (8.27" x 11.69")</p>
                  <p className="text-sm text-gray-600">Formato internacional estándar</p>
                </div>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setMostrarModal(false)
                  setDenunciaSeleccionada(null)
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarDescarga}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
              >
                Descargar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


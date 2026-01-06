'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'

interface ReporteRow {
  numero_denuncia: number
  año: number
  hora_denuncia: string
  shp: string
  denunciante: string
  interviniente: string
  oficina?: string
}

type SortField = 'numero_denuncia' | 'hora_denuncia'
type SortDirection = 'asc' | 'desc'

export default function ReportesPage() {
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [fecha, setFecha] = useState('')
  const [tipoDenuncia, setTipoDenuncia] = useState('')
  const [datos, setDatos] = useState<ReporteRow[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tiposDisponibles, setTiposDisponibles] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('hora_denuncia')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  useEffect(() => {
    if (!authLoading) {
      setLoading(false)
    }
  }, [authLoading])

  useEffect(() => {
    if (!fecha) {
      setTiposDisponibles([])
      setTipoDenuncia('')
    }
  }, [fecha])

  const handleBuscar = async () => {
    if (!fecha) {
      setError('Por favor seleccione una fecha')
      return
    }

    setError(null)
    setCargando(true)
    setDatos([])
    
    try {
      const params = new URLSearchParams()
      params.append('fecha', fecha)
      if (tipoDenuncia) params.append('tipoDenuncia', tipoDenuncia)

      const response = await fetch(`/api/reportes/simple?${params.toString()}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener reporte')
      }
      
      console.log('Datos recibidos:', data)
      setDatos(data)
      
      // Actualizar tipos disponibles basados en los resultados
      const tiposUnicos = Array.from(new Set(data.map((row: ReporteRow) => row.shp).filter((tipo): tipo is string => Boolean(tipo))))
      setTiposDisponibles(tiposUnicos.sort())
      
      if (data.length === 0) {
        setError(`No se encontraron denuncias para los filtros seleccionados`)
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar el reporte'
      setError(errorMessage)
      setDatos([])
    } finally {
      setCargando(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const datosOrdenados = useMemo(() => {
    const sorted = [...datos]
    sorted.sort((a, b) => {
      let comparison = 0
      
      if (sortField === 'numero_denuncia') {
        comparison = a.numero_denuncia - b.numero_denuncia
      } else if (sortField === 'hora_denuncia') {
        // Comparar horas en formato HH:MM
        const horaA = a.hora_denuncia || '00:00'
        const horaB = b.hora_denuncia || '00:00'
        comparison = horaA.localeCompare(horaB)
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
    
    return sorted
  }, [datos, sortField, sortDirection])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      router.push('/login')
    }
  }

  const handleLimpiarFiltros = () => {
    setFecha('')
    setTipoDenuncia('')
    setDatos([])
    setError(null)
    setTiposDisponibles([])
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Cargando...</div>
      </div>
    )
  }

  if (!usuario) {
    return null
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al Inicio
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Reportes de Denuncias</h1>
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
        {/* Panel de Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros de Búsqueda
            </h2>
            {(fecha || tipoDenuncia) && (
              <button
                onClick={handleLimpiarFiltros}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="fecha"
                value={fecha}
                onChange={(e) => {
                  setFecha(e.target.value)
                  setTipoDenuncia('') // Limpiar tipo cuando cambia la fecha
                  setError(null)
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleBuscar()
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label htmlFor="tipoDenuncia" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Denuncia
                {!fecha && (
                  <span className="text-xs text-gray-500 ml-2">(Seleccione una fecha primero)</span>
                )}
              </label>
              <select
                id="tipoDenuncia"
                value={tipoDenuncia}
                onChange={(e) => setTipoDenuncia(e.target.value)}
                disabled={!fecha || tiposDisponibles.length === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Todos los tipos</option>
                {tiposDisponibles.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleBuscar}
              disabled={cargando || !fecha}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
            >
              {cargando ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Buscando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Buscar
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabla de resultados */}
        {datosOrdenados.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Resultados
                </h2>
                <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                  {datosOrdenados.length} denuncia{datosOrdenados.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                      onClick={() => handleSort('numero_denuncia')}
                    >
                      <div className="flex items-center gap-2">
                        Num. de Denuncia
                        <SortIcon field="numero_denuncia" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                      onClick={() => handleSort('hora_denuncia')}
                    >
                      <div className="flex items-center gap-2">
                        Hora de denuncia
                        <SortIcon field="hora_denuncia" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      S.H.P.
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Denunciante
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Interviniente
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {datosOrdenados.map((row, index) => (
                    <tr key={index} className="hover:bg-blue-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.numero_denuncia}/{row.año}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.hora_denuncia || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="inline-block max-w-xs truncate" title={row.shp || ''}>
                          {row.shp || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {row.denunciante || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {row.interviniente || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

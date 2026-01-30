'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'

interface ReporteRow {
  numero_denuncia: number
  año: number
  hora_denuncia: string
  shp: string // Para compatibilidad
  tipo_especifico?: string
  tipo_general?: string
  denunciante: string
  interviniente: string
  oficina?: string
}

interface ResumenTipo {
  tipo: string
  total: number
}

interface Recurrente {
  denunciante: string
  cedula: string
  cantidad: number
  numeros_denuncia: string[]
  tipos: string[]
  oficiales: string[]
}

interface DatosMensuales {
  resumen_especifico: ResumenTipo[]
  resumen_general: ResumenTipo[]
  denunciantes_recurrentes: Recurrente[]
}

type SortField = 'numero_denuncia' | 'hora_denuncia'
type SortDirection = 'asc' | 'desc'
type Tab = 'diario' | 'mensual'

export default function ReportesPage() {
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('diario')
  const [mostrarGeneral, setMostrarGeneral] = useState(false)

  // Estado para reporte diario
  const [fecha, setFecha] = useState('')
  const [tipoDenuncia, setTipoDenuncia] = useState('')
  const [datos, setDatos] = useState<ReporteRow[]>([])
  const [tiposDisponibles, setTiposDisponibles] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('hora_denuncia')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Estado para reporte mensual
  const [mes, setMes] = useState(new Date().getMonth() + 1 + '')
  const [año, setAño] = useState(new Date().getFullYear() + '')
  const [datosMensuales, setDatosMensuales] = useState<DatosMensuales | null>(null)

  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      setLoading(false)
    }
  }, [authLoading])

  useEffect(() => {
    if (!fecha || activeTab !== 'diario') {
      setTiposDisponibles([])
      setTipoDenuncia('')
      return
    }

    const cargarTipos = async () => {
      try {
        const response = await fetch(`/api/reportes/simple?fecha=${fecha}`)
        if (response.ok) {
          const data = await response.json()
          const tiposUnicos: string[] = Array.from(
            new Set(data.map((row: ReporteRow) => row.shp).filter((tipo: string | undefined): tipo is string => Boolean(tipo)))
          )
          setTiposDisponibles(tiposUnicos.sort())
        }
      } catch (error) {
        console.error('Error cargando tipos disponibles:', error)
        setTiposDisponibles([])
      }
    }

    const timeoutId = setTimeout(cargarTipos, 500)
    return () => clearTimeout(timeoutId)
  }, [fecha, activeTab])

  const handleBuscarDiario = async () => {
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

      setDatos(data)

      const tiposUnicos: string[] = Array.from(new Set(data.map((row: ReporteRow) => row.shp).filter((tipo: string | undefined): tipo is string => Boolean(tipo))))
      setTiposDisponibles(tiposUnicos.sort())

      if (data.length === 0 && fecha) {
        setError(`No se encontraron denuncias para la fecha ${fecha}${tipoDenuncia ? ` y tipo "${tipoDenuncia}"` : ''}`)
      } else {
        setError(null)
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

  const handleBuscarMensual = async () => {
    setError(null)
    setCargando(true)
    setDatosMensuales(null)

    try {
      const params = new URLSearchParams()
      params.append('mes', mes)
      params.append('año', año)

      const response = await fetch(`/api/reportes/mensual?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener resumen mensual')
      }

      setDatosMensuales(data)

      if (data.resumen_especifico.length === 0 && data.resumen_general.length === 0) {
        setError(`No se encontraron denuncias para el período ${mes}/${año}`)
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar el resumen mensual'
      setError(errorMessage)
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
    if (activeTab === 'diario') {
      setFecha('')
      setTipoDenuncia('')
      setDatos([])
      setTiposDisponibles([])
    } else {
      setMes(new Date().getMonth() + 1 + '')
      setAño(new Date().getFullYear() + '')
      setDatosMensuales(null)
    }
    setError(null)
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

  const meses = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ]

  const años = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())

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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          {/* Pestañas */}
          <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-full md:max-w-md">
            <button
              onClick={() => setActiveTab('diario')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'diario'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              Búsqueda Diaria
            </button>
            <button
              onClick={() => setActiveTab('mensual')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'mensual'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              Resumen Mensual
            </button>
          </div>
        </div>

        {/* Panel de Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros de {activeTab === 'diario' ? 'Búsqueda' : 'Resumen'}
            </h2>
            <button
              onClick={handleLimpiarFiltros}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar filtros
            </button>
          </div>

          {activeTab === 'diario' ? (
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
                    setTipoDenuncia('')
                    setError(null)
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleBuscarDiario()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label htmlFor="tipoDenuncia" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Denuncia
                  {!fecha && <span className="text-xs text-gray-500 ml-2">(Seleccione una fecha primero)</span>}
                </label>
                <select
                  id="tipoDenuncia"
                  value={tipoDenuncia}
                  onChange={(e) => setTipoDenuncia(e.target.value)}
                  disabled={!fecha}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Todos los tipos</option>
                  {tiposDisponibles.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="mes" className="block text-sm font-medium text-gray-700 mb-2">Mes</label>
                <select
                  id="mes"
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  {meses.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="año" className="block text-sm font-medium text-gray-700 mb-2">Año</label>
                <select
                  id="año"
                  value={año}
                  onChange={(e) => setAño(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  {años.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={activeTab === 'diario' ? handleBuscarDiario : handleBuscarMensual}
              disabled={cargando || (activeTab === 'diario' && !fecha)}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
            >
              {cargando ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {activeTab === 'diario' ? 'Buscando...' : 'Generando...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {activeTab === 'diario' ? 'Buscar' : 'Generar Resumen'}
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Resultados Diario */}
        {activeTab === 'diario' && datosOrdenados.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Resultados
              </h2>
              <div className="flex items-center gap-4">
                {/* Toggle en tabla */}
                <div className="flex bg-white p-0.5 rounded-lg shadow-sm border border-gray-200">
                  <button
                    onClick={() => setMostrarGeneral(false)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all uppercase ${!mostrarGeneral
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    Espec.
                  </button>
                  <button
                    onClick={() => setMostrarGeneral(true)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all uppercase ${mostrarGeneral
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    Gral.
                  </button>
                </div>
                <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                  {datosOrdenados.length} denuncia{datosOrdenados.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('numero_denuncia')}>
                      <div className="flex items-center gap-2">Num. de Denuncia <SortIcon field="numero_denuncia" /></div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('hora_denuncia')}>
                      <div className="flex items-center gap-2">Hora <SortIcon field="hora_denuncia" /></div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">S.H.P.</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Denunciante</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Interviniente</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {datosOrdenados.map((row, index) => (
                    <tr key={index} className="hover:bg-blue-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.numero_denuncia}/{row.año}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.hora_denuncia || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${mostrarGeneral ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                          {mostrarGeneral ? (row.tipo_general || row.tipo_especifico || row.shp) : (row.tipo_especifico || row.shp || '-')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{row.denunciante || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{row.interviniente || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resultados Mensual */}
        {activeTab === 'mensual' && datosMensuales && (
          <div className="space-y-6">
            {/* Resumen por Tipos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Desglose por Tipos
                  </h3>
                  {/* Toggle en tabla */}
                  <div className="flex bg-white p-0.5 rounded-lg shadow-sm border border-gray-200">
                    <button
                      onClick={() => setMostrarGeneral(false)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all uppercase ${!mostrarGeneral
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      Específico
                    </button>
                    <button
                      onClick={() => setMostrarGeneral(true)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all uppercase ${mostrarGeneral
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      General
                    </button>
                  </div>
                </div>
                <div className="p-0">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(mostrarGeneral ? datosMensuales.resumen_general : datosMensuales.resumen_especifico).map((tipo: ResumenTipo, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-3 text-sm text-gray-700">{tipo.tipo}</td>
                          <td className="px-6 py-3 text-sm text-gray-900 text-right font-bold text-lg">{tipo.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
                  <h3 className="text-lg font-semibold text-gray-800">Denunciantes Recurrentes</h3>
                </div>
                <div className="p-6">
                  {datosMensuales.denunciantes_recurrentes.length > 0 ? (
                    <div className="space-y-4">
                      {datosMensuales.denunciantes_recurrentes.map((rec, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 border-l-4 border-l-red-500">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-gray-900">{rec.denunciante}</h4>
                              <p className="text-xs text-gray-500">C.I.: {rec.cedula}</p>
                            </div>
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg uppercase">
                              {rec.cantidad} denuncias
                            </span>
                          </div>
                          <div className="mt-3 space-y-2">
                            {rec.numeros_denuncia.map((num, i) => (
                              <div key={i} className="flex flex-col gap-1 text-sm text-gray-600 bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">{num}</span>
                                  <span className="text-gray-300">|</span>
                                  <span className="truncate font-medium">{rec.tipos[i]}</span>
                                </div>
                                {rec.oficiales && rec.oficiales[i] && (
                                  <div className="text-[10px] text-gray-500 pl-1">
                                    <span className="font-semibold text-gray-400 mr-1">Oficial:</span>
                                    {rec.oficiales[i]}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 italic">
                      No se detectaron denunciantes recurrentes en este período.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

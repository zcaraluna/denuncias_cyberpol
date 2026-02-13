'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { exportToExcel } from '@/lib/utils/export-excel'
import { exportToDocx } from '@/lib/utils/export-docx'
import { exportComponentToImage } from '@/lib/utils/export-image'

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
  monto_dano?: number
  moneda?: string
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
  fechas: string[]
  oficiales: string[]
}

interface DatosMensuales {
  resumen_especifico: ResumenTipo[]
  resumen_general: ResumenTipo[]
  evolucion_diaria: { fecha: string; dia: number; total: number }[]
  top_operadores: { operador: string; total: number }[]
  denunciantes_recurrentes: Recurrente[]
  resumen_danos: { moneda: string; total: number }[]
  denuncias_danos?: ReporteRow[]
}

type SortField = 'numero_denuncia' | 'hora_denuncia' | 'shp' | 'monto_dano' | 'moneda'
type SortDirection = 'asc' | 'desc'
type Tab = 'diario' | 'mensual' | 'danos'

export default function ReportesPage() {
  const router = useRouter()
  const { usuario, loading: authLoading, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('diario')
  const [mostrarGeneral, setMostrarGeneral] = useState(true)

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
      if (activeTab === 'danos') {
        setDatos(data.denuncias_danos || [])
      } else {
        setDatos([])
      }

      if (data.resumen_especifico.length === 0 && data.resumen_general.length === 0 && (!data.denuncias_danos || data.denuncias_danos.length === 0)) {
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
      } else if (sortField === 'shp') {
        comparison = (a.tipo_especifico || a.shp || '').localeCompare(b.tipo_especifico || b.shp || '')
      } else if (sortField === 'monto_dano') {
        comparison = (a.monto_dano || 0) - (b.monto_dano || 0)
      } else if (sortField === 'moneda') {
        comparison = (a.moneda || '').localeCompare(b.moneda || '')
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [datos, sortField, sortDirection])

  const handleLogout = () => {
    logout()
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

  const handleExportDailyExcel = () => {
    const columns = [
      { header: '#', key: 'numero_orden', width: 10 },
      { header: 'Denunciante', key: 'nombre_denunciante', width: 30 },
      { header: 'Cédula', key: 'cedula_denunciante', width: 15 },
      { header: 'Tipo', key: 'tipo_hecho', width: 30 },
      { header: 'Fecha', key: 'fecha_denuncia', width: 15 },
      { header: 'Hora', key: 'hora_denuncia', width: 10 },
      { header: 'Monto Daño', key: 'monto_dano', width: 15 },
      { header: 'Moneda', key: 'moneda', width: 15 }
    ];
    // @ts-ignore
    exportToExcel(datosFiltrados || [], 'Reporte_Diario', columns);
  };

  const handleExportDailyDocx = () => {
    const columns = [
      { header: 'Orden', key: 'numero_orden' },
      { header: 'Denunciante', key: 'nombre_denunciante' },
      { header: 'Cédula', key: 'cedula_denunciante' },
      { header: 'Hecho', key: 'tipo_hecho' },
      { header: 'Fecha', key: 'fecha_denuncia' },
      { header: 'Monto', key: 'monto_dano' },
      { header: 'Moneda', key: 'moneda' }
    ];
    // @ts-ignore
    exportToDocx(datosFiltrados || [], 'Reporte Diario de Denuncias', columns);
  };

  const handleExportDanosExcel = () => {
    const data = activeTab === 'diario'
      ? datosOrdenados.filter(d => (d.monto_dano || 0) > 0)
      : []; // Para mensual es más complejo ya que no tenemos la lista plana aquí directamente

    const columns = [
      { header: 'Denuncia', key: 'numero_denuncia', width: 15 },
      { header: 'Fecha', key: 'fecha_denuncia', width: 15 },
      { header: 'Denunciante', key: 'denunciante', width: 30 },
      { header: 'Hecho', key: 'shp', width: 30 },
      { header: 'Monto Daño', key: 'monto_dano', width: 15 },
      { header: 'Moneda', key: 'moneda', width: 15 }
    ];
    exportToExcel(data, 'Reporte_Danos_Patrimoniales', columns);
  };

  const handleExportMonthlyTypesExcel = () => {
    const columns = [
      { header: 'Tipo de Hecho', key: 'tipo', width: 40 },
      { header: 'Total', key: 'total', width: 15 }
    ];
    const data = mostrarGeneral ? datosMensuales?.resumen_general : datosMensuales?.resumen_especifico;
    exportToExcel(data || [], 'Resumen_por_Tipos', columns);
  };

  const handleExportMonthlyOperatorsExcel = () => {
    const columns = [
      { header: 'Personal Interviniente', key: 'operador', width: 40 },
      { header: 'Total Denuncias', key: 'total', width: 20 }
    ];
    exportToExcel(datosMensuales?.top_operadores || [], 'Ranking_Operadores', columns);
  };

  const handleExportMonthlyTypesDocx = () => {
    const columns = [
      { header: 'Tipo de Hecho', key: 'tipo' },
      { header: 'Total', key: 'total' }
    ];
    const data = mostrarGeneral ? datosMensuales?.resumen_general : datosMensuales?.resumen_especifico;
    exportToDocx(data || [], 'Resumen de Denuncias por Tipo', columns);
  };

  const handleExportMonthlyOperatorsDocx = () => {
    const columns = [
      { header: 'Personal Interviniente', key: 'operador' },
      { header: 'Total Denuncias', key: 'total' }
    ];
    exportToDocx(datosMensuales?.top_operadores || [], 'Ranking de Operadores del Mes', columns);
  };

  const handleExportChartImage = () => {
    exportComponentToImage('chart-evolution', 'Evolucion_Diaria_Denuncias');
  };

  const handleExportRecurrenteExcel = (rec: Recurrente) => {
    const data = rec.numeros_denuncia.map((num, i) => ({
      numero: num,
      tipo: rec.tipos[i] || 'SIN ESPECIFICAR',
      fecha: rec.fechas[i] || '-',
      oficial: rec.oficiales ? rec.oficiales[i] : '-'
    }));
    const columns = [
      { header: 'Nro. Denuncia', key: 'numero', width: 20 },
      { header: 'Tipo de Hecho', key: 'tipo', width: 40 },
      { header: 'Fecha y Hora', key: 'fecha', width: 25 },
      { header: 'Personal Interviniente', key: 'oficial', width: 40 }
    ];
    exportToExcel(data, `Recurrente_${rec.denunciante.split(' ')[0]}_${rec.cedula}`, columns);
  };

  const handleExportRecurrenteDocx = (rec: Recurrente) => {
    const data = rec.numeros_denuncia.map((num, i) => ({
      numero: num,
      tipo: rec.tipos[i] || 'SIN ESPECIFICAR',
      fecha: rec.fechas[i] || '-',
      oficial: rec.oficiales ? rec.oficiales[i] : '-'
    }));
    const columns = [
      { header: 'Nro. Denuncia', key: 'numero' },
      { header: 'Tipo de Hecho', key: 'tipo' },
      { header: 'Fecha y Hora', key: 'fecha' },
      { header: 'Interviniente', key: 'oficial' }
    ];
    exportToDocx(data, `Denuncias de ${rec.denunciante} (CI: ${rec.cedula})`, columns);
  };

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

  const formatearFecha = (fechaStr: string) => {
    // fechaStr viene como "YYYY-MM-DD HH:MM:SS" (o similar)
    try {
      if (!fechaStr) return ''
      const parts = fechaStr.split(' ')
      const datePart = parts[0]
      const timePart = parts[1] ? parts[1].substring(0, 5) : '' // Tomar solo HH:MM

      const [year, month, day] = datePart.split('-').map(Number)

      const date = new Date(year, month - 1, day)
      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

      return `${dias[date.getDay()]}. ${day.toString().padStart(2, '0')} - ${timePart}`
    } catch (e) {
      return fechaStr
    }
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
            <button
              onClick={() => setActiveTab('danos')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'danos'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              Daños Patrimoniales
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
              Filtros de {activeTab === 'diario' ? 'Búsqueda' : activeTab === 'mensual' ? 'Resumen' : 'Daños'}
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
                  {activeTab === 'diario' || activeTab === 'danos' ? 'Buscar' : 'Generar Resumen'}
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
                <div className="flex gap-2 mr-2 border-r border-gray-200 pr-4">
                  <button
                    onClick={handleExportDailyExcel}
                    title="Exportar a Excel"
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleExportDailyDocx}
                    title="Exportar a Word"
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>
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
            {/* Resumen por Tipos y Ranking de Operadores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Desglose por Tipos
                    </h3>
                    <button
                      onClick={handleExportMonthlyTypesExcel}
                      title="Exportar a Excel"
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={handleExportMonthlyTypesDocx}
                      title="Exportar a Word"
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                  </div>
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
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(mostrarGeneral ? datosMensuales.resumen_general : datosMensuales.resumen_especifico).map((tipo: ResumenTipo, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50 transition border-l-4 border-l-transparent hover:border-l-blue-500">
                          <td className="px-6 py-3 text-sm text-gray-700">{tipo.tipo}</td>
                          <td className="px-6 py-3 text-sm text-gray-900 text-right font-bold">{tipo.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top 5 Intervinientes */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Top 5 Intervinientes
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={handleExportMonthlyOperatorsExcel}
                      title="Exportar a Excel"
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={handleExportMonthlyOperatorsDocx}
                      title="Exportar a Word"
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-0">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Personal</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Denuncias</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {datosMensuales.top_operadores?.map((op, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition border-l-4 border-l-transparent hover:border-l-green-500">
                          <td className="px-6 py-3 text-sm text-gray-700 flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-700 font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            {op.operador || 'Desconocido'}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-900 text-right font-bold">{op.total}</td>
                        </tr>
                      ))}
                      {(!datosMensuales.top_operadores || datosMensuales.top_operadores.length === 0) && (
                        <tr>
                          <td colSpan={2} className="px-6 py-8 text-center text-gray-500 italic text-sm">
                            Sin datos registrados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Denunciantes Recurrentes */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 17c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Denunciantes Recurrentes
                </h3>
              </div>
              <div className="p-6">
                {datosMensuales.denunciantes_recurrentes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {datosMensuales.denunciantes_recurrentes.map((rec, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-gray-900">{rec.denunciante}</h4>
                            <p className="text-[10px] text-gray-500 font-mono tracking-wider">CI: {rec.cedula}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase">
                              {rec.cantidad} denuncias
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleExportRecurrenteExcel(rec)}
                                title="Exportar a Excel"
                                className="p-1 rounded bg-green-50 text-green-600 hover:bg-green-100 transition shadow-sm"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleExportRecurrenteDocx(rec)}
                                title="Exportar a Word"
                                className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition shadow-sm"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 space-y-2">
                          {rec.numeros_denuncia.map((num, i) => (
                            <div key={i} className="flex flex-col gap-1 text-xs text-gray-600 bg-white p-2 rounded border border-gray-100">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-blue-600 text-[10px]">{num}</span>
                                <span className="text-gray-200">|</span>
                                <span className="truncate flex-1 font-medium">{rec.tipos[i]}</span>
                              </div>
                              <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-50">
                                <span className="text-[9px] text-gray-400">{formatearFecha(rec.fechas[i])}</span>
                                {rec.oficiales && rec.oficiales[i] && (
                                  <span className="text-[9px] text-gray-400 italic">Por: {rec.oficiales[i]}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 italic text-sm bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    No se detectaron denuncias recurrentes en este periodo.
                  </div>
                )}
              </div>
            </div>

            {/* Evolución Diaria (Al final) */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  Evolución Diaria de Denuncias
                </h3>
                <button
                  onClick={handleExportChartImage}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition flex items-center gap-2 text-xs font-bold uppercase"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Exportar Imagen
                </button>
              </div>
              <div className="p-6" id="chart-evolution">
                <div className="h-[250px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={datosMensuales.evolucion_diaria}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis
                        dataKey="dia"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#9ca3af' }}
                      />
                      <YAxis
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#9ca3af' }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 border border-blue-100 shadow-xl rounded-lg">
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Día {payload[0].payload.dia}</p>
                                <p className="text-sm font-black text-blue-600">{payload[0].value} <span className="text-[10px] font-normal text-gray-600">denuncia(s)</span></p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="total"
                        radius={[2, 2, 0, 0]}
                      >
                        {datosMensuales.evolucion_diaria.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.total > 0 ? '#3b82f6' : '#f1f5f9'}
                            className="transition-colors duration-200"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resultados Daños */}
        {activeTab === 'danos' && (
          <div className="space-y-6">
            {/* Resumen de Daños (Tarjetas) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const stats: Record<string, number> = {}
                datosOrdenados.forEach(d => {
                  if (d.monto_dano && d.moneda) {
                    stats[d.moneda] = (stats[d.moneda] || 0) + (typeof d.monto_dano === 'string' ? parseInt(d.monto_dano, 10) : d.monto_dano)
                  }
                })
                const entries = Object.entries(stats)
                if (entries.length === 0) {
                  return (
                    <div className="md:col-span-3 bg-blue-50 border border-blue-100 rounded-xl p-6 text-center text-blue-800 italic">
                      No hay datos de perjuicio patrimonial para el periodo seleccionado.
                    </div>
                  )
                }
                return entries.map(([moneda, total], idx) => (
                  <div key={idx} className="bg-white p-6 rounded-xl shadow-md border border-gray-200 border-l-4 border-l-blue-600 transition hover:shadow-lg">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total {moneda}</p>
                    <p className="text-2xl font-black text-blue-600">
                      {total.toLocaleString('es-PY')}
                      <span className="text-xs ml-1 font-normal text-gray-400">{moneda.split(' ')[0]}</span>
                    </p>
                  </div>
                ))
              })()}
            </div>

            {/* Tabla Detallada de Daños */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m.599-1c.51-.598 1.11-1 2.401-1m-4 4c-1.303 0-2.403-.402-2.599-1M12 16v-1m0 1v1m0-1c-1.303 0-2.402-.402-2.599-1" />
                  </svg>
                  Detalle de Denuncias con Perjuicio
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportDanosExcel}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm flex items-center gap-2 text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('numero_denuncia')}>
                        <div className="flex items-center gap-2">Denuncia <SortIcon field="numero_denuncia" /></div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Denunciante</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('shp')}>
                        <div className="flex items-center gap-2">Hecho Punible <SortIcon field="shp" /></div>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('monto_dano')}>
                        <div className="flex items-center gap-2 justify-end">Monto Daño <SortIcon field="monto_dano" /></div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('moneda')}>
                        <div className="flex items-center gap-2">Moneda <SortIcon field="moneda" /></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {datosOrdenados.filter(d => (d.monto_dano || 0) > 0).map((row, index) => (
                      <tr key={index} className="hover:bg-blue-50 transition border-l-4 border-l-transparent hover:border-l-blue-600">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{row.numero_denuncia}/{row.año}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{row.denunciante}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-600 uppercase">
                            {row.shp}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-black">
                          {row.monto_dano?.toLocaleString('es-PY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 italic">
                          {row.moneda}
                        </td>
                      </tr>
                    ))}
                    {datosOrdenados.filter(d => (d.monto_dano || 0) > 0).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic bg-gray-50">
                          No se encontraron denuncias con montos de daño registrados para este criterio de búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* Sección de Administración - Solo para garv */}
        {usuario?.usuario === 'garv' && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Administración del Sistema
            </h2>
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold">Respaldo Integral</h3>
                  <p className="text-blue-100 text-xs">Copia de seguridad completa de la base de datos</p>
                </div>
              </div>
              <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Esta herramienta genera un archivo <code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono text-xs">.sql</code> que contiene toda la estructura y datos actuales. Es recomendable realizar esta acción antes de cualquier migración o actualización importante.
                  </p>
                </div>
                <div className="shrink-0">
                  <a
                    href="/api/admin/backup"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 group"
                  >
                    <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar Backup
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

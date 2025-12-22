'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface Usuario {
  id: number
  nombre: string
  apellido: string
  grado: string
  oficina: string
  rol: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658']

export default function ReportesPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [cargandoDatos, setCargandoDatos] = useState(true)

  // Filtros
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [oficina, setOficina] = useState('')
  const [tipoDenuncia, setTipoDenuncia] = useState('')
  const [usuarioId, setUsuarioId] = useState('')

  // Opciones de filtros
  const [opcionesFiltros, setOpcionesFiltros] = useState({
    oficinas: [] as string[],
    tipos: [] as string[],
    operadores: [] as any[]
  })

  // Datos de reportes
  const [estadisticasGenerales, setEstadisticasGenerales] = useState<any>(null)
  const [porOperadores, setPorOperadores] = useState<any>(null)
  const [porTipo, setPorTipo] = useState<any>(null)
  const [geograficos, setGeograficos] = useState<any>(null)
  const [temporales, setTemporales] = useState<any>(null)
  const [denunciantes, setDenunciantes] = useState<any>(null)

  // Tabs activos
  const [tabActivo, setTabActivo] = useState('general')

  const { usuario, loading: authLoading } = useAuth()

  useEffect(() => {
    if (usuario) {
      // Solo superadmin y admin pueden acceder
      if (usuario.rol !== 'superadmin' && usuario.rol !== 'admin') {
        router.push('/dashboard')
        return
      }
      cargarOpcionesFiltros()
    }
    setLoading(false)
  }, [usuario, router])

  useEffect(() => {
    if (usuario) {
      cargarTodosLosDatos()
    }
  }, [usuario, fechaInicio, fechaFin, oficina, tipoDenuncia, usuarioId])

  const cargarOpcionesFiltros = async () => {
    try {
      const response = await fetch('/api/reportes/filtros')
      if (!response.ok) throw new Error('Error al cargar opciones')
      const data = await response.json()
      setOpcionesFiltros(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const cargarTodosLosDatos = async () => {
    setCargandoDatos(true)
    const params = new URLSearchParams()
    if (fechaInicio) params.append('fechaInicio', fechaInicio)
    if (fechaFin) params.append('fechaFin', fechaFin)
    if (oficina) params.append('oficina', oficina)
    if (tipoDenuncia) params.append('tipoDenuncia', tipoDenuncia)
    if (usuarioId) params.append('usuarioId', usuarioId)

    try {
      const [gen, oper, tipo, geo, temp, den] = await Promise.all([
        fetch(`/api/reportes/estadisticas-generales?${params}`).then(r => r.json()),
        fetch(`/api/reportes/por-operadores?${params}`).then(r => r.json()),
        fetch(`/api/reportes/por-tipo?${params}`).then(r => r.json()),
        fetch(`/api/reportes/geograficos?${params}`).then(r => r.json()),
        fetch(`/api/reportes/temporales?${params}`).then(r => r.json()),
        fetch(`/api/reportes/denunciantes?${params}`).then(r => r.json())
      ])

      setEstadisticasGenerales(gen)
      setPorOperadores(oper)
      setPorTipo(tipo)
      setGeograficos(geo)
      setTemporales(temp)
      setDenunciantes(den)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setCargandoDatos(false)
    }
  }

  const handleExportar = async (formato: 'excel' | 'csv') => {
    const params = new URLSearchParams()
    if (fechaInicio) params.append('fechaInicio', fechaInicio)
    if (fechaFin) params.append('fechaFin', fechaFin)
    if (oficina) params.append('oficina', oficina)
    if (tipoDenuncia) params.append('tipoDenuncia', tipoDenuncia)
    if (usuarioId) params.append('usuarioId', usuarioId)
    params.append('tipo', formato)

    const url = `/api/reportes/exportar?${params}`
    window.open(url, '_blank')
  }

  const limpiarFiltros = () => {
    setFechaInicio('')
    setFechaFin('')
    setOficina('')
    setTipoDenuncia('')
    setUsuarioId('')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('usuario')
    router.push('/')
  }

  if (loading || !usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← Volver al Inicio
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Reportes y Estadísticas</h1>
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
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Oficina</label>
              <select
                value={oficina}
                onChange={(e) => setOficina(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {opcionesFiltros.oficinas.map(of => (
                  <option key={of} value={of}>{of}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Denuncia</label>
              <select
                value={tipoDenuncia}
                onChange={(e) => setTipoDenuncia(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {opcionesFiltros.tipos.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operador</label>
              <select
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {opcionesFiltros.operadores.map(op => (
                  <option key={op.id} value={op.id}>{op.nombre_completo}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
            >
              Limpiar Filtros
            </button>
            <button
              onClick={() => handleExportar('excel')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              Exportar Excel
            </button>
            <button
              onClick={() => handleExportar('csv')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'general', label: 'General' },
              { id: 'operadores', label: 'Por Operadores' },
              { id: 'tipo', label: 'Por Tipo' },
              { id: 'temporal', label: 'Temporal' },
              { id: 'geografico', label: 'Geográfico' },
              { id: 'denunciantes', label: 'Denunciantes' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTabActivo(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  tabActivo === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {cargandoDatos ? (
          <div className="text-center py-12">
            <div className="text-xl">Cargando datos...</div>
          </div>
        ) : (
          <>
            {/* Tab: General */}
            {tabActivo === 'general' && estadisticasGenerales && (
              <div className="space-y-6">
                {/* Tarjetas de métricas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Total Denuncias</h3>
                    <p className="text-3xl font-bold text-gray-900">{estadisticasGenerales.total}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Monto Total</h3>
                    <p className="text-3xl font-bold text-gray-900">
                      {new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(estadisticasGenerales.montoTotal)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Con Monto</h3>
                    <p className="text-3xl font-bold text-gray-900">{estadisticasGenerales.denunciasConMonto}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Oficinas</h3>
                    <p className="text-3xl font-bold text-gray-900">{estadisticasGenerales.porOficina?.length || 0}</p>
                  </div>
                </div>

                {/* Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Denuncias por Oficina */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Denuncias por Oficina</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={estadisticasGenerales.porOficina}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="oficina" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill="#0088FE" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Denuncias por Tipo */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Tipos de Denuncia</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={estadisticasGenerales.porTipo?.slice(0, 10)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ tipo, porcentaje }: any) => `${tipo}: ${porcentaje ? Number(porcentaje).toFixed(1) : 0}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="cantidad"
                        >
                          {estadisticasGenerales.porTipo?.slice(0, 10).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Denuncias por Día de Semana */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Denuncias por Día de Semana</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={estadisticasGenerales.porDiaSemana}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nombre_dia" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill="#00C49F" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Denuncias por Hora */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Denuncias por Hora del Día</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={estadisticasGenerales.porHora}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hora" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="cantidad" stroke="#FF8042" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabla de denuncias por período */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Denuncias por Período (Últimos 30 días)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {estadisticasGenerales.porPeriodo?.slice(0, 30).map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(item.fecha).toLocaleDateString('es-ES')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cantidad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Por Operadores */}
            {tabActivo === 'operadores' && porOperadores && (
              <div className="space-y-6">
                {porOperadores.promedio && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Total Operadores</h3>
                      <p className="text-3xl font-bold text-gray-900">{porOperadores.promedio.total_operadores}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Total Denuncias</h3>
                      <p className="text-3xl font-bold text-gray-900">{porOperadores.promedio.total_denuncias}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Promedio por Operador</h3>
                      <p className="text-3xl font-bold text-gray-900">{parseFloat(porOperadores.promedio.promedio || 0).toFixed(2)}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Operadores */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Operadores</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={porOperadores.topOperadores?.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nombre_completo" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="total_denuncias" fill="#0088FE" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Comparativa Oficinas */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Comparativa por Oficina</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={porOperadores.comparativaOficinas}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="oficina" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="operadores" fill="#00C49F" name="Operadores" />
                        <Bar dataKey="total_denuncias" fill="#0088FE" name="Denuncias" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabla Top Operadores */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Ranking de Operadores</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operador</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grado</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oficina</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Denuncias</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {porOperadores.topOperadores?.map((op: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{idx + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{op.nombre_completo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{op.grado}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{op.oficina}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{op.total_denuncias}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Por Tipo */}
            {tabActivo === 'tipo' && porTipo && (
              <div className="space-y-6">
                {(!porTipo.distribucion || porTipo.distribucion.length === 0) ? (
                  <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <p className="text-gray-600">No hay datos de distribución por tipo para mostrar</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Distribución porcentual */}
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución por Tipo</h3>
                        {porTipo.distribucion && porTipo.distribucion.length > 0 ? (
                          <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                              <Pie
                                data={porTipo.distribucion.slice(0, 10)}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ tipo, porcentaje }: any) => `${tipo}: ${porcentaje ? Number(porcentaje).toFixed(1) : 0}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="cantidad"
                              >
                                {porTipo.distribucion.slice(0, 10).map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-gray-600 text-center py-8">No hay datos para mostrar</p>
                        )}
                      </div>

                      {/* Top Tipos */}
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Tipos de Denuncia</h3>
                        {porTipo.topTipos && porTipo.topTipos.length > 0 ? (
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={porTipo.topTipos}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="tipo" angle={-45} textAnchor="end" height={100} />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="cantidad" fill="#0088FE" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-gray-600 text-center py-8">No hay datos para mostrar</p>
                        )}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución Completa</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Porcentaje</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {porTipo.distribucion && porTipo.distribucion.length > 0 ? (
                              porTipo.distribucion.map((item: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.tipo}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cantidad}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.porcentaje ? Number(item.porcentaje).toFixed(2) : '0.00'}%</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No hay datos para mostrar</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Tab: Temporal */}
            {tabActivo === 'temporal' && temporales && (
              <div className="space-y-6">
                {temporales.diaActualVsPromedio && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Denuncias Hoy</h3>
                      <p className="text-3xl font-bold text-gray-900">{temporales.diaActualVsPromedio.hoy || 0}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Promedio Diario</h3>
                      <p className="text-3xl font-bold text-gray-900">{parseFloat(temporales.diaActualVsPromedio.promedio || 0).toFixed(1)}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Días Analizados</h3>
                      <p className="text-3xl font-bold text-gray-900">{temporales.diaActualVsPromedio.total_dias || 0}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Mes a Mes */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Comparativa Mes a Mes</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={temporales.mesAMes}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="cantidad" stroke="#0088FE" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Año a Año */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Comparativa Año a Año</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={temporales.añoAAño}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="año" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill="#00C49F" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tendencias */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Tendencias Mensuales</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diferencia</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tendencia</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {temporales.tendencias?.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(item.mes).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cantidad}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.diferencia > 0 ? '+' : ''}{item.diferencia || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                item.tendencia === 'crecimiento' ? 'bg-green-100 text-green-800' :
                                item.tendencia === 'descenso' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.tendencia || 'N/A'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Geográfico */}
            {tabActivo === 'geografico' && geograficos && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Lugares del Hecho</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lugar</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {geograficos.porLugar?.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 text-sm text-gray-900">{item.lugar_hecho}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cantidad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Zonas con Mayor Concentración</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Latitud</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Longitud</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {geograficos.zonasConcentracion?.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.lat_redondeada}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.lon_redondeada}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cantidad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Denunciantes */}
            {tabActivo === 'denunciantes' && denunciantes && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Por Edad */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución por Edad</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={denunciantes.porEdad}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="grupo_edad" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill="#0088FE" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Por Estado Civil */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución por Estado Civil</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={denunciantes.porEstadoCivil}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ estado_civil, cantidad }) => `${estado_civil}: ${cantidad}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="cantidad"
                        >
                          {denunciantes.porEstadoCivil?.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Denunciantes Recurrentes */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Denunciantes Recurrentes</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cédula</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Denuncias</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Primera</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {denunciantes.recurrentes?.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cedula}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nombres}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.total_denuncias}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(item.primera_denuncia).toLocaleDateString('es-ES')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(item.ultima_denuncia).toLocaleDateString('es-ES')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}


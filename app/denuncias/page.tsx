'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Select from 'react-select'
import DateRangePicker from '@/components/DateRangePicker'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatearFechaSinTimezone } from '@/lib/utils/fecha'
import { MainLayout } from '@/components/MainLayout'
import {
  Search,
  FileText,
  Filter,
  Calendar,
  Clock,
  Hash,
  User,
  ChevronRight,
  Eye,
  Trash2,
  AlertCircle,
  FileSearch,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'

interface Denuncia {
  id: number
  nombre_denunciante: string
  cedula_denunciante: string
  fecha_denuncia: string
  hora_denuncia: string
  numero_orden: number
  tipo_hecho: string
  hash_denuncia: string
  estado: string
}

export default function DenunciasPage() {
  const router = useRouter()
  const { usuario, loading: authLoading, logout } = useAuth()
  const [denuncias, setDenuncias] = useState<Denuncia[]>([])
  const [loading, setLoading] = useState(true)
  const [hashBusqueda, setHashBusqueda] = useState('')
  const [cedulaBusqueda, setCedulaBusqueda] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [denunciasPorCedula, setDenunciasPorCedula] = useState<Denuncia[]>([])
  const [mostrarResultadosCedula, setMostrarResultadosCedula] = useState(false)

  // Estados temporales para filtros
  const [filtroNombreTemp, setFiltroNombreTemp] = useState('')
  const [filtroCedulaTemp, setFiltroCedulaTemp] = useState('')
  const [filtroTipoTemp, setFiltroTipoTemp] = useState('')
  const [filtroFechaDesdeTemp, setFiltroFechaDesdeTemp] = useState('')
  const [filtroFechaHastaTemp, setFiltroFechaHastaTemp] = useState('')

  // Estados aplicados para filtros
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroCedula, setFiltroCedula] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')

  const [paginaActual, setPaginaActual] = useState(1)
  const itemsPorPagina = 10

  const cargarDenuncias = async () => {
    if (!usuario) return

    try {
      const response = await fetch('/api/denuncias/todas')
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
      if (usuario.rol === 'admin' || usuario.rol === 'superadmin') {
        cargarDenuncias()
      } else {
        setLoading(false)
      }
    }
  }, [usuario])

  useEffect(() => {
    setFiltroNombreTemp(filtroNombre)
    setFiltroCedulaTemp(filtroCedula)
    setFiltroTipoTemp(filtroTipo)
    setFiltroFechaDesdeTemp(filtroFechaDesde)
    setFiltroFechaHastaTemp(filtroFechaHasta)
  }, [])

  const buscarPorHash = async () => {
    if (!hashBusqueda.trim()) {
      setError('Por favor ingrese un hash')
      return
    }

    setBuscando(true)
    setError(null)
    setMostrarResultadosCedula(false)

    try {
      const response = await fetch(`/api/denuncias/buscar/${hashBusqueda.trim()}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Denuncia no encontrada')

      const data = await response.json()
      router.push(`/ver-denuncia/${data.id}`)
    } catch (error) {
      setError('Denuncia no encontrada con ese hash')
      setBuscando(false)
    }
  }

  const buscarPorCedula = async () => {
    if (!cedulaBusqueda.trim()) {
      setError('Por favor ingrese una cédula')
      return
    }

    setBuscando(true)
    setError(null)
    setMostrarResultadosCedula(false)

    try {
      const response = await fetch(`/api/denuncias/buscar-cedula/${cedulaBusqueda.trim()}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('No se encontraron denuncias')

      const data = await response.json()
      setDenunciasPorCedula(data)
      setMostrarResultadosCedula(true)
      setBuscando(false)
    } catch (error) {
      setError('No se encontraron denuncias con esa cédula')
      setBuscando(false)
    }
  }

  const verDenuncia = (id: number) => {
    router.push(`/ver-denuncia/${id}`)
  }

  const tiposDisponibles = useMemo(() => {
    const tipos = new Set(denuncias.map(d => d.tipo_hecho?.toUpperCase() || '').filter(Boolean))
    return Array.from(tipos).sort()
  }, [denuncias])

  const opcionesTipos = useMemo(() => {
    return [
      { value: '', label: 'TODOS LOS TIPOS' },
      ...tiposDisponibles.map(tipo => ({ value: tipo, label: tipo }))
    ]
  }, [tiposDisponibles])

  const denunciasFiltradas = useMemo(() => {
    return denuncias.filter(denuncia => {
      const nombreMatch = !filtroNombre ||
        denuncia.nombre_denunciante.toLowerCase().includes(filtroNombre.toLowerCase())
      const cedulaMatch = !filtroCedula ||
        denuncia.cedula_denunciante.includes(filtroCedula)
      const tipoMatch = !filtroTipo ||
        denuncia.tipo_hecho?.toUpperCase() === filtroTipo

      let fechaMatch = true
      if (filtroFechaDesde || filtroFechaHasta) {
        const fechaDenuncia = new Date(denuncia.fecha_denuncia)
        if (filtroFechaDesde) {
          const fechaDesde = new Date(filtroFechaDesde)
          fechaDesde.setHours(0, 0, 0, 0)
          if (fechaDenuncia < fechaDesde) fechaMatch = false
        }
        if (filtroFechaHasta) {
          const fechaHasta = new Date(filtroFechaHasta)
          fechaHasta.setHours(23, 59, 59, 999)
          if (fechaDenuncia > fechaHasta) fechaMatch = false
        }
      }

      return nombreMatch && cedulaMatch && tipoMatch && fechaMatch
    })
  }, [denuncias, filtroNombre, filtroCedula, filtroTipo, filtroFechaDesde, filtroFechaHasta])

  const totalPaginas = Math.ceil(denunciasFiltradas.length / itemsPorPagina)
  const indiceInicio = (paginaActual - 1) * itemsPorPagina
  const indiceFin = indiceInicio + itemsPorPagina
  const denunciasPaginaActual = denunciasFiltradas.slice(indiceInicio, indiceFin)

  useEffect(() => {
    setPaginaActual(1)
  }, [filtroNombre, filtroCedula, filtroTipo, filtroFechaDesde, filtroFechaHasta])

  const aplicarFiltros = () => {
    setFiltroNombre(filtroNombreTemp)
    setFiltroCedula(filtroCedulaTemp)
    setFiltroTipo(filtroTipoTemp)
    setFiltroFechaDesde(filtroFechaDesdeTemp)
    setFiltroFechaHasta(filtroFechaHastaTemp)
    setPaginaActual(1)
  }

  const limpiarFiltros = () => {
    setFiltroNombreTemp('')
    setFiltroCedulaTemp('')
    setFiltroTipoTemp('')
    setFiltroFechaDesdeTemp('')
    setFiltroFechaHastaTemp('')
    setFiltroNombre('')
    setFiltroCedula('')
    setFiltroTipo('')
    setFiltroFechaDesde('')
    setFiltroFechaHasta('')
    setPaginaActual(1)
  }

  const handleFechaApply = () => { }
  const handleFechaCancel = () => {
    setFiltroFechaDesdeTemp(filtroFechaDesde)
    setFiltroFechaHastaTemp(filtroFechaHasta)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-3 border-[#002147]/10 border-t-[#002147] rounded-full animate-spin mb-4" />
          <div className="text-[#002147] font-bold animate-pulse text-sm uppercase tracking-widest">Cargando sistema...</div>
        </div>
      </div>
    )
  }

  if (!usuario) return null

  const isAdmin = usuario.rol === 'admin' || usuario.rol === 'superadmin'

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-8 font-sans">
        <div className="max-w-7xl mx-auto">
          {isAdmin ? (
            /* ==========================================================================
               VISTA ADMINISTRADOR / SUPERADMIN
               ========================================================================== */
            <>
              {/* Header Section */}
              <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#002147] rounded-lg shadow-lg shadow-blue-900/10">
                      <FileSearch className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-[#002147] uppercase tracking-tight">Administración de Denuncias</h1>
                  </div>
                  <p className="text-slate-500 font-medium text-sm">Gestiona, filtra y supervisa todas las actas registradas en el sistema.</p>
                </div>

                <Link
                  href="/denuncias/buscador-relato"
                  className="inline-flex items-center gap-3 px-6 py-3 bg-white border-2 border-[#002147] text-[#002147] font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#002147] hover:text-white transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-blue-900/10 group"
                >
                  <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Buscador por Relato
                </Link>
              </div>

              {/* Filters Card */}
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 mb-8">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-50">
                  <Filter className="w-4 h-4 text-[#002147]" />
                  <h2 className="text-xs font-black text-[#002147] uppercase tracking-widest">Filtros de Búsqueda</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Filtro Nombre */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <User className="w-3 h-3" /> Denunciante
                    </label>
                    <input
                      type="text"
                      value={filtroNombreTemp}
                      onChange={(e) => setFiltroNombreTemp(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && aplicarFiltros()}
                      placeholder="Nombre completo..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-[#002147]/10 focus:border-[#002147] text-sm font-medium transition-all outline-none"
                    />
                  </div>

                  {/* Filtro Cédula */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Hash className="w-3 h-3" /> Cédula de Identidad
                    </label>
                    <input
                      type="text"
                      value={filtroCedulaTemp}
                      onChange={(e) => setFiltroCedulaTemp(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && aplicarFiltros()}
                      placeholder="Número de documento..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-[#002147]/10 focus:border-[#002147] text-sm font-medium transition-all outline-none"
                    />
                  </div>

                  {/* Filtro Tipo (react-select) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" /> Hecho Punible
                    </label>
                    <Select
                      options={opcionesTipos}
                      value={opcionesTipos.find(opcion => opcion.value === filtroTipoTemp)}
                      onChange={(option) => setFiltroTipoTemp(option?.value || '')}
                      isSearchable
                      placeholder="Seleccionar tipo..."
                      className="text-sm font-medium"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          background: '#f8fafc',
                          borderRadius: '0.75rem',
                          padding: '2px 4px',
                          borderColor: state.isFocused ? '#002147' : '#e2e8f0',
                          boxShadow: state.isFocused ? '0 0 0 4px rgba(0, 33, 71, 0.1)' : 'none',
                          '&:hover': { borderColor: '#002147' }
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: '0.75rem',
                          overflow: 'hidden',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                          border: '1px solid #f1f5f9',
                          zIndex: 50
                        }),
                        option: (base, state) => ({
                          ...base,
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '10px 15px',
                          textTransform: 'uppercase',
                          backgroundColor: state.isSelected ? '#002147' : state.isFocused ? '#f1f5f9' : 'white',
                          color: state.isSelected ? 'white' : '#002147',
                          '&:active': { backgroundColor: '#002147', color: 'white' }
                        })
                      }}
                    />
                  </div>

                  {/* Filtro Fecha */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Rango de Fechas
                    </label>
                    <DateRangePicker
                      startDate={filtroFechaDesdeTemp}
                      endDate={filtroFechaHastaTemp}
                      onStartDateChange={setFiltroFechaDesdeTemp}
                      onEndDateChange={setFiltroFechaHastaTemp}
                      onApply={handleFechaApply}
                      onCancel={handleFechaCancel}
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-50">
                  <button
                    onClick={limpiarFiltros}
                    className="px-5 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-sans"
                  >
                    Limpiar Todo
                  </button>
                  <button
                    onClick={aplicarFiltros}
                    className="px-8 py-2.5 text-[10px] font-black text-white bg-[#002147] uppercase tracking-widest rounded-xl hover:bg-[#003366] shadow-lg shadow-blue-900/20 transition-all font-sans"
                  >
                    Aplicar Filtros
                  </button>
                </div>
              </div>

              {/* Table Section */}
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">Nº Acta</th>
                        <th className="px-6 py-4 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">Denunciante / C.I.</th>
                        <th className="px-6 py-4 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">Supuesto Hecho</th>
                        <th className="px-6 py-4 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">Fecha y Hora</th>
                        <th className="px-6 py-4 text-right text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {denunciasFiltradas.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Search className="w-8 h-8 text-slate-200" />
                              </div>
                              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No se encontraron registros</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        denunciasPaginaActual.map((denuncia) => (
                          <tr key={denuncia.id} className="group hover:bg-blue-50/30 transition-all duration-200">
                            <td className="px-6 py-5 whitespace-nowrap">
                              <span className="text-sm font-black text-[#002147]">#{denuncia.numero_orden}</span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-[#002147] uppercase leading-tight mb-0.5">{denuncia.nombre_denunciante}</span>
                                <span className="text-[10px] font-medium text-slate-400">{denuncia.cedula_denunciante}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{denuncia.tipo_hecho}</span>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex items-center gap-3 text-slate-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span className="text-[10px] font-bold">{formatearFechaSinTimezone(denuncia.fecha_denuncia)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span className="text-[10px] font-bold">{denuncia.hora_denuncia}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right">
                              <button
                                onClick={() => verDenuncia(denuncia.id)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-[#002147] uppercase tracking-wider shadow-sm hover:bg-[#002147] hover:text-white hover:border-[#002147] transition-all duration-200 group-hover:shadow-md"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Detalles
                                <ChevronRight className="w-3 h-3 ml-1 opacity-50" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPaginas > 1 && (
                  <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Mostrando <span className="text-[#002147]">{indiceInicio + 1}</span> a <span className="text-[#002147]">{Math.min(indiceFin, denunciasFiltradas.length)}</span> de <span className="text-[#002147]">{denunciasFiltradas.length}</span> actas
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                        disabled={paginaActual === 1}
                        className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white hover:border-[#002147] hover:text-[#002147] text-slate-400 bg-white transition-all shadow-sm"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-[10px] font-black text-[#002147] uppercase tracking-widest">
                        Página {paginaActual} / {totalPaginas}
                      </div>
                      <button
                        onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                        disabled={paginaActual === totalPaginas}
                        className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white hover:border-[#002147] hover:text-[#002147] text-slate-400 bg-white transition-all shadow-sm"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ==========================================================================
               VISTA OPERADOR
               ========================================================================== */
            <div className="max-w-4xl mx-auto">
              <div className="mb-10 text-center">
                <div className="inline-flex p-3 bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 mb-4 animate-bounce-slow">
                  <FileSearch className="w-8 h-8 text-[#002147]" />
                </div>
                <h1 className="text-3xl font-black text-[#002147] uppercase tracking-tight mb-2">Buscador de Denuncias</h1>
                <p className="text-slate-500 font-medium max-w-md mx-auto">Ingrese los datos correspondientes para localizar un acta policial en el registro oficial.</p>
              </div>

              {/* Opción Buscador Especial */}
              <div className="mb-8 flex justify-center">
                <Link
                  href="/denuncias/buscador-relato"
                  className="inline-flex items-center gap-3 px-8 py-3 bg-[#002147] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#003366] transition-all duration-300 shadow-xl shadow-blue-900/20 group"
                >
                  <Search className="w-4 h-4" />
                  Buscador Avanzado por Relato
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                {/* Search by Hash Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 flex flex-col h-full transform transition-all duration-300 hover:scale-[1.02]">
                  <div className="p-3 bg-blue-50 w-fit rounded-2xl mb-6">
                    <Hash className="w-6 h-6 text-[#002147]" />
                  </div>
                  <h2 className="text-lg font-black text-[#002147] uppercase tracking-tight mb-2">Código de Acta</h2>
                  <p className="text-slate-400 text-xs font-medium mb-6">Busque una denuncia específica utilizando el hash de seguridad (9 dígitos).</p>
                  <div className="mt-auto space-y-3">
                    <input
                      type="text"
                      value={hashBusqueda}
                      onChange={(e) => setHashBusqueda(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && buscarPorHash()}
                      placeholder="Ej: ABC123A25"
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#002147] focus:bg-white text-sm font-black uppercase tracking-widest transition-all outline-none"
                      autoComplete="off"
                    />
                    <button
                      onClick={buscarPorHash}
                      disabled={buscando || !hashBusqueda.trim()}
                      className="w-full py-4 bg-[#002147] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-900/10 hover:shadow-2xl hover:shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                    >
                      {buscando ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Validar Código <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Search by Cedula Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 flex flex-col h-full transform transition-all duration-300 hover:scale-[1.02]">
                  <div className="p-3 bg-green-50 w-fit rounded-2xl mb-6">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-lg font-black text-[#002147] uppercase tracking-tight mb-2">Cédula Identidad</h2>
                  <p className="text-slate-400 text-xs font-medium mb-6">Localice todas las denuncias asociadas a un número de documento nacional.</p>
                  <div className="mt-auto space-y-3">
                    <input
                      type="text"
                      value={cedulaBusqueda}
                      onChange={(e) => setCedulaBusqueda(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && buscarPorCedula()}
                      placeholder="Número de C.I."
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-green-600 focus:bg-white text-sm font-black tracking-widest transition-all outline-none"
                      autoComplete="off"
                    />
                    <button
                      onClick={buscarPorCedula}
                      disabled={buscando || !cedulaBusqueda.trim()}
                      className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-green-900/10 hover:shadow-2xl hover:shadow-green-900/20 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                    >
                      {buscando ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Buscar por C.I. <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="max-w-md mx-auto bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3 mb-8 animate-shake">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-tight leading-tight">{error}</p>
                </div>
              )}

              {/* Operator Results Table */}
              {mostrarResultadosCedula && (
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-fade-in-up">
                  <div className="p-6 border-b border-slate-50 flex items-center gap-3">
                    <div className="w-1 h-4 bg-green-600 rounded-full" />
                    <h3 className="text-xs font-black text-[#002147] uppercase tracking-widest">Resultados Encontrados</h3>
                    <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase">{denunciasPorCedula.length} Registros</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-slate-50/30">
                          <th className="px-6 py-4 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest">Nº Acta</th>
                          <th className="px-6 py-4 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest">Hecho Punible</th>
                          <th className="px-6 py-4 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest">Fecha y Hora</th>
                          <th className="px-6 py-4 text-right text-[9px] font-black text-[#002147]/50 uppercase tracking-widest">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {denunciasPorCedula.map((denuncia) => (
                          <tr key={denuncia.id} className="group hover:bg-green-50/30 transition-all duration-200 text-[#002147]">
                            <td className="px-6 py-5 whitespace-nowrap">
                              <span className="text-sm font-black">#{denuncia.numero_orden}</span>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-xs font-bold uppercase tracking-tight leading-tight block">{denuncia.tipo_hecho}</span>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex flex-col text-[10px] font-bold text-slate-400">
                                <span>{formatearFechaSinTimezone(denuncia.fecha_denuncia)}</span>
                                <span className="text-slate-300">{denuncia.hora_denuncia} hs</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right">
                              <button
                                onClick={() => verDenuncia(denuncia.id)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm hover:bg-[#002147] hover:text-white hover:border-[#002147] transition-all duration-200 group-hover:shadow-md"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Ver
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

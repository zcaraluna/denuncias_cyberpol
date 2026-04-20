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
  const [filtroHashTemp, setFiltroHashTemp] = useState('')
  const [filtroTipoTemp, setFiltroTipoTemp] = useState('')
  const [filtroFechaDesdeTemp, setFiltroFechaDesdeTemp] = useState('')
  const [filtroFechaHastaTemp, setFiltroFechaHastaTemp] = useState('')

  // Estados aplicados para filtros
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroCedula, setFiltroCedula] = useState('')
  const [filtroHash, setFiltroHash] = useState('')
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
    setFiltroHashTemp(filtroHash)
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
      const hashMatch = !filtroHash ||
        denuncia.hash_denuncia?.toLowerCase().includes(filtroHash.toLowerCase())
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

      return nombreMatch && cedulaMatch && hashMatch && tipoMatch && fechaMatch
    })
  }, [denuncias, filtroNombre, filtroCedula, filtroHash, filtroTipo, filtroFechaDesde, filtroFechaHasta])

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
    setFiltroHash(filtroHashTemp)
    setFiltroTipo(filtroTipoTemp)
    setFiltroFechaDesde(filtroFechaDesdeTemp)
    setFiltroFechaHasta(filtroFechaHastaTemp)
    setPaginaActual(1)
  }

  const limpiarFiltros = () => {
    setFiltroNombreTemp('')
    setFiltroCedulaTemp('')
    setFiltroHashTemp('')
    setFiltroTipoTemp('')
    setFiltroFechaDesdeTemp('')
    setFiltroFechaHastaTemp('')
    setFiltroNombre('')
    setFiltroCedula('')
    setFiltroHash('')
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
      <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 font-sans">
        <div className="max-w-7xl mx-auto">
          {isAdmin ? (
            /* ==========================================================================
               VISTA ADMINISTRADOR / SUPERADMIN
               ========================================================================== */
            <>
              {/* Header Section */}
              <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-1.5 bg-[#002147] rounded-lg shadow-lg shadow-blue-900/10">
                      <FileSearch className="w-4 h-4 text-white" />
                    </div>
                    <h1 className="text-xl font-black text-[#002147] uppercase tracking-tight">Administración de Denuncias</h1>
                  </div>
                  <p className="text-slate-500 font-medium text-xs">Gestiona y supervisa todas las actas registradas.</p>
                </div>

                <Link
                  href="/denuncias/buscador-relato"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#002147] text-[#002147] font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#002147] hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg group"
                >
                  <Search className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  Buscador por Relato
                </Link>
              </div>

              {/* Filters Card - COMPACTED */}
              <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100 p-4 mb-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-50">
                  <Filter className="w-3.5 h-3.5 text-[#002147]" />
                  <h2 className="text-[10px] font-black text-[#002147] uppercase tracking-widest">Filtros de Búsqueda</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Filtro Nombre */}
                  <div className="hidden md:flex flex-col justify-end space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                      <User className="w-2.5 h-2.5" /> Denunciante
                    </label>
                    <input
                      type="text"
                      value={filtroNombreTemp}
                      onChange={(e) => setFiltroNombreTemp(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && aplicarFiltros()}
                      placeholder="Nombre..."
                      className="w-full h-[34px] px-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#002147]/10 focus:border-[#002147] text-xs font-bold uppercase transition-all outline-none placeholder:normal-case placeholder:font-medium"
                    />
                  </div>

                  {/* Filtro Cédula */}
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                      <Hash className="w-2.5 h-2.5" /> N.º Cédula
                    </label>
                    <input
                      type="text"
                      value={filtroCedulaTemp}
                      onChange={(e) => setFiltroCedulaTemp(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && aplicarFiltros()}
                      placeholder="Documento..."
                      className="w-full h-[34px] px-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#002147]/10 focus:border-[#002147] text-xs font-bold transition-all outline-none placeholder:font-medium"
                    />
                  </div>

                  {/* Filtro Hash (NUEVO PARA ADMIN) */}
                  <div className="hidden md:flex flex-col justify-end space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                      <Hash className="w-2.5 h-2.5" /> Hash de Denuncia
                    </label>
                    <input
                      type="text"
                      value={filtroHashTemp}
                      onChange={(e) => setFiltroHashTemp(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && aplicarFiltros()}
                      placeholder="Ej: ABC12..."
                      className="w-full h-[34px] px-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#002147]/10 focus:border-[#002147] text-xs font-bold uppercase transition-all outline-none placeholder:normal-case placeholder:font-medium"
                    />
                  </div>

                  {/* Filtro Tipo (react-select) */}
                  <div className="hidden md:flex flex-col justify-end space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                      <AlertCircle className="w-2.5 h-2.5" /> Hecho Punible
                    </label>
                    <div className="h-[34px]">
                      <Select
                        options={opcionesTipos}
                        value={opcionesTipos.find(opcion => opcion.value === filtroTipoTemp)}
                        onChange={(option) => setFiltroTipoTemp(option?.value || '')}
                        isSearchable
                        placeholder="Seleccionar..."
                        className="text-xs font-bold"
                        classNamePrefix="react-select"
                        styles={{
                          control: (base, state) => ({
                            ...base,
                            background: '#f8fafc',
                            borderRadius: '0.5rem',
                            minHeight: '34px',
                            height: '34px',
                            borderColor: state.isFocused ? '#002147' : '#e2e8f0',
                            boxShadow: state.isFocused ? '0 0 0 2px rgba(0, 33, 71, 0.1)' : 'none',
                            '&:hover': { borderColor: '#002147' }
                          }),
                          valueContainer: (base) => ({ ...base, padding: '0 8px', height: '34px', display: 'flex', alignItems: 'center' }),
                          indicatorsContainer: (base) => ({ ...base, height: '32px' }),
                          menu: (base) => ({
                            ...base,
                            borderRadius: '0.5rem',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            zIndex: 50
                          }),
                          option: (base, state) => ({
                            ...base,
                            fontSize: '10px',
                            fontWeight: '700',
                            padding: '8px 12px',
                            textTransform: 'uppercase',
                            backgroundColor: state.isSelected ? '#002147' : state.isFocused ? '#f1f5f9' : 'white',
                            color: state.isSelected ? 'white' : '#002147'
                          }),
                          singleValue: (base) => ({
                            ...base,
                            textTransform: 'uppercase',
                            color: '#002147'
                          }),
                          placeholder: (base) => ({
                            ...base,
                            textTransform: 'none',
                            fontWeight: '500'
                          })
                        }}
                      />
                    </div>
                  </div>

                  {/* Filtro Fecha */}
                  <div className="hidden md:flex flex-col justify-end space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                      <Calendar className="w-2.5 h-2.5" /> Rango Fechas
                    </label>
                    <div className="h-[34px] flex items-center">
                      <DateRangePicker
                        startDate={filtroFechaDesdeTemp}
                        endDate={filtroFechaHastaTemp}
                        onStartDateChange={setFiltroFechaDesdeTemp}
                        onEndDateChange={setFiltroFechaHastaTemp}
                        onApply={handleFechaApply}
                        onCancel={handleFechaCancel}
                        align="right"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2 pt-3 border-t border-slate-50 md:mt-4">
                  <button
                    onClick={limpiarFiltros}
                    className="hidden md:block px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={aplicarFiltros}
                    className="w-full md:w-auto px-6 py-2 text-[9px] font-black text-white bg-[#002147] uppercase tracking-widest rounded-lg hover:bg-[#003366] shadow-md transition-all"
                  >
                    Aplicar filtros
                  </button>
                </div>
              </div>

              {/* Table Section */}
              <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-4 py-3 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">Nº Acta</th>
                        <th className="px-4 py-3 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">Denunciante / C.I.</th>
                        <th className="px-4 py-3 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">Supuesto Hecho</th>
                        <th className="px-4 py-3 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">Fecha y Hora</th>
                        <th className="hidden md:table-cell px-4 py-3 text-right text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {denunciasFiltradas.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-16 text-center">
                            <div className="flex flex-col items-center">
                              <Search className="w-6 h-6 text-slate-200 mb-2" />
                              <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Sin resultados</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        denunciasPaginaActual.map((denuncia) => (
                          <tr 
                            key={denuncia.id} 
                            onClick={() => verDenuncia(denuncia.id)}
                            className="group hover:bg-blue-50/30 transition-all duration-200 cursor-pointer"
                          >
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="text-xs font-black text-[#002147]">#{denuncia.numero_orden}</span>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-[#002147] uppercase leading-tight">{denuncia.nombre_denunciante}</span>
                                <span className="text-[9px] font-medium text-slate-400">CI: {denuncia.cedula_denunciante}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{denuncia.tipo_hecho}</span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="flex flex-col text-[9px] font-bold text-slate-500">
                                <span>{formatearFechaSinTimezone(denuncia.fecha_denuncia)}</span>
                                <span className="text-slate-300">{denuncia.hora_denuncia} hs</span>
                              </div>
                            </td>
                            <td className="hidden md:table-cell px-4 py-3.5 whitespace-nowrap text-right">
                              <button
                                onClick={(e) => { e.stopPropagation(); verDenuncia(denuncia.id); }}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-[#002147] uppercase tracking-wider shadow-sm hover:bg-[#002147] hover:text-white transition-all duration-200"
                              >
                                <Eye className="w-3 h-3" />
                                Detalles
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
                  <div className="bg-slate-50/50 px-4 py-3 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Total <span className="text-[#002147]">{denunciasFiltradas.length}</span> registros
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                        disabled={paginaActual === 1}
                        className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-30 bg-white hover:border-[#002147] hover:text-[#002147] transition-all"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-[#002147] uppercase">
                        {paginaActual} / {totalPaginas}
                      </div>
                      <button
                        onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                        disabled={paginaActual === totalPaginas}
                        className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-30 bg-white hover:border-[#002147] hover:text-[#002147] transition-all"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ==========================================================================
               VISTA OPERADOR - REFINED & COMPACT
               ========================================================================== */
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center">
                <div className="inline-flex p-2 bg-white rounded-xl shadow-lg shadow-blue-900/5 border border-slate-100 mb-3">
                  <FileSearch className="w-6 h-6 text-[#002147]" />
                </div>
                <h1 className="text-2xl font-black text-[#002147] uppercase tracking-tight mb-1">Buscador de Denuncias</h1>
                <p className="text-slate-500 font-medium text-xs">Ingrese datos para localizar un acta policial.</p>
              </div>

              {/* Botón Buscador Especial Compacto */}
              <div className="flex justify-center">
                <Link
                  href="/denuncias/buscador-relato"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#002147] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#003366] transition-all shadow-lg group"
                >
                  <Search className="w-3.5 h-3.5" />
                  Buscador por Relato
                </Link>
              </div>

              {/* Single Multi-Search Card */}
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative">
                  {/* Hash Segment */}
                  <div className="hidden md:block space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Hash className="w-4 h-4 text-[#002147]" />
                      </div>
                      <h2 className="text-xs font-black text-[#002147] uppercase tracking-widest">Hash de Denuncia</h2>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={hashBusqueda}
                        onChange={(e) => setHashBusqueda(e.target.value.toUpperCase())}
                        onKeyPress={(e) => e.key === 'Enter' && buscarPorHash()}
                        placeholder="Ej: ABC123A25"
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-[#002147] focus:bg-white text-xs font-black uppercase tracking-widest transition-all outline-none"
                      />
                      <button
                        onClick={buscarPorHash}
                        disabled={buscando || !hashBusqueda.trim()}
                        className="w-full py-3 bg-[#002147] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#003366] disabled:opacity-30 transition-all flex items-center justify-center gap-2"
                      >
                        {buscando ? <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Validar Hash"}
                      </button>
                    </div>
                  </div>

                  {/* Vertical Divider for MD+ screens */}
                  <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2/3 w-px bg-slate-100" />

                  {/* Cedula Segment */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <User className="w-4 h-4 text-green-600" />
                      </div>
                      <h2 className="text-xs font-black text-[#002147] uppercase tracking-widest">Cédula de Identidad</h2>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={cedulaBusqueda}
                        onChange={(e) => setCedulaBusqueda(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && buscarPorCedula()}
                        placeholder="Documento n.º"
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-green-600 focus:bg-white text-xs font-black tracking-widest transition-all outline-none"
                      />
                      <button
                        onClick={buscarPorCedula}
                        disabled={buscando || !cedulaBusqueda.trim()}
                        className="w-full py-3 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
                      >
                        {buscando ? <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Buscar por C.I."}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-shake">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p className="text-[10px] font-bold uppercase tracking-tight">{error}</p>
                  </div>
                )}
              </div>

              {/* Operator Results Table */}
              {mostrarResultadosCedula && (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden animate-fade-in-up">
                  <div className="p-4 border-b border-slate-50 flex items-center gap-2">
                    <div className="w-1 h-3 bg-green-600 rounded-full" />
                    <h3 className="text-[10px] font-black text-[#002147] uppercase tracking-widest">Denuncias encontradas</h3>
                    <span className="ml-auto text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase">{denunciasPorCedula.length} registros</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-slate-50/30">
                          <th className="px-4 py-3 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest">Nº Acta</th>
                          <th className="px-4 py-3 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest">Supuesto Hecho</th>
                          <th className="px-4 py-3 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest">Fecha / Hora</th>
                          <th className="hidden md:table-cell px-4 py-3 text-right text-[9px] font-black text-[#002147]/50 uppercase tracking-widest">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {denunciasPorCedula.map((denuncia) => (
                          <tr 
                            key={denuncia.id} 
                            onClick={() => verDenuncia(denuncia.id)}
                            className="group hover:bg-green-50/30 transition-all duration-200 cursor-pointer"
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-xs font-black text-[#002147]">#{denuncia.numero_orden}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] font-bold text-[#002147] uppercase leading-tight">{denuncia.tipo_hecho}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex flex-col text-[9px] font-bold text-slate-400">
                                <span>{formatearFechaSinTimezone(denuncia.fecha_denuncia)}</span>
                                <span className="text-slate-300">{denuncia.hora_denuncia} hs</span>
                              </div>
                            </td>
                            <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap text-right">
                              <button
                                onClick={(e) => { e.stopPropagation(); verDenuncia(denuncia.id); }}
                                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-[#002147] uppercase tracking-wider hover:bg-[#002147] hover:text-white transition-all shadow-sm"
                              >
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

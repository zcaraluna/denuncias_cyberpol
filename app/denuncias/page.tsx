'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Select from 'react-select'
import DateRangePicker from '@/components/DateRangePicker'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatearFechaSinTimezone } from '@/lib/utils/fecha'

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

  // Estados temporales para filtros (valores que el usuario está escribiendo)
  const [filtroNombreTemp, setFiltroNombreTemp] = useState('')
  const [filtroCedulaTemp, setFiltroCedulaTemp] = useState('')
  const [filtroTipoTemp, setFiltroTipoTemp] = useState('')
  const [filtroFechaDesdeTemp, setFiltroFechaDesdeTemp] = useState('')
  const [filtroFechaHastaTemp, setFiltroFechaHastaTemp] = useState('')

  // Estados aplicados para filtros (valores que realmente se usan para filtrar)
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
      // Si es admin o superadmin, cargar todas las denuncias
      if (usuario.rol === 'admin' || usuario.rol === 'superadmin') {
        cargarDenuncias()
      } else {
        setLoading(false)
      }
    }
  }, [usuario])

  // Sincronizar estados temporales con aplicados al cargar
  useEffect(() => {
    setFiltroNombreTemp(filtroNombre)
    setFiltroCedulaTemp(filtroCedula)
    setFiltroTipoTemp(filtroTipo)
    setFiltroFechaDesdeTemp(filtroFechaDesde)
    setFiltroFechaHastaTemp(filtroFechaHasta)
  }, []) // Solo al montar el componente



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

  // Obtener tipos únicos para el filtro (en mayúsculas)
  const tiposDisponibles = useMemo(() => {
    const tipos = new Set(denuncias.map(d => d.tipo_hecho?.toUpperCase() || '').filter(Boolean))
    return Array.from(tipos).sort()
  }, [denuncias])

  // Opciones para react-select
  const opcionesTipos = useMemo(() => {
    return [
      { value: '', label: 'TODOS LOS TIPOS' },
      ...tiposDisponibles.map(tipo => ({ value: tipo, label: tipo }))
    ]
  }, [tiposDisponibles])

  // Filtrar denuncias
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

  // Calcular paginación
  const totalPaginas = Math.ceil(denunciasFiltradas.length / itemsPorPagina)
  const indiceInicio = (paginaActual - 1) * itemsPorPagina
  const indiceFin = indiceInicio + itemsPorPagina
  const denunciasPaginaActual = denunciasFiltradas.slice(indiceInicio, indiceFin)

  // Resetear página cuando cambian los filtros aplicados
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

  const handleFechaApply = () => {
    // Los valores ya se actualizan en el componente DateRangePicker
  }

  const handleFechaCancel = () => {
    // Restaurar valores temporales a los aplicados
    setFiltroFechaDesdeTemp(filtroFechaDesde)
    setFiltroFechaHastaTemp(filtroFechaHasta)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  if (!usuario) {
    return null
  }

  const isAdmin = usuario.rol === 'admin' || usuario.rol === 'superadmin'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← Volver al Inicio
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Denuncias</h1>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAdmin ? (
          // Vista para admin/superadmin: mostrar todas las denuncias
          <>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Todas las Denuncias</h2>
                <p className="text-gray-600">Lista completa de denuncias del sistema</p>
              </div>
              <Link
                href="/denuncias/buscador-relato"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscador Especial por Relato
              </Link>
            </div>

            {/* Filtros */}
            {denuncias.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={filtroNombreTemp}
                      onChange={(e) => setFiltroNombreTemp(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && aplicarFiltros()}
                      placeholder="Buscar por nombre..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cédula
                    </label>
                    <input
                      type="text"
                      value={filtroCedulaTemp}
                      onChange={(e) => setFiltroCedulaTemp(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && aplicarFiltros()}
                      placeholder="Buscar por cédula..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo
                    </label>
                    <Select
                      options={opcionesTipos}
                      value={opcionesTipos.find(opcion => opcion.value === filtroTipoTemp) || opcionesTipos[0]}
                      onChange={(option) => setFiltroTipoTemp(option?.value || '')}
                      isSearchable
                      placeholder="Buscar tipo..."
                      className="text-sm"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          minHeight: '42px',
                          borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                          boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                          '&:hover': {
                            borderColor: '#3b82f6',
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          maxHeight: '250px',
                          zIndex: 9999,
                        }),
                        menuList: (base) => ({
                          ...base,
                          maxHeight: '250px',
                        }),
                        option: (base, state) => ({
                          ...base,
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          padding: '8px 12px',
                          backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
                          color: state.isSelected ? 'white' : '#1f2937',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                        }),
                        input: (base) => ({
                          ...base,
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          margin: 0,
                          padding: 0,
                        }),
                        singleValue: (base) => ({
                          ...base,
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          color: '#1f2937',
                          textTransform: 'uppercase',
                        }),
                        placeholder: (base) => ({
                          ...base,
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          color: '#9ca3af',
                        }),
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rango de Fechas
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
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={limpiarFiltros}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    Limpiar Filtros
                  </button>
                  <button
                    onClick={aplicarFiltros}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                  >
                    Buscar
                  </button>
                </div>
              </div>
            )}

            {denuncias.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">No hay denuncias registradas</p>
              </div>
            ) : denunciasFiltradas.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">No se encontraron denuncias con los filtros aplicados</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            #
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
                            ACCIONES
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {denunciasPaginaActual.map((denuncia) => (
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 uppercase">
                              {denuncia.tipo_hecho?.toUpperCase() || ''}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatearFechaSinTimezone(denuncia.fecha_denuncia)} {denuncia.hora_denuncia}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => verDenuncia(denuncia.id)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Ver Denuncia
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-md p-4">
                    <div className="text-sm text-gray-700">
                      Mostrando {indiceInicio + 1} a {Math.min(indiceFin, denunciasFiltradas.length)} de {denunciasFiltradas.length} denuncias
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                        disabled={paginaActual === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition flex items-center gap-2 font-medium text-gray-700 bg-white"
                        aria-label="Página anterior"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Anterior</span>
                      </button>
                      <div className="px-4 py-2 text-gray-700 font-medium">
                        Página {paginaActual} de {totalPaginas}
                      </div>
                      <button
                        onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                        disabled={paginaActual === totalPaginas}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition flex items-center gap-2 font-medium text-gray-700 bg-white"
                        aria-label="Página siguiente"
                      >
                        <span>Siguiente</span>
                        <svg className="w-5 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          // Vista para operadores: buscar por hash o cédula
          <>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Buscar Denuncia</h2>
                <p className="text-gray-600">Busque por hash de denuncia o por cédula del denunciante</p>
              </div>
              <Link
                href="/denuncias/buscador-relato"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 group text-center flex justify-center"
              >
                <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscador Especial por Relato
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hash de Denuncia
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={hashBusqueda}
                      onChange={(e) => setHashBusqueda(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && buscarPorHash()}
                      placeholder="Ejemplo: ABC123A25"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                      autoComplete="off"
                    />
                    <button
                      onClick={buscarPorHash}
                      disabled={buscando || !hashBusqueda.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      Buscar
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cédula del Denunciante
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cedulaBusqueda}
                      onChange={(e) => setCedulaBusqueda(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && buscarPorCedula()}
                      placeholder="Ejemplo: 1234567"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                      autoComplete="off"
                    />
                    <button
                      onClick={buscarPorCedula}
                      disabled={buscando || !cedulaBusqueda.trim()}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      Buscar
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
                  {error}
                </div>
              )}
            </div>

            {mostrarResultadosCedula && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          DENUNCIANTE
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          TIPO
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          FECHA Y HORA
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ACCIONES
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {denunciasPorCedula.map((denuncia) => (
                        <tr key={denuncia.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {denuncia.numero_orden}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {denuncia.nombre_denunciante}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 uppercase">
                            {denuncia.tipo_hecho?.toUpperCase() || ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatearFechaSinTimezone(denuncia.fecha_denuncia)} {denuncia.hora_denuncia}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => verDenuncia(denuncia.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Ver Denuncia
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}


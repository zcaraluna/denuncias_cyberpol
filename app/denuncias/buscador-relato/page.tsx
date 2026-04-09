'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Select from 'react-select'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatearFechaSinTimezone } from '@/lib/utils/fecha'
import DateRangePicker from '@/components/DateRangePicker'
import { obtenerHechosPuniblesEspecificos } from '@/lib/data/hechos-punibles'
import { exportToExcel } from '@/lib/utils/export-excel'
import { MainLayout } from '@/components/MainLayout'
import {
    Search,
    FileSearch,
    ArrowLeft,
    Calendar,
    AlertCircle,
    Download,
    Database,
    ChevronDown,
    ChevronUp,
    FileText,
    DollarSign,
    ExternalLink,
    Filter
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
    relato: string
    monto_dano: number | null
    moneda: string | null
}

export default function BuscadorRelatoPage() {
    const router = useRouter()
    const { usuario, loading: authLoading } = useAuth()

    const [termino, setTermino] = useState('')
    const [fechaDesde, setFechaDesde] = useState('')
    const [fechaHasta, setFechaHasta] = useState('')
    const [tipoHecho, setTipoHecho] = useState('')

    const [resultados, setResultados] = useState<Denuncia[]>([])
    const [total, setTotal] = useState(0)
    const [pagina, setPagina] = useState(1)
    const [limite] = useState(20)

    const [filaExpandida, setFilaExpandida] = useState<number | null>(null)
    const [buscando, setBuscando] = useState(false)
    const [exportando, setExportando] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const tiposDisponibles = obtenerHechosPuniblesEspecificos()
    const opcionesTipos = [
        { value: '', label: 'TODOS LOS TIPOS' },
        ...tiposDisponibles.map(tipo => ({ value: tipo, label: tipo.toUpperCase() }))
    ]

    const realizarBusqueda = useCallback(async (nuevaPagina = 1) => {
        if (!termino.trim() && !fechaDesde && !fechaHasta && !tipoHecho) {
            setResultados([])
            setTotal(0)
            return
        }

        setBuscando(true)
        setError(null)
        setPagina(nuevaPagina)

        try {
            const response = await fetch('/api/denuncias/buscar-relato', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    termino,
                    fechaDesde,
                    fechaHasta,
                    tipoHecho,
                    pagina: nuevaPagina,
                    limite
                })
            })

            if (!response.ok) throw new Error('Error en la búsqueda')

            const data = await response.json()
            setResultados(data.resultados)
            setTotal(data.total)
        } catch (err) {
            console.error(err)
            setError('Ocurrió un error al realizar la búsqueda')
        } finally {
            setBuscando(false)
        }
    }, [termino, fechaDesde, fechaHasta, tipoHecho, limite])

    const manejarExportacion = async () => {
        if (resultados.length === 0) return
        setExportando(true)
        try {
            const response = await fetch('/api/denuncias/buscar-relato', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ termino, fechaDesde, fechaHasta, tipoHecho, pagina: 1, limite: 1000 })
            })

            if (!response.ok) throw new Error('Error al obtener datos')
            const data = await response.json()

            const columnas = [
                { header: 'Orden', key: 'numero_orden', width: 10 },
                { header: 'Fecha', key: 'fecha_denuncia', width: 15 },
                { header: 'Denunciante', key: 'nombre_denunciante', width: 30 },
                { header: 'Cédula', key: 'cedula_denunciante', width: 15 },
                { header: 'Tipo Hecho', key: 'tipo_hecho', width: 25 },
                { header: 'Relato', key: 'relato', width: 50 },
                { header: 'Monto', key: 'monto_dano', width: 15 },
                { header: 'Moneda', key: 'moneda', width: 10 }
            ]

            await exportToExcel(
                data.resultados.map((res: any) => ({
                    ...res,
                    fecha_denuncia: formatearFechaSinTimezone(res.fecha_denuncia)
                })),
                `busqueda_relato_${new Date().toISOString().split('T')[0]}`,
                columnas
            )
        } catch (err) {
            console.error(err)
            alert('Error al exportar a Excel')
        } finally {
            setExportando(false)
        }
    }

    const manejarExportacionJSON = async () => {
        if (resultados.length === 0) return
        setExportando(true)
        try {
            const response = await fetch('/api/denuncias/buscar-relato', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ termino, fechaDesde, fechaHasta, tipoHecho, pagina: 1, limite: 1000 })
            })
            if (!response.ok) throw new Error('Error al obtener datos')
            const data = await response.json()
            const jsonString = JSON.stringify(data.resultados, null, 2)
            const blob = new Blob([jsonString], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            const termSafe = termino.trim() ? termino.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') : 'todos'
            link.href = url
            link.download = `denuncias_relato_${termSafe}_${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error(err)
            alert('Error al exportar a JSON')
        } finally {
            setExportando(false)
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <div className="w-10 h-10 border-3 border-[#002147]/10 border-t-[#002147] rounded-full animate-spin" />
            </div>
        )
    }

    if (!usuario) return null

    const resaltarTermino = (texto: string, busqueda: string) => {
        if (!busqueda.trim()) return texto
        const partes = texto.split(new RegExp(`(${busqueda})`, 'gi'))
        return (
            <>
                {partes.map((parte, i) =>
                    parte.toLowerCase() === busqueda.toLowerCase()
                        ? <mark key={i} className="bg-yellow-200 text-[#002147] font-black rounded-sm px-0.5">{parte}</mark>
                        : parte
                )}
            </>
        )
    }

    const totalPaginas = Math.ceil(total / limite)

    return (
        <MainLayout>
            <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 font-sans">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Link href="/denuncias" className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-all text-[#002147]">
                                    <ArrowLeft className="w-4 h-4" />
                                </Link>
                                <div className="p-1.5 bg-[#002147] rounded-lg shadow-lg">
                                    <FileSearch className="w-4 h-4 text-white" />
                                </div>
                                <h1 className="text-xl font-black text-[#002147] uppercase tracking-tight md:text-xl">Buscador Relato</h1>
                            </div>
                            <p className="hidden md:block text-slate-500 font-medium text-xs ml-11">Búsqueda avanzada de coincidencias en el relato de los hechos.</p>
                        </div>

                        {resultados.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={manejarExportacion}
                                    disabled={exportando}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-900/10 disabled:opacity-50"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Excel
                                </button>
                                <button
                                    onClick={manejarExportacionJSON}
                                    disabled={exportando}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#002147] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#003366] transition shadow-lg shadow-blue-900/10 disabled:opacity-50"
                                >
                                    <Database className="w-3.5 h-3.5" />
                                    JSON
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Search Card */}
                    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 mb-8">
                        <div className="space-y-6">
                            {/* Barra de Búsqueda Principal */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-[#002147]/30" />
                                </div>
                                <input
                                    type="text"
                                    value={termino}
                                    onChange={(e) => setTermino(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && realizarBusqueda(1)}
                                    placeholder="Escriba palabras clave del relato... (ej: estafa, tarjeta, sim-swap)"
                                    className="block w-full h-[54px] pl-12 pr-4 text-sm font-bold border-2 border-slate-100 rounded-2xl focus:border-[#002147] transition-all outline-none bg-slate-50/50"
                                />
                            </div>

                            {/* Filtros Secundarios - Compactos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#002147] uppercase tracking-widest flex items-center gap-2 ml-1">
                                        <Calendar className="w-3.5 h-3.5" /> Rango de Fechas
                                    </label>
                                    <div className="h-[44px] flex items-center">
                                        <DateRangePicker
                                            startDate={fechaDesde}
                                            endDate={fechaHasta}
                                            onStartDateChange={setFechaDesde}
                                            onEndDateChange={setFechaHasta}
                                            onApply={() => realizarBusqueda(1)}
                                            onCancel={() => {
                                                setFechaDesde('')
                                                setFechaHasta('')
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#002147] uppercase tracking-widest flex items-center gap-2 ml-1">
                                        <AlertCircle className="w-3.5 h-3.5" /> Tipo de Hecho
                                    </label>
                                    <Select
                                        options={opcionesTipos}
                                        value={opcionesTipos.find(op => op.value === tipoHecho)}
                                        onChange={(op) => setTipoHecho(op?.value || '')}
                                        isSearchable
                                        placeholder="Filtrar por tipo..."
                                        classNamePrefix="react-select"
                                        styles={{
                                            control: (base, state) => ({
                                                ...base,
                                                borderRadius: '0.75rem',
                                                padding: '4px',
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                borderColor: state.isFocused ? '#002147' : '#f1f5f9',
                                                boxShadow: state.isFocused ? '0 0 0 4px rgba(0, 33, 71, 0.05)' : 'none',
                                                '&:hover': { borderColor: '#002147' },
                                                backgroundColor: '#f8fafc',
                                                minHeight: '44px',
                                                textTransform: 'uppercase'
                                            }),
                                            option: (base, state) => ({
                                                ...base,
                                                padding: '10px 15px',
                                                fontSize: '11px',
                                                fontWeight: '800',
                                                backgroundColor: state.isSelected ? '#002147' : state.isFocused ? '#f1f5f9' : 'white',
                                                color: state.isSelected ? 'white' : '#002147',
                                                textTransform: 'uppercase'
                                            }),
                                            singleValue: (base) => ({ ...base, color: '#002147' }),
                                            placeholder: (base) => ({ ...base, textTransform: 'none', fontWeight: '500' })
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-center pt-2">
                                <button
                                    onClick={() => realizarBusqueda(1)}
                                    disabled={buscando}
                                    className="px-10 py-3 bg-[#002147] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-[#003366] transition shadow-xl shadow-blue-900/20 disabled:opacity-50 flex items-center gap-3"
                                >
                                    <Search className="w-4 h-4" />
                                    {buscando ? "Buscando..." : "Realizar Búsqueda"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table Results */}
                    {!buscando && resultados.length > 0 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-2 ml-1">
                                <span className="text-[10px] font-black text-[#002147] bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-widest">
                                    {total} resultados encontrados
                                </span>
                                {totalPaginas > 1 && (
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Página {pagina} de {totalPaginas}
                                    </span>
                                )}
                            </div>

                            <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border-separate border-spacing-0">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="hidden md:table-cell px-4 py-3 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">Nº Acta</th>
                                                <th className="px-4 py-3 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">Denunciante / C.I.</th>
                                                <th className="px-4 py-3 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">Supuesto Hecho</th>
                                                <th className="hidden md:table-cell px-4 py-3 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">Fecha</th>
                                                <th className="px-4 py-3 text-right text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {resultados.map((res) => (
                                                <React.Fragment key={res.id}>
                                                    <tr 
                                                        onClick={() => setFilaExpandida(filaExpandida === res.id ? null : res.id)}
                                                        className={`group transition-all duration-200 cursor-pointer ${filaExpandida === res.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                                                    >
                                                        <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap">
                                                            <span className="text-xs font-black text-[#002147]">#{res.numero_orden}</span>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-bold text-[#002147] uppercase leading-tight">{res.nombre_denunciante}</span>
                                                                <span className="text-[9px] font-medium text-slate-400">CI: {res.cedula_denunciante}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{res.tipo_hecho}</span>
                                                        </td>
                                                        <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap">
                                                            <div className="text-[10px] font-bold text-slate-500">
                                                                {formatearFechaSinTimezone(res.fecha_denuncia)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setFilaExpandida(filaExpandida === res.id ? null : res.id); }}
                                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${filaExpandida === res.id
                                                                            ? 'bg-[#002147] text-white shadow-lg shadow-blue-900/20'
                                                                            : 'bg-white border border-slate-200 text-[#002147] hover:bg-slate-50 shadow-sm'
                                                                        }`}
                                                                >
                                                                    {filaExpandida === res.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                                    <span className="hidden sm:inline">{filaExpandida === res.id ? 'Cerrar' : 'Relato'}</span>
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); router.push(`/ver-denuncia/${res.id}`); }}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-[#002147] rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm hover:bg-[#002147] hover:text-white transition-all duration-200"
                                                                >
                                                                    <ExternalLink className="w-3 h-3" />
                                                                    <span className="hidden sm:inline">Expediente</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {filaExpandida === res.id && (
                                                        <tr className="bg-blue-50/30">
                                                            <td colSpan={5} className="px-4 py-6 md:px-6 border-b border-blue-100">
                                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                                    <div className="lg:col-span-2 space-y-3">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <FileText className="w-4 h-4 text-[#002147]" />
                                                                            <h4 className="text-[10px] font-black text-[#002147] uppercase tracking-[0.15em]">Relato de los Hechos</h4>
                                                                        </div>
                                                                        <div className="bg-white p-5 rounded-xl border border-blue-100 text-xs font-medium text-slate-700 leading-relaxed shadow-sm">
                                                                            {resaltarTermino(res.relato || '', termino)}
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-4">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <DollarSign className="w-4 h-4 text-green-600" />
                                                                            <h4 className="text-[10px] font-black text-[#002147] uppercase tracking-[0.15em]">Impacto Patrimonial</h4>
                                                                        </div>
                                                                        <div className="bg-white p-5 rounded-xl border border-green-100 shadow-sm">
                                                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Monto Declarado:</p>
                                                                            <div className="text-xl font-black text-[#002147]">
                                                                                {res.monto_dano
                                                                                    ? `${parseInt(res.monto_dano.toString()).toLocaleString('es-PY')} ${res.moneda || ''}`
                                                                                    : <span className="text-slate-300">NO DECLARADO</span>}
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => router.push(`/ver-denuncia/${res.id}`)}
                                                                            className="w-full py-3 bg-white border-2 border-[#002147] text-[#002147] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#002147] hover:text-white transition-all shadow-md group flex items-center justify-center gap-2"
                                                                        >
                                                                            Ver Expediente Completo
                                                                            <ChevronDown className="w-3.5 h-3.5 -rotate-90 group-hover:translate-x-1 transition-transform" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPaginas > 1 && (
                                    <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Mostrando <span className="text-[#002147]">{resultados.length}</span> de <span className="text-[#002147]">{total}</span>
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => realizarBusqueda(pagina - 1)}
                                                disabled={pagina === 1 || buscando}
                                                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 bg-white hover:border-[#002147] hover:text-[#002147] transition-all"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                            </button>

                                            <div className="flex items-center gap-1 px-2">
                                                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                                                    let p = i + 1;
                                                    if (totalPaginas > 5 && pagina > 3) p = pagina - 3 + i + 1;
                                                    if (p > totalPaginas) return null;
                                                    return (
                                                        <button
                                                            key={p}
                                                            onClick={() => realizarBusqueda(p)}
                                                            className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${pagina === p
                                                                    ? 'bg-[#002147] text-white shadow-lg shadow-blue-900/20'
                                                                    : 'bg-white border border-slate-200 text-slate-500 hover:border-[#002147] hover:text-[#002147]'
                                                                }`}
                                                        >
                                                            {p}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <button
                                                onClick={() => realizarBusqueda(pagina + 1)}
                                                disabled={pagina === totalPaginas || buscando}
                                                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 bg-white hover:border-[#002147] hover:text-[#002147] transition-all"
                                            >
                                                <ChevronDown className="w-4 h-4 rotate-[270deg]" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Empty States */}
                    {!buscando && !error && resultados.length === 0 && (termino || fechaDesde || fechaHasta || tipoHecho) && (
                        <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-20 text-center animate-in fade-in duration-500">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4 text-slate-200 border border-slate-100">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-black text-[#002147] uppercase tracking-tight">Sin coincidencias halladas</h3>
                            <p className="text-slate-400 font-medium text-xs mt-2 max-w-xs mx-auto uppercase tracking-wide leading-relaxed">Pruebe con otros términos o ajuste los filtros de búsqueda.</p>
                        </div>
                    )}

                    {!buscando && !error && resultados.length === 0 && !termino && !fechaDesde && !fechaHasta && !tipoHecho && (
                        <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-16 text-center border-dashed border-2 border-slate-200">
                            <FileSearch className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Ingrese parámetros para iniciar búsqueda</h3>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Select from 'react-select'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatearFechaSinTimezone } from '@/lib/utils/fecha'
import DateRangePicker from '@/components/DateRangePicker'
import { obtenerHechosPuniblesEspecificos } from '@/lib/data/hechos-punibles'

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
    const { usuario, loading: authLoading, logout } = useAuth()

    const [termino, setTermino] = useState('')
    const [fechaDesde, setFechaDesde] = useState('')
    const [fechaHasta, setFechaHasta] = useState('')
    const [tipoHecho, setTipoHecho] = useState('')
    const [resultados, setResultados] = useState<Denuncia[]>([])
    const [filaExpandida, setFilaExpandida] = useState<number | null>(null)
    const [buscando, setBuscando] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const tiposDisponibles = obtenerHechosPuniblesEspecificos()
    const opcionesTipos = [
        { value: '', label: 'TODOS LOS TIPOS' },
        ...tiposDisponibles.map(tipo => ({ value: tipo, label: tipo.toUpperCase() }))
    ]

    const realizarBusqueda = useCallback(async () => {
        // No buscar si el término es muy corto para evitar resultados irrelevantes
        // a menos que haya otros filtros activos
        if (!termino.trim() && !fechaDesde && !fechaHasta && !tipoHecho) {
            setResultados([])
            return
        }

        setBuscando(true)
        setError(null)

        try {
            const response = await fetch('/api/denuncias/buscar-relato', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    termino,
                    fechaDesde,
                    fechaHasta,
                    tipoHecho
                })
            })

            if (!response.ok) throw new Error('Error en la búsqueda')

            const data = await response.json()
            setResultados(data)
        } catch (err) {
            console.error(err)
            setError('Ocurrió un error al realizar la búsqueda')
        } finally {
            setBuscando(false)
        }
    }, [termino, fechaDesde, fechaHasta, tipoHecho])

    // Eliminar el useEffect de búsqueda en tiempo real

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Cargando...</div>
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
                        ? <mark key={i} className="bg-yellow-200 text-gray-900 rounded-px px-0.5">{parte}</mark>
                        : parte
                )}
            </>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/denuncias" className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Volver a Denuncias
                        </Link>
                        <h1 className="text-xl font-bold text-gray-800">Buscador Especial por Relato</h1>
                        <div className="w-32"></div> {/* Espaciador */}
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
                    <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-transparent">
                        <div className="flex flex-col gap-6">
                            {/* Barra de Búsqueda Principal */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={termino}
                                        onChange={(e) => setTermino(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && realizarBusqueda()}
                                        placeholder="Escriba palabras clave del relato... (ej: estafa, tarjeta, sim-swap)"
                                        className="block w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none bg-white placeholder:text-gray-400"
                                        autoComplete="off"
                                    />
                                </div>
                                <button
                                    onClick={realizarBusqueda}
                                    disabled={buscando}
                                    className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    BUSCAR
                                </button>
                            </div>
                        </div>

                        {/* Filtros Secundarios */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Rango de Fechas
                                </label>
                                <DateRangePicker
                                    startDate={fechaDesde}
                                    endDate={fechaHasta}
                                    onStartDateChange={setFechaDesde}
                                    onEndDateChange={setFechaHasta}
                                    onApply={() => realizarBusqueda()}
                                    onCancel={() => {
                                        setFechaDesde('')
                                        setFechaHasta('')
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    Tipo de Hecho
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
                                            borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
                                            boxShadow: state.isFocused ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none',
                                            '&:hover': { borderColor: '#d1d5db' },
                                            backgroundColor: 'white'
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isFocused ? '#eff6ff' : state.isSelected ? '#3b82f6' : 'white',
                                            color: state.isSelected ? 'white' : '#1f2937',
                                            cursor: 'pointer',
                                            '&:active': { backgroundColor: '#dbeafe' }
                                        }),
                                        singleValue: (base) => ({
                                            ...base,
                                            color: '#1f2937'
                                        })
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Estado de Búsqueda */}
                {buscando && (
                    <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-500 font-medium">Buscando coincidencias...</span>
                    </div>
                )}

                {/* Resultados */}
                {!buscando && resultados.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Orden</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Denunciante</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo/Hecho</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {resultados.map((res) => (
                                    <tr key={res.id} className="hover:bg-blue-50/10 transition-colors border-b border-gray-100">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                                            #{res.numero_orden}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{res.nombre_denunciante}</div>
                                            <div className="text-xs text-gray-500">{res.cedula_denunciante}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full uppercase">
                                                {res.tipo_hecho}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {formatearFechaSinTimezone(res.fecha_denuncia)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => setFilaExpandida(filaExpandida === res.id ? null : res.id)}
                                                className="inline-flex items-center px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                                            >
                                                {filaExpandida === res.id ? (
                                                    <>
                                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                        </svg>
                                                        Contraer
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                        Expandir detalles
                                                    </>
                                                )}
                                            </button>
                                            <Link
                                                href={`/ver-denuncia/${res.id}`}
                                                className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                            >
                                                Ver acta
                                            </Link>
                                        </td>
                                    </tr>
                                { filaExpandida === res.id && (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-6 bg-blue-50/30">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                    <div className="md:col-span-2 space-y-3">
                                                        <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            Relato de los Hechos
                                                        </h4>
                                                        <div className="bg-white p-4 rounded-xl border border-blue-100 text-sm text-gray-700 leading-relaxed shadow-sm">
                                                            {resaltarTermino(res.relato || '', termino)}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Perjuicio Económico
                                                        </h4>
                                                        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                                                            <div className="text-xs text-gray-500 mb-1">Impacto Patrimonial:</div>
                                                            <div className="text-lg font-bold text-gray-900">
                                                                {res.monto_dano
                                                                    ? `${parseInt(res.monto_dano.toString()).toLocaleString('es-PY')} ${res.moneda || ''}`
                                                                    : 'No declarado'}
                                                            </div>
                                                        </div>
                                                        <div className="pt-2">
                                                            <Link
                                                                href={`/ver-denuncia/${res.id}`}
                                                                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 group"
                                                            >
                                                                IR AL EXPEDIENTE COMPLETO
                                                                <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                                </svg>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Sin Resultados */}
                {!buscando && !error && resultados.length === 0 && (termino || fechaDesde || fechaHasta || tipoHecho) && (
                    <div className="p-20 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No se encontraron coincidencias</h3>
                        <p className="text-gray-500 max-w-xs mx-auto mt-2">Intente con otras palabras clave o ajuste los filtros de fecha y tipo.</p>
                    </div>
                )}

                {/* Mensaje Inicial */}
                {!buscando && !error && resultados.length === 0 && !termino && !fechaDesde && !fechaHasta && !tipoHecho && (
                    <div className="p-20 text-center bg-gray-50/50">
                        <h3 className="text-lg font-medium text-gray-400">Ingrese un término de búsqueda para comenzar</h3>
                    </div>
                )}

                {error && (
                    <div className="p-8 text-center text-red-600 bg-red-50">
                        <p className="font-medium">{error}</p>
                    </div>
                )}
            </main>
        </div>
    )
}

'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/MainLayout'
import { formatearFechaSinTimezone } from '@/lib/utils/fecha'
import {
    Clipboard,
    Shield,
    MapPin,
    Calendar,
    Hash,
    Activity,
    User,
    Layout,
    ExternalLink,
    ChevronRight
} from 'lucide-react'

interface Visita {
    id: number
    denuncia_id: number
    fecha_visita: string
    numero_orden: number
    nombre_denunciante: string
    hash_denuncia: string
    tipo_hecho: string
    fecha_denuncia: string
}

interface DenunciaTomada {
    id: number
    numero_orden: number
    nombre_denunciante: string
    cedula_denunciante: string
    tipo_hecho: string
    fecha_denuncia: string
    hora_denuncia: string
    hash_denuncia: string
}

interface UsuarioAuth {
    id: number
    nombre: string
    apellido: string
    grado: string
    oficina: string
    rol: string
    usuario: string
}

interface Usuario {
    id: number
    nombre: string
    apellido: string
    grado: string
    oficina: string
    rol: string
    usuario: string
    activo: boolean
}

export default function PerfilUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { usuario: usuarioAuth, loading: authLoading } = useAuth()
    const [usuarioActivo, setUsuarioActivo] = useState<UsuarioAuth | null>(null)
    const [usuario, setUsuario] = useState<Usuario | null>(null)
    const [visitas, setVisitas] = useState<Visita[]>([])
    const [denunciasTomadas, setDenunciasTomadas] = useState<DenunciaTomada[]>([])
    const [loading, setLoading] = useState(true)
    const [usuarioId, setUsuarioId] = useState<string>('')
    const [paginaActual, setPaginaActual] = useState(1)
    const [paginaActualTomadas, setPaginaActualTomadas] = useState(1)
    const [pestañaActiva, setPestañaActiva] = useState<'consultadas' | 'tomadas'>('consultadas')
    const itemsPorPagina = 10

    useEffect(() => {
        const loadParams = async () => {
            const resolvedParams = await params
            setUsuarioId(resolvedParams.id)
        }
        loadParams()
    }, [params])

    useEffect(() => {
        if (usuarioAuth) {
            setUsuarioActivo(usuarioAuth)

            if (usuarioAuth.rol !== 'superadmin' && usuarioAuth.rol !== 'admin') {
                router.push('/dashboard')
                return
            }
        }
    }, [usuarioAuth, router])

    useEffect(() => {
        if (!usuarioId || !usuarioActivo) return

        const cargarDatos = async () => {
            try {
                const [usuarioResponse, visitasResponse, denunciasTomadasResponse] = await Promise.all([
                    fetch(`/api/usuarios/${usuarioId}`, { cache: 'no-store' }),
                    fetch(`/api/registro-actividad/consultas/${usuarioId}`, { cache: 'no-store' }),
                    fetch(`/api/denuncias/usuario/${usuarioId}`, { cache: 'no-store' })
                ])

                if (!usuarioResponse.ok) throw new Error('Error al cargar usuario')
                if (!visitasResponse.ok) throw new Error('Error al cargar visitas')
                if (!denunciasTomadasResponse.ok) throw new Error('Error al cargar denuncias tomadas')

                const usuarioData = await usuarioResponse.json()
                const visitasData = await visitasResponse.json()
                const denunciasTomadasData = await denunciasTomadasResponse.json()

                setUsuario(usuarioData)
                setVisitas(visitasData)
                setDenunciasTomadas(denunciasTomadasData)
            } catch (error) {
                console.error('Error:', error)
                alert('Error al cargar los datos')
            } finally {
                setLoading(false)
            }
        }

        cargarDatos()
    }, [usuarioId, usuarioActivo])

    const formatearFecha = (fecha: string) => {
        const date = new Date(fecha)
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const totalPaginasConsultadas = Math.ceil(visitas.length / itemsPorPagina)
    const indiceInicioConsultadas = (paginaActual - 1) * itemsPorPagina
    const indiceFinConsultadas = indiceInicioConsultadas + itemsPorPagina
    const visitasPaginaActual = visitas.slice(indiceInicioConsultadas, indiceFinConsultadas)

    const totalPaginasTomadas = Math.ceil(denunciasTomadas.length / itemsPorPagina)
    const indiceInicioTomadas = (paginaActualTomadas - 1) * itemsPorPagina
    const indiceFinTomadas = indiceInicioTomadas + itemsPorPagina
    const denunciasTomadasPaginaActual = denunciasTomadas.slice(indiceInicioTomadas, indiceFinTomadas)

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl font-bold text-[#002147]">Cargando perfil...</div>
            </div>
        )
    }

    if (!usuarioActivo || !usuario) return null

    return (
        <MainLayout>
            <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
                <div className="max-w-7xl mx-auto mb-8">
                    <div className="bg-white rounded-[32px] border border-slate-200/60 p-8 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-slate-50 rounded-full -mr-40 -mt-40 z-0 opacity-50"></div>

                        <div className="relative z-10">
                            <Link href="/gestion-usuarios" className="inline-flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-[#002147] transition-colors mb-6 group">
                                <ChevronRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                                Volver a Gestión
                            </Link>

                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div className="flex items-start gap-6">
                                    <div className="p-5 bg-[#002147] rounded-3xl shadow-xl shadow-blue-900/20 text-white">
                                        <User className="h-10 w-10" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${usuario.rol === 'superadmin' ? 'bg-red-50 text-red-600 border-red-100' :
                                                usuario.rol === 'admin' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                    'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}>
                                                {usuario.rol}
                                            </span>
                                            {usuario.activo ? (
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                                    <Activity className="h-3 w-3" /> Activo
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    <Activity className="h-3 w-3" /> Inactivo
                                                </span>
                                            )}
                                        </div>
                                        <h1 className="text-4xl font-black text-[#002147] leading-tight">
                                            {usuario.nombre} {usuario.apellido}
                                        </h1>
                                        <p className="text-slate-500 font-bold mt-1 flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-slate-300" />
                                            {usuario.grado}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Usuario de Sistema</p>
                                        <p className="text-sm font-bold text-[#002147]">{usuario.usuario}</p>
                                    </div>
                                    <div className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Oficina / Base</p>
                                        <p className="text-sm font-bold text-[#002147]">{usuario.oficina}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto mb-6">
                    <div className="flex p-1 bg-slate-100 rounded-2xl w-fit border border-slate-200">
                        <button
                            onClick={() => { setPestañaActiva('consultadas'); setPaginaActual(1); }}
                            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pestañaActiva === 'consultadas' ? 'bg-white text-[#002147] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Consultadas ({visitas.length})
                        </button>
                        <button
                            onClick={() => { setPestañaActiva('tomadas'); setPaginaActualTomadas(1); }}
                            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pestañaActiva === 'tomadas' ? 'bg-white text-[#002147] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Tomadas ({denunciasTomadas.length})
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto">
                    {pestañaActiva === 'consultadas' ? (
                        visitas.length === 0 ? (
                            <div className="bg-white rounded-[32px] border border-slate-200/60 p-16 text-center shadow-sm">
                                <p className="text-slate-400 font-black uppercase tracking-widest text-sm italic">Sin registros de consulta bajo este perfil</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100">
                                        <thead>
                                            <tr className="bg-slate-50/50 text-left border-b border-slate-100">
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha y Hora</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Denuncia</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Denunciante</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hecho</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {visitasPaginaActual.map((visita) => (
                                                <tr key={visita.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-black text-[#002147]">{formatearFecha(visita.fecha_visita)}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-blue-600 font-bold text-sm">#{visita.numero_orden}</span>
                                                        <p className="text-[10px] font-mono text-slate-400 tracking-tighter uppercase">{visita.hash_denuncia}</p>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-xs font-black text-slate-700 uppercase">{visita.nombre_denunciante}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase italic line-clamp-1">{visita.tipo_hecho}</span>
                                                    </td>
                                                    <td className="px-8 py-4 whitespace-nowrap text-right">
                                                        <Link href={`/ver-denuncia/${visita.denuncia_id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm">
                                                            Ver Detalles
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    ) : (
                        denunciasTomadas.length === 0 ? (
                            <div className="bg-white rounded-[32px] border border-slate-200/60 p-16 text-center shadow-sm">
                                <p className="text-slate-400 font-black uppercase tracking-widest text-sm italic">Este funcionario no ha tomado denuncias aún</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100">
                                        <thead>
                                            <tr className="bg-slate-50/50 text-left border-b border-slate-100">
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nro de Orden</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Denunciante</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cédula</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hecho</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Toma</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {denunciasTomadasPaginaActual.map((denuncia) => (
                                                <tr key={denuncia.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-4 whitespace-nowrap">
                                                        <span className="text-blue-600 font-black text-lg">#{denuncia.numero_orden}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-black text-[#002147] uppercase">{denuncia.nombre_denunciante}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-xs font-bold text-slate-500">{denuncia.cedula_denunciante}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase italic">{denuncia.tipo_hecho}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-600 text-xs">
                                                        {formatearFechaSinTimezone(denuncia.fecha_denuncia)} {denuncia.hora_denuncia}
                                                    </td>
                                                    <td className="px-8 py-4 whitespace-nowrap text-right">
                                                        <Link href={`/ver-denuncia/${denuncia.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm">
                                                            Ver Detalles
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    )}

                    {((pestañaActiva === 'consultadas' && totalPaginasConsultadas > 1) || (pestañaActiva === 'tomadas' && totalPaginasTomadas > 1)) && (
                        <div className="mt-8 flex items-center justify-center gap-4">
                            <button
                                onClick={() => pestañaActiva === 'consultadas' ? setPaginaActual(p => Math.max(1, p - 1)) : setPaginaActualTomadas(p => Math.max(1, p - 1))}
                                disabled={pestañaActiva === 'consultadas' ? paginaActual === 1 : paginaActualTomadas === 1}
                                className="px-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                            >
                                Anterior
                            </button>
                            <div className="px-5 py-2.5 bg-[#002147] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/10">
                                Página {pestañaActiva === 'consultadas' ? paginaActual : paginaActualTomadas}
                            </div>
                            <button
                                onClick={() => pestañaActiva === 'consultadas' ? setPaginaActual(p => Math.min(totalPaginasConsultadas, p + 1)) : setPaginaActualTomadas(p => Math.min(totalPaginasTomadas, p + 1))}
                                disabled={pestañaActiva === 'consultadas' ? paginaActual === totalPaginasConsultadas : paginaActualTomadas === totalPaginasTomadas}
                                className="px-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    )
}

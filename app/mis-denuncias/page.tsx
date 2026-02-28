'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatearFechaSinTimezone } from '@/lib/utils/fecha'
import { MainLayout } from '@/components/MainLayout'
import { cn } from '@/lib/utils'

import { Eye, Search, Filter, FileText, Calendar, Clock, ChevronRight } from 'lucide-react'

export default function MisDenunciasPage() {
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()
  const [denuncias, setDenuncias] = useState<Denuncia[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'borrador' | 'completada'>('todos')

  const cargarDenuncias = async () => {
    if (!usuario) return

    try {
      const response = await fetch(`/api/denuncias/mias?usuario_id=${usuario.id}`, { cache: 'no-store' })
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
      cargarDenuncias()
    }
  }, [usuario])


  const verDenuncia = (id: number) => {
    router.push(`/ver-denuncia/${id}`)
  }

  const denunciasFiltradas = filtroEstado === 'todos'
    ? denuncias
    : denuncias.filter(d => d.estado === filtroEstado)

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-3 border-[#002147]/10 border-t-[#002147] rounded-full animate-spin mb-4" />
          <div className="text-[#002147] font-bold animate-pulse text-sm uppercase tracking-widest">Cargando denuncias...</div>
        </div>
      </div>
    )
  }

  if (!usuario) return null

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-8 font-sans">
        {/* Header Section */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#002147] rounded-lg shadow-lg shadow-blue-900/10">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-black text-[#002147] uppercase tracking-tight">Mis Denuncias</h1>
              </div>
              <p className="text-slate-500 font-medium text-sm">Gestiona y realiza el seguimiento de tus actas policiales registradas.</p>
            </div>

            {/* Status Tabs/Filters */}
            <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex items-center">
              <button
                onClick={() => setFiltroEstado('todos')}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                  filtroEstado === 'todos'
                    ? "bg-[#002147] text-white shadow-md"
                    : "text-slate-400 hover:text-[#002147] hover:bg-slate-50"
                )}
              >
                Todas
              </button>
              <button
                onClick={() => setFiltroEstado('completada')}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                  filtroEstado === 'completada'
                    ? "bg-green-600 text-white shadow-md"
                    : "text-slate-400 hover:text-green-600 hover:bg-green-50"
                )}
              >
                Completas
              </button>
              <button
                onClick={() => setFiltroEstado('borrador')}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                  filtroEstado === 'borrador'
                    ? "bg-amber-500 text-white shadow-md"
                    : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                )}
              >
                Borradores
              </button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">
                      Nº Acta
                    </th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">
                      Denunciante / C.I.
                    </th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">
                      Supuesto Hecho
                    </th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">
                      Fecha y Hora
                    </th>
                    <th className="px-6 py-4 text-center text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-right text-[9px] font-black text-[#002147]/50 uppercase tracking-widest border-b border-slate-100">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {denunciasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-slate-200" />
                          </div>
                          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No se encontraron registros</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    denunciasFiltradas.map((denuncia) => (
                      <tr key={denuncia.id} className="group hover:bg-blue-50/30 transition-colors duration-200">
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
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          <span
                            className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter",
                              denuncia.estado === 'completada'
                                ? "bg-green-50 text-green-600 ring-1 ring-green-500/10"
                                : "bg-amber-50 text-amber-600 ring-1 ring-amber-500/10"
                            )}
                          >
                            {denuncia.estado === 'completada' ? 'Completada' : 'Borrador'}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <button
                            onClick={() => verDenuncia(denuncia.id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-[#002147] uppercase tracking-wider shadow-sm hover:bg-[#002147] hover:text-white hover:border-[#002147] transition-all duration-200 group-hover:shadow-md"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver Detalle
                            <ChevronRight className="w-3 h-3 ml-1 opacity-50" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer / Info */}
            <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Total: {denunciasFiltradas.length} denuncias encontradas
              </p>
              <div className="flex items-center gap-2 opacity-50">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[8px] font-black uppercase text-slate-400">Sistema en línea</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

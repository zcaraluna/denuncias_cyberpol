'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/MainLayout'
import {
  ClipboardCheck,
  Calendar,
  User,
  Hash,
  Eye,
  History,
  FileText,
  ExternalLink
} from 'lucide-react'
import { formatearFechaHora } from '@/lib/utils/fecha'

interface Visita {
  id: number
  denuncia_id: number
  usuario_id: number
  fecha_visita: string
  nombre_usuario: string
  apellido_usuario: string
  grado_usuario: string
  numero_orden: number
  nombre_denunciante: string
  hash_denuncia: string
}

interface Usuario {
  id: number
  nombre: string
  apellido: string
  grado: string
  oficina: string
  rol: string
}

export default function LogVisitasPage() {
  const router = useRouter()
  const { usuario, loading: authLoading, logout } = useAuth()
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (usuario) {
      // Solo superadmin y admin pueden acceder a esta página
      if (usuario.rol !== 'superadmin' && usuario.rol !== 'admin') {
        router.push('/dashboard')
        return
      }
      cargarVisitas()
    }
  }, [usuario, router])

  const cargarVisitas = async () => {
    try {
      const response = await fetch('/api/registro-actividad')
      if (!response.ok) throw new Error('Error al cargar visitas')

      const data = await response.json()
      setVisitas(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }


  const formatearFecha = (fecha: string) => {
    // La fecha ya viene corregida desde el servidor (con 3 horas restadas)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  if (!usuario) {
    return null
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto mb-8">
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 md:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 z-0 opacity-50"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="p-4 bg-[#002147] rounded-2xl shadow-lg shadow-blue-900/10 shrink-0">
                  <History className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-[#002147] leading-tight">Registro de Auditoría</h1>
                  <p className="text-slate-500 font-medium mt-1">
                    Historial detallado de accesos y consultas realizadas a las denuncias del sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {visitas.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/60 p-12 text-center shadow-sm">
              <div className="inline-flex p-4 bg-slate-50 rounded-2xl text-slate-300 mb-4">
                <ClipboardCheck className="h-10 w-10" />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No hay visitas registradas</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="bg-slate-50/50 text-left border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          FECHA Y HORA
                        </div>
                      </th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          USUARIO
                        </div>
                      </th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          DENUNCIA
                        </div>
                      </th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right">
                        ACCIONES
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {visitas.map((visita) => (
                      <tr key={visita.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-4 whitespace-nowrap">
                          <p className="text-sm font-black text-[#002147]">
                            {formatearFechaHora(visita.fecha_visita)}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-700 uppercase">{visita.grado_usuario} {visita.nombre_usuario} {visita.apellido_usuario}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="text-sm font-black text-[#002147] flex items-center gap-2">
                              <span className="text-blue-600">ID #{visita.numero_orden}</span>
                              <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                              <span>{visita.nombre_denunciante}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Hash className="h-2.5 w-2.5 text-slate-300" />
                              <span className="text-[10px] font-mono text-slate-400 tracking-tighter">{visita.hash_denuncia}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap text-right">
                          <Link
                            href={`/ver-denuncia/${visita.denuncia_id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                          >
                            <Eye className="h-3 w-3" />
                            DETALLES
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}


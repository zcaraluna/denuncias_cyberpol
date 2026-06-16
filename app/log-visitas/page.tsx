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
  Key,
  ShieldAlert,
  Building
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
  oficina_usuario: string
  numero_orden: number
  nombre_denunciante: string
  hash_denuncia: string
}

interface AccionAuditoria {
  id: number
  usuario_realizador_id: number
  usuario_afectado_id: number
  accion: string
  detalle: string
  fecha_accion: string
  nombre_realizador: string
  apellido_realizador: string
  grado_realizador: string
  oficina_realizador: string
  nombre_afectado: string
  apellido_afectado: string
  grado_afectado: string
  oficina_afectado: string
  usuario_afectado: string
}

export default function LogVisitasPage() {
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [acciones, setAcciones] = useState<AccionAuditoria[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAcciones, setLoadingAcciones] = useState(false)
  const [pestañaActiva, setPestañaActiva] = useState<'visitas' | 'acciones'>('visitas')

  useEffect(() => {
    if (usuario) {
      // Solo superadmin, admin y supervisor pueden acceder a esta página
      if (
        usuario.rol !== 'superadmin' &&
        usuario.rol !== 'admin' &&
        usuario.rol !== 'supervisor'
      ) {
        router.push('/dashboard')
        return
      }
      cargarVisitas()
    }
  }, [usuario, router])

  useEffect(() => {
    if (usuario && usuario.rol === 'superadmin' && pestañaActiva === 'acciones' && acciones.length === 0) {
      cargarAcciones()
    }
  }, [pestañaActiva, usuario, acciones.length])

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

  const cargarAcciones = async () => {
    setLoadingAcciones(true)
    try {
      const response = await fetch('/api/registro-actividad/acciones')
      if (!response.ok) throw new Error('Error al cargar logs de acciones')

      const data = await response.json()
      setAcciones(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoadingAcciones(false)
    }
  }

  const esSuperadmin = usuario?.rol === 'superadmin'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-3 border-[#002147]/10 border-t-[#002147] rounded-full animate-spin mb-4" />
          <div className="text-[#002147] font-bold animate-pulse text-sm uppercase tracking-widest">Cargando auditoría...</div>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return null
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
        {/* Cabecera */}
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
                  <p className="text-slate-500 font-medium mt-1 text-sm">
                    {usuario.rol === 'supervisor'
                      ? `Historial detallado de consultas de denuncias realizadas por el personal de la oficina de ${usuario.oficina}.`
                      : 'Historial detallado de accesos y consultas de seguridad realizadas en el sistema.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pestanas (Pestaña 2 visible solo para superadmin) */}
        {esSuperadmin && (
          <div className="max-w-7xl mx-auto mb-6">
            <div className="flex p-1 bg-slate-100 rounded-2xl w-fit border border-slate-200">
              <button
                onClick={() => setPestañaActiva('visitas')}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  pestañaActiva === 'visitas' ? 'bg-white text-[#002147] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Accesos a Denuncias
              </button>
              <button
                onClick={() => setPestañaActiva('acciones')}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  pestañaActiva === 'acciones' ? 'bg-white text-[#002147] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Restauración de Claves
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Accesos a Denuncias */}
        {pestañaActiva === 'visitas' && (
          <div className="max-w-7xl mx-auto">
            {visitas.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/60 p-12 text-center shadow-sm">
                <div className="inline-flex p-4 bg-slate-50 rounded-2xl text-slate-300 mb-4">
                  <ClipboardCheck className="h-10 w-10" />
                </div>
                <p className="text-slate-400 font-black uppercase tracking-widest text-sm">
                  No hay visitas registradas
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden mb-20 md:mb-0">
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
                            USUARIO / ORIGEN
                          </div>
                        </th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            DENUNCIA CONSULTADA
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
                              <span className="text-xs font-black text-slate-700 uppercase">
                                {visita.grado_usuario} {visita.nombre_usuario} {visita.apellido_usuario}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide flex items-center gap-1 mt-0.5">
                                <Building className="h-2.5 w-2.5" />
                                {visita.oficina_usuario || 'Asunción'}
                              </span>
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
                                <span className="text-[10px] font-mono text-slate-400 tracking-tighter">
                                  {visita.hash_denuncia}
                                </span>
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
        )}

        {/* Tab 2: Restauraciones de Claves (Solo Superadmin) */}
        {pestañaActiva === 'acciones' && esSuperadmin && (
          <div className="max-w-7xl mx-auto">
            {loadingAcciones ? (
              <div className="bg-white rounded-3xl border border-slate-200/60 p-16 text-center shadow-sm">
                <div className="w-8 h-8 border-3 border-[#002147]/10 border-t-[#002147] rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                  Cargando logs de seguridad...
                </p>
              </div>
            ) : acciones.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/60 p-12 text-center shadow-sm">
                <div className="inline-flex p-4 bg-slate-50 rounded-2xl text-slate-300 mb-4">
                  <ShieldAlert className="h-10 w-10" />
                </div>
                <p className="text-slate-400 font-black uppercase tracking-widest text-sm">
                  No hay restauraciones de claves registradas
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden mb-20 md:mb-0">
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
                          REALIZADOR (SUPERVISOR / ADMIN)
                        </th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                          AFECTADO (FUNCIONARIO)
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                          DETALLE DEL EVENTO
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {acciones.map((accion) => (
                        <tr key={accion.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-4 whitespace-nowrap">
                            <p className="font-black text-[#002147]">
                              {formatearFechaHora(accion.fecha_accion)}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-700 uppercase">
                                {accion.grado_realizador} {accion.nombre_realizador} {accion.apellido_realizador}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide flex items-center gap-1 mt-0.5">
                                <Building className="h-2.5 w-2.5" />
                                {accion.oficina_realizador}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-700 uppercase">
                                {accion.grado_afectado} {accion.nombre_afectado} {accion.apellido_afectado}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide flex items-center gap-1">
                                  <Building className="h-2.5 w-2.5" />
                                  {accion.oficina_afectado}
                                </span>
                                <span className="text-[8px] font-mono bg-slate-100 text-slate-500 px-1 py-0.2 rounded">
                                  {accion.usuario_afectado}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-4 font-medium text-slate-500 leading-normal max-w-xs sm:max-w-md">
                            {accion.detalle}
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
    </MainLayout>
  )
}

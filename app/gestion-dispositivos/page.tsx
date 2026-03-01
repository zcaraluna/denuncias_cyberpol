'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/MainLayout'
import {
  Monitor,
  Key,
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Activity,
  Globe,
  Ban,
  Fingerprint,
  Plus
} from 'lucide-react'

interface Usuario {
  id: number
  usuario: string
  nombre: string
  apellido: string
  grado: string
  oficina: string
  rol: string
  activo: boolean
}

interface Dispositivo {
  id: number
  fingerprint: string
  nombre: string | null
  user_agent: string | null
  ip_address: string | null
  autorizado_en: string
  ultimo_acceso: string
  activo: boolean
  codigo_activacion: string | null
  codigo_usado: boolean | null
  codigo_expira_en: string | null
  codigo_activo: boolean | null
}

interface Codigo {
  id: number
  codigo: string
  nombre: string | null
  usado: boolean
  usado_en: string | null
  dispositivo_fingerprint: string | null
  creado_en: string
  expira_en: string | null
  activo: boolean
  dias_restantes: number | null
  esta_expirado: boolean
}

export default function GestionDispositivosPage() {
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
  const [codigos, setCodigos] = useState<Codigo[]>([])
  const [loading, setLoading] = useState(true)
  const [tabActivo, setTabActivo] = useState<'dispositivos' | 'codigos'>('dispositivos')

  useEffect(() => {
    if (usuario) {
      // Solo superadmin puede acceder a esta página
      if (usuario.rol !== 'superadmin') {
        router.push('/dashboard')
        return
      }
      cargarDatos()
    }
  }, [usuario, router])

  const cargarDatos = async () => {
    if (!usuario) return

    try {
      const response = await fetch(`/api/dispositivos?usuario_id=${usuario.id}&usuario_rol=${usuario.rol}`)
      if (!response.ok) throw new Error('Error al cargar datos')

      const data = await response.json()
      setDispositivos(data.dispositivos)
      setCodigos(data.codigos)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (usuario && usuario.rol === 'superadmin') {
      cargarDatos()
    }
  }, [usuario])

  const handleDesactivar = async (tipo: 'dispositivo' | 'codigo', id: number) => {
    const nombreTipo = tipo === 'dispositivo' ? 'dispositivo' : 'código'
    if (!confirm(`¿Está seguro de que desea desactivar este ${nombreTipo}?`)) {
      return
    }

    if (!usuario) return

    try {
      const response = await fetch('/api/dispositivos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, id, usuario_rol: usuario.rol })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || `Error al desactivar ${nombreTipo}`)
        return
      }

      alert(`${nombreTipo.charAt(0).toUpperCase() + nombreTipo.slice(1)} desactivado exitosamente`)
      cargarDatos()
    } catch (error) {
      console.error('Error:', error)
      alert(`Error al desactivar ${nombreTipo}`)
    }
  }

  const handleGenerarCodigo = async () => {
    if (!usuario) return
    const nombre = prompt('Ingrese un nombre o etiqueta para este código (opcional):') || 'ADMIN_GEN'

    try {
      const response = await fetch('/api/dispositivos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'generar_codigo',
          id: nombre,
          usuario_rol: usuario.rol
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Error al generar código')
        return
      }

      alert(`Código generado exitosamente: ${formatearCodigo(data.codigo)}`)
      setTabActivo('codigos')
      cargarDatos()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al generar código')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('usuario')
    router.push('/')
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-PY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatearCodigo = (codigo: string) => {
    // Formatear código con guiones cada 4 caracteres
    return codigo.match(/.{1,4}/g)?.join('-') || codigo
  }

  const obtenerEstadoCodigo = (codigo: Codigo) => {
    if (!codigo.activo) return { texto: 'Desactivado', className: 'bg-red-100 text-red-800' }
    if (codigo.usado) return { texto: 'Usado', className: 'bg-gray-100 text-gray-800' }
    if (codigo.esta_expirado) return { texto: 'Expirado', className: 'bg-orange-100 text-orange-800' }
    if (codigo.dias_restantes !== null) {
      if (codigo.dias_restantes <= 7) return { texto: `Expira en ${codigo.dias_restantes} días`, className: 'bg-yellow-100 text-yellow-800' }
      return { texto: `Válido (${codigo.dias_restantes} días)`, className: 'bg-green-100 text-green-800' }
    }
    return { texto: 'Válido', className: 'bg-green-100 text-green-800' }
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
                  <Monitor className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-[#002147] leading-tight text-balance">Gestión de Dispositivos y Códigos</h1>
                  <p className="text-slate-500 font-medium mt-1">
                    Administre los terminales autorizados y gestione los accesos de seguridad a la red.
                  </p>
                </div>
              </div>

              {(usuario?.usuario === 'garv' || usuario?.rol === 'superadmin') && (
                <button
                  onClick={handleGenerarCodigo}
                  className="flex items-center gap-2 px-6 py-3 bg-[#002147] text-white rounded-2xl hover:bg-[#003366] transition-all shadow-lg shadow-blue-900/10 font-black text-sm"
                >
                  <Plus className="h-4 w-4" />
                  GENERAR CÓDIGO
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Modernos */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex p-1 bg-slate-100 rounded-2xl w-fit border border-slate-200">
            <button
              onClick={() => setTabActivo('dispositivos')}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tabActivo === 'dispositivos'
                ? 'bg-white text-[#002147] shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Terminales Autorizados ({dispositivos.length})
            </button>
            <button
              onClick={() => setTabActivo('codigos')}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tabActivo === 'codigos'
                ? 'bg-white text-[#002147] shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <Key className="h-3.5 w-3.5" />
              Códigos Generados ({codigos.length})
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Contenido Dispositivos */}
          {tabActivo === 'dispositivos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dispositivos.length === 0 ? (
                <div className="col-span-full bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">No hay dispositivos autorizados bajo este perfil</p>
                </div>
              ) : (
                dispositivos.map((dispositivo) => (
                  <div key={dispositivo.id} className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className={`p-3 rounded-2xl ${dispositivo.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                        <Smartphone className="h-6 w-6" />
                      </div>
                      {dispositivo.activo && (
                        <button
                          onClick={() => handleDesactivar('dispositivo', dispositivo.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Revocar acceso"
                        >
                          <Ban className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    <div className="relative z-10">
                      <h3 className="text-lg font-black text-[#002147] uppercase truncate pr-8">
                        {dispositivo.nombre || 'Terminal Desconocido'}
                      </h3>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Fingerprint className="h-3.5 w-3.5 opacity-50" />
                          <span className="text-[10px] font-mono tracking-tighter truncate opacity-75">{dispositivo.fingerprint}</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2 border-t border-slate-50 pt-3 mt-3">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Última IP registrada</span>
                            <div className="flex items-center gap-1.5 font-bold text-slate-600 text-xs">
                              <Globe className="h-3 w-3" />
                              {dispositivo.ip_address || '---'}
                            </div>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Última Actividad</span>
                            <div className="flex items-center gap-1.5 font-bold text-slate-600 text-xs">
                              <Clock className="h-3 w-3" />
                              {new Date(dispositivo.ultimo_acceso).toLocaleDateString('es-PY')} a las {new Date(dispositivo.ultimo_acceso).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                          <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${dispositivo.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                            }`}>
                            {dispositivo.activo ? <ShieldCheck className="h-2.5 w-2.5" /> : <ShieldAlert className="h-2.5 w-2.5" />}
                            {dispositivo.activo ? 'ACCESO VÁLIDO' : 'DEBAJA'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
                ))}
            </div>
          )}

          {/* Contenido Códigos */}
          {tabActivo === 'codigos' && (
            <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="bg-slate-50/50 text-left border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificador</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Creación / Expiración</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {codigos.length === 0 ? (
                      <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 uppercase font-black text-[10px] tracking-widest italic">No existen códigos pendientes de uso</td></tr>
                    ) : (
                      codigos.map((codigo) => {
                        const estado = obtenerEstadoCodigo(codigo)
                        return (
                          <tr key={codigo.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-4 whitespace-nowrap">
                              <span className="text-sm font-black text-[#002147] font-mono tracking-widest bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 shadow-inner">
                                {formatearCodigo(codigo.codigo)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-xs font-bold text-slate-600 uppercase">{codigo.nombre || '---'}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center w-fit gap-1.5 ${estado.className.includes('bg-green') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                estado.className.includes('bg-orange') ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                  'bg-slate-50 text-slate-500 border-slate-100'
                                }`}>
                                <Activity className="h-2.5 w-2.5" />
                                {estado.texto}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-[10px]">
                              <div className="flex flex-col gap-1 font-bold">
                                <div className="flex items-center gap-1.5 text-slate-400">
                                  <Plus className="h-2.5 w-2.5" />
                                  <span>{new Date(codigo.creado_en).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-orange-400">
                                  <Clock className="h-2.5 w-2.5" />
                                  <span>{codigo.expira_en ? new Date(codigo.expira_en).toLocaleDateString() : 'SIN EXPIRACIÓN'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-4 whitespace-nowrap text-right">
                              {codigo.activo && !codigo.usado && (
                                <button
                                  onClick={() => handleDesactivar('codigo', codigo.id)}
                                  className="text-[10px] font-black text-red-500 uppercase tracking-widest px-3 py-2 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                >
                                  DESACTIVAR
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
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


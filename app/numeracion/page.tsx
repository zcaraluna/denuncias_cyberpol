'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/MainLayout'
import { ACTIVE_OFFICES } from '@/lib/data/oficinas'
import { Hash, Loader2, Save, Trash2, AlertTriangle, Building2 } from 'lucide-react'

interface BaseNumeracion {
  id: number
  oficina: string
  anio: number
  ultimo_orden_previo: number
  nota: string | null
  creado_en: string
  actualizado_en: string
}

const ROLES_PERMITIDOS = ['developer', 'superadmin']

export default function NumeracionPage() {
  const router = useRouter()
  const { usuario, loading } = useAuth()
  const permitido = usuario ? ROLES_PERMITIDOS.includes(usuario.rol) : false

  const [registros, setRegistros] = useState<BaseNumeracion[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const anioActual = new Date().getFullYear()
  const [oficina, setOficina] = useState('')
  const [anio, setAnio] = useState(anioActual)
  const [ultimoOrdenPrevio, setUltimoOrdenPrevio] = useState<string>('')
  const [nota, setNota] = useState('')

  useEffect(() => {
    if (!loading && usuario && !permitido) {
      router.replace('/inicio')
    }
  }, [loading, usuario, permitido, router])

  const cargar = async () => {
    try {
      const res = await fetch('/api/numeracion-base', { cache: 'no-store' })
      if (!res.ok) throw new Error()
      setRegistros(await res.json())
    } catch {
      setRegistros([])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (permitido) cargar()
  }, [permitido])

  const guardar = async () => {
    setMensaje(null)
    const previo = parseInt(ultimoOrdenPrevio, 10)
    if (!oficina) {
      setMensaje({ tipo: 'error', texto: 'Seleccione una oficina.' })
      return
    }
    if (!Number.isInteger(previo) || previo < 0) {
      setMensaje({ tipo: 'error', texto: 'El número de la última acta previa debe ser un entero mayor o igual a 0.' })
      return
    }

    setGuardando(true)
    try {
      const res = await fetch('/api/numeracion-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oficina, anio, ultimoOrdenPrevio: previo, nota }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error al guardar')
      setMensaje({ tipo: 'ok', texto: `Guardado. La próxima acta de ${oficina} será #${previo + 1}/${anio}.` })
      setUltimoOrdenPrevio('')
      setNota('')
      await cargar()
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e?.message || 'Error al guardar' })
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id: number, oficinaNombre: string, anioReg: number) => {
    if (!confirm(`¿Eliminar el offset de ${oficinaNombre} (${anioReg})? La numeración volvería a arrancar desde 1.`)) return
    try {
      const res = await fetch(`/api/numeracion-base?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await cargar()
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo eliminar.' })
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </MainLayout>
    )
  }
  if (usuario && !permitido) return null

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Encabezado */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#002147] flex items-center justify-center text-white">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-[#002147]">Numeración de Actas por Oficina</h1>
              <p className="text-xs text-slate-500">Número de arranque para oficinas que se incorporan a mitad de año</p>
            </div>
          </div>

          {/* Explicación */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 mb-6 mt-4">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[12px] text-amber-800 leading-relaxed">
              Indique <strong>cuántas actas ya existían fuera del sistema</strong> (en papel) para esa oficina y año.
              La primera denuncia cargada recibirá ese número <strong>+ 1</strong>. Configure esto <strong>antes</strong> de
              habilitar los usuarios de la oficina, para no duplicar la numeración. Una oficina sin configuración arranca desde 1.
            </p>
          </div>

          {/* Formulario */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Oficina</label>
                <select
                  value={oficina}
                  onChange={(e) => setOficina(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-[#002147] focus:bg-white focus:border-blue-200 outline-none"
                >
                  <option value="">— Seleccione —</option>
                  {ACTIVE_OFFICES.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Año</label>
                <input
                  type="number"
                  value={anio}
                  min={2000}
                  max={2100}
                  onChange={(e) => setAnio(parseInt(e.target.value, 10) || anioActual)}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-[#002147] focus:bg-white focus:border-blue-200 outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Última acta previa (en papel)</label>
                <input
                  type="number"
                  value={ultimoOrdenPrevio}
                  min={0}
                  placeholder="Ej: 108"
                  onChange={(e) => setUltimoOrdenPrevio(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-[#002147] focus:bg-white focus:border-blue-200 outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nota (opcional)</label>
                <input
                  type="text"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Ej: migración del nodo CDE"
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-[#002147] focus:bg-white focus:border-blue-200 outline-none"
                />
              </div>
            </div>

            {ultimoOrdenPrevio && Number.isInteger(parseInt(ultimoOrdenPrevio, 10)) && parseInt(ultimoOrdenPrevio, 10) >= 0 && oficina && (
              <p className="mt-3 text-[12px] font-bold text-[#002147]">
                → La próxima acta de {oficina} será <span className="text-blue-600">#{parseInt(ultimoOrdenPrevio, 10) + 1}/{anio}</span>
              </p>
            )}

            {mensaje && (
              <p className={`mt-3 text-[12px] font-semibold ${mensaje.tipo === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                {mensaje.texto}
              </p>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={guardar}
                disabled={guardando}
                className="flex items-center gap-2 px-5 py-2 text-[10px] font-black text-white bg-[#002147] uppercase tracking-widest rounded-lg hover:bg-[#003366] disabled:opacity-50 shadow-md transition-all"
              >
                {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Guardar
              </button>
            </div>
          </div>

          {/* Lista de configuraciones */}
          <h2 className="text-[10px] font-black text-[#002147] uppercase tracking-widest mb-2">Configuraciones actuales</h2>
          {cargando ? (
            <div className="flex items-center justify-center h-24 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : registros.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">Ninguna oficina tiene un offset configurado (todas arrancan desde 1).</p>
          ) : (
            <div className="space-y-2">
              {registros.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Building2 className="w-4 h-4 text-[#002147] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-[#002147] truncate">
                        {r.oficina} <span className="text-slate-400 font-bold">· {r.anio}</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Actas previas: <strong>{r.ultimo_orden_previo}</strong> → próxima: <strong className="text-blue-600">#{r.ultimo_orden_previo + 1}/{r.anio}</strong>
                        {r.nota ? <span className="text-slate-400"> · {r.nota}</span> : null}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => eliminar(r.id, r.oficina, r.anio)}
                    className="shrink-0 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Eliminar (vuelve a arrancar desde 1)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

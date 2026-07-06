'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/MainLayout'
import { formatNombrePolicial } from '@/lib/utils'
import { Activity, Clock, MapPin, FileText, Loader2, Radio } from 'lucide-react'

interface Presencia {
  usuarioId: number
  usuario: string
  nombre: string
  apellido: string
  grado: string
  oficina: string
  paso: number
  pasoLabel: string
  tipoFormulario: string | null
  borradorId: number | null
  horaInicio: string | null
  fechaInicio: string | null
  inicioEn: number
  actualizadoEn: number
}

const TOTAL_PASOS = 3

function transcurrido(desde: number, ahora: number): string {
  const seg = Math.max(0, Math.floor((ahora - desde) / 1000))
  const m = Math.floor(seg / 60)
  const s = seg % 60
  if (m <= 0) return `${s}s`
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

export default function MonitoreoPage() {
  const router = useRouter()
  const { usuario, loading } = useAuth()
  const [presencias, setPresencias] = useState<Presencia[]>([])
  const [conectado, setConectado] = useState(false)
  const [ahora, setAhora] = useState(() => Date.now())
  const esDeveloper = usuario?.rol === 'developer'
  const esRef = useRef(esDeveloper)
  esRef.current = esDeveloper

  // Redirigir si no es developer
  useEffect(() => {
    if (!loading && usuario && usuario.rol !== 'developer') {
      router.replace('/inicio')
    }
  }, [loading, usuario, router])

  // Reloj para las duraciones (cada segundo)
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Conexión SSE
  useEffect(() => {
    if (loading || !esDeveloper) return

    const es = new EventSource('/api/presencia/stream', { withCredentials: true })

    es.addEventListener('presencias', (e) => {
      try {
        setPresencias(JSON.parse((e as MessageEvent).data))
      } catch {
        // ignorar payload inválido
      }
    })
    es.onopen = () => setConectado(true)
    es.onerror = () => setConectado(false)

    return () => es.close()
  }, [loading, esDeveloper])

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </MainLayout>
    )
  }

  if (usuario && usuario.rol !== 'developer') {
    return null
  }

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Encabezado */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#002147] flex items-center justify-center text-white">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-black text-[#002147]">Monitoreo en Tiempo Real</h1>
                <p className="text-xs text-slate-500">Operadores tomando denuncias en este momento</p>
              </div>
            </div>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${
                conectado ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${conectado ? 'animate-pulse' : ''}`} />
              {conectado ? 'EN VIVO' : 'Conectando…'}
            </div>
          </div>

          {/* Contador */}
          <div className="mb-4 text-sm font-semibold text-slate-600">
            {presencias.length === 0
              ? 'Ningún operador está tomando una denuncia ahora mismo.'
              : `${presencias.length} operador${presencias.length === 1 ? '' : 'es'} activo${
                  presencias.length === 1 ? '' : 's'
                }`}
          </div>

          {/* Lista de presencias */}
          <div className="grid gap-3 sm:grid-cols-2">
            {presencias.map((p) => (
              <div
                key={p.usuarioId}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-black text-[#002147] text-sm truncate">
                      {formatNombrePolicial(p.grado, p.nombre, p.apellido)}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {p.oficina || 'Sin oficina'}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-blue-50 text-[#002147]">
                    {p.tipoFormulario === 'extravio' ? 'Extravío' : 'Hecho Punible'}
                  </span>
                </div>

                {/* Paso actual */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      Paso {p.paso} de {TOTAL_PASOS}: <span className="text-[#002147]">{p.pasoLabel}</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#002147] rounded-full transition-all duration-500"
                      style={{ width: `${(p.paso / TOTAL_PASOS) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Pie: hora y duración */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-50">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Hora denuncia: <strong className="text-slate-700">{p.horaInicio || '—'}</strong>
                  </span>
                  <span className="text-slate-400">activo hace {transcurrido(p.inicioEn, ahora)}</span>
                </div>
              </div>
            ))}
          </div>

          {presencias.length === 0 && (
            <div className="mt-6 flex flex-col items-center justify-center py-16 text-slate-300">
              <Activity className="w-12 h-12 mb-3" />
              <p className="text-sm font-semibold text-slate-400">Sin actividad en este momento</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

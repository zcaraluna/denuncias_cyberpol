'use client'

import { useEffect, useState, use as usePromise } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/MainLayout'
import { diffWords } from 'diff'
import { ArrowLeft, History, GitCompare } from 'lucide-react'

interface VersionEntry {
  id: number
  version_numero: number
  snapshot: any
  motivo: string
  editado_por: number | null
  editor_nombre: string | null
  creado_en: string | null
  actual: boolean
}

interface CampoDiff {
  key: string
  label: string
  valorA: any
  valorB: any
  esTextoLargo: boolean
}

// Campos relevantes a comparar, en el orden en que se muestran cuando difieren.
const CAMPOS_DENUNCIA: Array<{ key: string; label: string; largo?: boolean }> = [
  { key: 'tipo_denuncia', label: 'Tipo de denuncia' },
  { key: 'otro_tipo', label: 'Otro tipo (especificado)' },
  { key: 'grado_ejecucion', label: 'Grado de ejecución' },
  { key: 'relato', label: 'Relato', largo: true },
  { key: 'lugar_hecho', label: 'Lugar del hecho' },
  { key: 'lugar_hecho_no_aplica', label: 'Lugar del hecho — no aplica' },
  { key: 'fecha_hecho', label: 'Fecha del hecho' },
  { key: 'hora_hecho', label: 'Hora del hecho' },
  { key: 'fecha_hecho_fin', label: 'Fecha del hecho (fin de rango)' },
  { key: 'hora_hecho_fin', label: 'Hora del hecho (fin de rango)' },
  { key: 'monto_dano', label: 'Monto del daño' },
  { key: 'moneda', label: 'Moneda' },
  { key: 'entidad_bancaria_vulnerada', label: 'Entidad bancaria vulnerada' },
  { key: 'bancos_relacionados', label: 'Bancos relacionados' },
  { key: 'objetos_extraviados', label: 'Objetos extraviados', largo: true },
  { key: 'adjuntos_urls', label: 'Adjuntos' },
  { key: 'archivo_denuncia_url', label: 'Documento de denuncia' },
]

const CAMPOS_DENUNCIANTE: Array<{ key: string; label: string }> = [
  { key: 'nombres', label: 'Denunciante — Nombres' },
  { key: 'cedula', label: 'Denunciante — Documento' },
  { key: 'tipo_documento', label: 'Denunciante — Tipo de documento' },
  { key: 'nacionalidad', label: 'Denunciante — Nacionalidad' },
  { key: 'estado_civil', label: 'Denunciante — Estado civil' },
  { key: 'edad', label: 'Denunciante — Edad' },
  { key: 'domicilio', label: 'Denunciante — Domicilio' },
  { key: 'telefono', label: 'Denunciante — Teléfono' },
  { key: 'correo', label: 'Denunciante — Correo' },
  { key: 'profesion', label: 'Denunciante — Profesión' },
]

const CAMPOS_AUTOR: Array<{ key: string; label: string; largo?: boolean }> = [
  { key: 'autor_conocido', label: 'Autor — Conocido/Desconocido' },
  { key: 'nombre_autor', label: 'Autor — Nombre' },
  { key: 'cedula_autor', label: 'Autor — Documento' },
  { key: 'domicilio_autor', label: 'Autor — Domicilio' },
  { key: 'descripcion_fisica', label: 'Autor — Descripción física', largo: true },
]

function obtenerPrincipal(snapshot: any): any {
  const involucrados = snapshot?.involucrados || []
  return involucrados.find((i: any) => i.rol === 'principal') || {}
}

function obtenerAutor(snapshot: any): any {
  const autores = snapshot?.supuestos_autores || []
  return autores[0] || {}
}

function valorLegible(v: any): string {
  if (v === null || v === undefined || v === '') return '(vacío)'
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (Array.isArray(v)) return v.length > 0 ? v.join(', ') : '(vacío)'
  return String(v)
}

function calcularDiferencias(snapshotA: any, snapshotB: any): CampoDiff[] {
  const diferencias: CampoDiff[] = []
  const dA = snapshotA?.denuncia || {}
  const dB = snapshotB?.denuncia || {}
  const denA = obtenerPrincipal(snapshotA)
  const denB = obtenerPrincipal(snapshotB)
  const autA = obtenerAutor(snapshotA)
  const autB = obtenerAutor(snapshotB)

  const revisar = (campos: typeof CAMPOS_DENUNCIA, objA: any, objB: any) => {
    for (const campo of campos) {
      const valorA = objA?.[campo.key]
      const valorB = objB?.[campo.key]
      if (JSON.stringify(valorA) !== JSON.stringify(valorB)) {
        diferencias.push({
          key: campo.key,
          label: campo.label,
          valorA,
          valorB,
          esTextoLargo: Boolean(campo.largo),
        })
      }
    }
  }

  revisar(CAMPOS_DENUNCIA, dA, dB)
  revisar(CAMPOS_DENUNCIANTE, denA, denB)
  revisar(CAMPOS_AUTOR, autA, autB)

  return diferencias
}

function DiffTexto({ anterior, nuevo }: { anterior: string; nuevo: string }) {
  const partes = diffWords(anterior || '', nuevo || '')
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap">
      {partes.map((parte, idx) => {
        if (parte.added) {
          return (
            <span key={idx} className="bg-emerald-100 text-emerald-800 rounded px-0.5">
              {parte.value}
            </span>
          )
        }
        if (parte.removed) {
          return (
            <span key={idx} className="bg-red-100 text-red-700 line-through rounded px-0.5">
              {parte.value}
            </span>
          )
        }
        return <span key={idx}>{parte.value}</span>
      })}
    </p>
  )
}

function etiquetaVersion(v: VersionEntry): string {
  if (v.actual) return `ACTUAL (estado vigente)`
  const motivo = v.motivo === 'EDICION_EXTRAORDINARIA' ? 'edición extraordinaria' : 'período de gracia'
  const fecha = v.creado_en ? new Date(v.creado_en).toLocaleString('es-PY') : ''
  return `Versión ${v.version_numero} — ${motivo} — ${fecha}${v.editor_nombre ? ` — ${v.editor_nombre}` : ''}`
}

export default function VersionesDenunciaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params)
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()
  const [versiones, setVersiones] = useState<VersionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [indiceA, setIndiceA] = useState(0)
  const [indiceB, setIndiceB] = useState(0)

  useEffect(() => {
    if (authLoading || !usuario) return
    const fetchVersiones = async () => {
      try {
        const res = await fetch(`/api/denuncias/${id}/versiones`)
        if (!res.ok) throw new Error('No se pudo obtener el historial de versiones')
        const data = await res.json()
        setVersiones(data.versiones || [])
        if (data.versiones && data.versiones.length > 0) {
          // Por defecto: comparar la versión más antigua contra la actual.
          setIndiceA(0)
          setIndiceB(data.versiones.length - 1)
        }
      } catch (e) {
        console.error(e)
        setError('No se pudo cargar el historial de versiones.')
      } finally {
        setLoading(false)
      }
    }
    fetchVersiones()
  }, [id, usuario, authLoading])

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002147]" />
      </div>
    )
  }

  const versionA = versiones[indiceA]
  const versionB = versiones[indiceB]
  const diferencias = versionA && versionB ? calcularDiferencias(versionA.snapshot, versionB.snapshot) : []
  const soloVersionActual = versiones.length <= 1

  return (
    <MainLayout>
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        <button
          onClick={() => router.push(`/ver-denuncia/${id}`)}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#002147] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la denuncia
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-[#002147]/5 rounded-xl text-[#002147]">
            <History className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-black text-[#002147] tracking-tight uppercase">Historial de versiones</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 mb-6 text-sm font-semibold">
            {error}
          </div>
        )}

        {soloVersionActual && !error && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center text-slate-500 font-semibold text-sm">
            Esta denuncia no registra ediciones — no hay versiones anteriores para comparar.
          </div>
        )}

        {!soloVersionActual && (
          <>
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 mb-8">
              <div className="flex items-center gap-2 mb-4 text-[#002147]">
                <GitCompare className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">Comparar versiones</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Versión A</label>
                  <select
                    value={indiceA}
                    onChange={(e) => setIndiceA(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-[#002147] outline-none"
                  >
                    {versiones.map((v, idx) => (
                      <option key={v.id} value={idx}>{etiquetaVersion(v)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Versión B</label>
                  <select
                    value={indiceB}
                    onChange={(e) => setIndiceB(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-[#002147] outline-none"
                  >
                    {versiones.map((v, idx) => (
                      <option key={v.id} value={idx}>{etiquetaVersion(v)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="h-2 bg-[#002147]" />
              <div className="p-6 md:p-8">
                <h2 className="text-sm font-black text-[#002147] uppercase tracking-widest mb-6">
                  Diferencias encontradas ({diferencias.length})
                </h2>

                {diferencias.length === 0 && (
                  <p className="text-sm text-slate-400 font-semibold">No hay diferencias entre las versiones seleccionadas.</p>
                )}

                <div className="space-y-6">
                  {diferencias.map((dif) => (
                    <div key={dif.key} className="border-b border-slate-100 pb-6 last:border-b-0 last:pb-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{dif.label}</p>
                      {dif.esTextoLargo ? (
                        <DiffTexto anterior={valorLegible(dif.valorA)} nuevo={valorLegible(dif.valorB)} />
                      ) : (
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="bg-red-100 text-red-700 line-through rounded px-2 py-0.5 font-medium">
                            {valorLegible(dif.valorA)}
                          </span>
                          <span className="text-slate-300">→</span>
                          <span className="bg-emerald-100 text-emerald-800 rounded px-2 py-0.5 font-medium">
                            {valorLegible(dif.valorB)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}

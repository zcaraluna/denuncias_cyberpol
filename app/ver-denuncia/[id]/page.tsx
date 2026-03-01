'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/MainLayout'
import { formatearFechaSinTimezone } from '@/lib/utils/fecha'
import {
  ArrowLeft,
  User,
  FileText,
  MapPin,
  Clock,
  Trash2,
  Download,
  Plus,
  Hash,
  Gavel,
  AlertCircle,
  Shield,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  Briefcase,
  Map,
  BadgeAlert
} from 'lucide-react'

interface Ampliacion {
  id: number
  numero_ampliacion: number
  relato: string
  fecha_ampliacion: string
  hora_ampliacion: string
  operador_grado: string
  operador_nombre: string
  operador_apellido: string
}

interface DenunciaCompleta {
  id: number
  nombres_denunciante: string
  cedula: string
  tipo_documento: string
  nacionalidad: string
  estado_civil: string
  edad: number
  fecha_nacimiento: string
  lugar_nacimiento: string
  domicilio: string | null
  telefono: string
  correo: string | null
  profesion: string
  fecha_denuncia: string
  hora_denuncia: string
  fecha_hecho: string
  hora_hecho: string
  tipo_denuncia: string
  otro_tipo: string
  relato: string
  lugar_hecho: string
  latitud: number
  longitud: number
  orden: number
  operador_grado: string
  operador_nombre: string
  operador_apellido: string
  monto_dano: number
  moneda: string
  hash: string
  estado: string
  supuestos_autores: Array<{
    autor_conocido: string
    nombre_autor: string | null
    cedula_autor: string | null
    domicilio_autor: string | null
    nacionalidad_autor: string | null
    estado_civil_autor: string | null
    edad_autor: number | null
    fecha_nacimiento_autor: string | null
    lugar_nacimiento_autor: string | null
    telefono_autor: string | null
    profesion_autor: string | null
    telefonos_involucrados: string | null
    numero_cuenta_beneficiaria: string | null
    nombre_cuenta_beneficiaria: string | null
    entidad_bancaria: string | null
    descripcion_fisica: string | null
  }>
}

interface Usuario {
  id: number
  nombre: string
  apellido: string
  grado: string
  oficina: string
  rol: string
}

// Función para formatear la descripción física desde JSON
const formatearDescripcionFisica = (descJson: string | null): string | null => {
  if (!descJson || descJson.trim() === '') return null

  try {
    const desc = typeof descJson === 'string' ? JSON.parse(descJson) : descJson
    const partes: string[] = []

    // 1. Constitución física
    const constitucion: string[] = []
    if (desc.altura) constitucion.push(desc.altura)
    if (desc.complexion) constitucion.push(desc.complexion)
    if (desc.postura) constitucion.push(desc.postura)
    if (constitucion.length > 0) {
      partes.push(`• Constitución física: ${constitucion.join(', ')}`)
    }

    // 2. Forma del rostro
    if (desc.formaRostro) partes.push(`• Forma del rostro: ${desc.formaRostro}`)

    // 3. Piel
    const piel: string[] = []
    if (desc.tonoPiel) piel.push(`tono ${desc.tonoPiel}`)
    if (desc.texturaPiel) piel.push(`textura ${desc.texturaPiel}`)
    if (piel.length > 0) partes.push(`• Piel: ${piel.join(', ')}`)

    // 4. Cabello
    const cabello: string[] = []
    if (desc.colorCabello) {
      if (desc.colorCabello === 'Teñido' && desc.cabelloTeñido) {
        cabello.push(`color teñido (${desc.cabelloTeñido})`)
      } else {
        cabello.push(`color ${desc.colorCabello}`)
      }
    }
    if (desc.longitudCabello) cabello.push(`longitud ${desc.longitudCabello}`)
    if (desc.texturaCabello) cabello.push(`textura ${desc.texturaCabello}`)
    if (desc.peinado) cabello.push(`peinado ${desc.peinado}`)
    if (cabello.length > 0) partes.push(`• Cabello: ${cabello.join(', ')}`)

    // 5. Ojos
    const ojos: string[] = []
    if (desc.formaOjos) ojos.push(`forma ${desc.formaOjos}`)
    if (desc.colorOjos) ojos.push(`color ${desc.colorOjos}`)
    if (desc.caracteristicasOjos && Array.isArray(desc.caracteristicasOjos) && desc.caracteristicasOjos.length > 0) {
      ojos.push(`${desc.caracteristicasOjos.join(', ')}`)
    }
    if (ojos.length > 0) partes.push(`• Ojos: ${ojos.join(', ')}`)

    // 6. Otros rasgos distintivos
    if (desc.otrosRasgos && Array.isArray(desc.otrosRasgos) && desc.otrosRasgos.length > 0) {
      partes.push(`• Otros rasgos distintivos: ${desc.otrosRasgos.join(', ')}`)
    }

    // 7. Detalles adicionales
    if (desc.detallesAdicionales && desc.detallesAdicionales.trim() !== '') {
      partes.push(`• Detalles adicionales: ${desc.detallesAdicionales.trim()}`)
    }

    return partes.length > 0 ? partes.join('\n') : null
  } catch (error) {
    // Si no es JSON válido, devolver como texto plano
    return descJson
  }
}

export default function VerDenunciaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()
  const [denuncia, setDenuncia] = useState<DenunciaCompleta | null>(null)
  const [ampliaciones, setAmpliaciones] = useState<Ampliacion[]>([])
  const [loading, setLoading] = useState(true)
  const [denunciaId, setDenunciaId] = useState<string>('')
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setDenunciaId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (denunciaId && usuario) {
      cargarDenuncia()
      cargarAmpliaciones()
    }
  }, [denunciaId, usuario])

  const cargarDenuncia = async () => {
    if (!denunciaId || !usuario) return

    try {
      const response = await fetch(`/api/denuncias/ver/${denunciaId}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Error al cargar denuncia')

      const data = await response.json()
      setDenuncia(data)

      // Registrar visita si la denuncia está completada
      if (data.estado === 'completada') {
        try {
          await fetch(`/api/denuncias/registrar-visita/${denunciaId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuarioId: usuario.id })
          })
        } catch (error) {
          // No mostramos error si falla el registro de visita
          console.error('Error registrando visita:', error)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar la denuncia')
    } finally {
      setLoading(false)
    }
  }

  const cargarAmpliaciones = async () => {
    if (!denunciaId) return

    try {
      const response = await fetch(`/api/denuncias/ampliaciones/${denunciaId}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Error al cargar ampliaciones')

      const data = await response.json()
      setAmpliaciones(data.ampliaciones || [])
    } catch (error) {
      console.error('Error cargando ampliaciones:', error)
    }
  }

  const descargarPDFAmpliacion = (ampliacionId: number) => {
    window.open(`/api/denuncias/ampliacion/pdf/${ampliacionId}?tipo=oficio`, '_blank')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('usuario')
    router.push('/')
  }

  const descargarPDF = () => {
    if (denuncia?.estado !== 'completada') {
      alert('Solo se puede ver el PDF de denuncias completadas')
      return
    }
    if (!usuario) return
    window.open(`/api/denuncias/pdf/${denunciaId}?tipo=oficio&usuario_id=${usuario.id}&es_copia=true`, '_blank')
  }

  const continuarBorrador = () => {
    sessionStorage.setItem('borradorId', denunciaId)
    router.push('/nueva-denuncia')
  }

  const abrirModalEliminar = () => {
    setMostrarModalEliminar(true)
  }

  const eliminarBorrador = async () => {
    setEliminando(true)
    try {
      const response = await fetch(`/api/denuncias/eliminar/${denunciaId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar borrador')

      setMostrarModalEliminar(false)
      router.push('/mis-denuncias')
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar el borrador')
      setEliminando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  if (!usuario || !denuncia) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">No se encontró la denuncia</div>
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
        {/* Header Section */}
        <div className="max-w-6xl mx-auto mb-8">
          <Link
            href="/mis-denuncias"
            className="group inline-flex items-center text-sm font-bold text-slate-500 hover:text-[#002147] transition-colors mb-6"
          >
            <div className="mr-2 p-1.5 rounded-lg bg-white border border-slate-200 group-hover:border-blue-200 group-hover:bg-blue-50 transition-all shadow-sm">
              <ArrowLeft className="h-4 w-4" />
            </div>
            VOLVER A MIS DENUNCIAS
          </Link>

          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 md:p-8 shadow-sm relative overflow-hidden">
            {/* Fondo decorativo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 z-0 opacity-50"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="p-4 bg-[#002147] rounded-2xl shadow-lg shadow-blue-900/10 shrink-0">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-3 py-0.5 bg-blue-50 text-[#002147] text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                      EXPEDIENTE Nº {denuncia.orden}
                    </span>
                    <span className={`px-3 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${denuncia.estado === 'completada'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                      {denuncia.estado}
                    </span>
                  </div>
                  <h1 className="text-3xl font-black text-[#002147] leading-tight">Detalle de Denuncia</h1>
                  <div className="flex items-center gap-2 mt-2 text-slate-500">
                    <Hash className="h-3.5 w-3.5" />
                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                      {denuncia.hash}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {denuncia.estado === 'borrador' && (
                  <>
                    <button
                      onClick={continuarBorrador}
                      className="group flex items-center gap-2 px-6 py-3 bg-[#002147] text-white rounded-xl hover:bg-[#003366] transition-all shadow-md shadow-blue-900/10 font-bold text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      CONTINUAR DENUNCIA
                    </button>
                    <button
                      onClick={abrirModalEliminar}
                      className="group flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 border border-red-100 transition-all font-bold text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      ELIMINAR
                    </button>
                  </>
                )}
                {denuncia.estado === 'completada' && (
                  <>
                    <Link
                      href={`/ampliar-denuncia/${denunciaId}`}
                      className="group flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 border border-indigo-100 transition-all font-bold text-sm"
                    >
                      <Plus className="h-4 w-4 text-indigo-500" />
                      AMPLIAR DENUNCIA
                    </Link>
                    <button
                      onClick={descargarPDF}
                      className="group flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-900/10 font-bold text-sm"
                    >
                      <Download className="h-4 w-4" />
                      VER PDF
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Izquierda: Datos del Denunciante */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden h-full">
                <div className="h-2 bg-blue-500"></div>
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                      <User className="h-5 w-5" />
                    </div>
                    <h2 className="text-sm font-black text-[#002147] uppercase tracking-widest">
                      Denunciante
                    </h2>
                  </div>

                  <div className="space-y-6">
                    <DataGroup label="Nombres y Apellidos" value={denuncia.nombres_denunciante} icon={<User className="h-3.5 w-3.5" />} />
                    <DataGroup label="Documento" value={`${denuncia.tipo_documento || 'C.I.'}: ${denuncia.cedula}`} icon={<CreditCard className="h-3.5 w-3.5" />} />
                    <DataGroup label="Nacionalidad" value={denuncia.nacionalidad} icon={<Map className="h-3.5 w-3.5" />} />

                    <div className="grid grid-cols-2 gap-4">
                      <DataGroup label="Edad" value={`${denuncia.edad} años`} />
                      <DataGroup label="Estado Civil" value={denuncia.estado_civil} />
                    </div>

                    <DataGroup label="Teléfono" value={denuncia.telefono} icon={<Phone className="h-3.5 w-3.5" />} />
                    {denuncia.correo && <DataGroup label="Correo" value={denuncia.correo} icon={<Mail className="h-3.5 w-3.5" />} />}
                    {denuncia.profesion && <DataGroup label="Profesión" value={denuncia.profesion} icon={<Briefcase className="h-3.5 w-3.5" />} />}

                    {denuncia.domicilio && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Domicilio Declarado</label>
                        <p className="text-sm text-[#002147] font-bold leading-relaxed">{denuncia.domicilio}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Detalles de la Denuncia */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="h-2 bg-indigo-500"></div>
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                      <Shield className="h-5 w-5" />
                    </div>
                    <h2 className="text-sm font-black text-[#002147] uppercase tracking-widest">
                      Detalles del Hecho
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <DataGroup
                      label="Tipo de Denuncia"
                      value={denuncia.tipo_denuncia === 'OTRO' ? denuncia.otro_tipo : denuncia.tipo_denuncia}
                      icon={<Gavel className="h-3.5 w-3.5" />}
                    />
                    <DataGroup
                      label="Fecha y Hora del Hecho"
                      value={`${formatearFechaSinTimezone(denuncia.fecha_hecho)} - ${denuncia.hora_hecho}`}
                      icon={<Clock className="h-3.5 w-3.5" />}
                    />
                    <div className="md:col-span-2">
                      <DataGroup
                        label="Lugar del Hecho"
                        value={denuncia.lugar_hecho}
                        icon={<MapPin className="h-3.5 w-3.5" />}
                      />
                    </div>
                  </div>

                  <div className="relative mb-8">
                    <label className="absolute -top-2.5 left-4 px-2 bg-white text-[10px] font-black text-indigo-500 uppercase tracking-widest">Relato del Hecho</label>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 min-h-[150px]">
                      <p className="text-sm text-[#002147] font-medium leading-relaxed whitespace-pre-wrap">{denuncia.relato}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Impacto Financiero</p>
                        <p className="text-lg font-black text-[#002147]">
                          {denuncia.monto_dano ? `${typeof denuncia.monto_dano === 'string' ? parseFloat(denuncia.monto_dano).toLocaleString('es-PY') : denuncia.monto_dano.toLocaleString('es-PY')} ${denuncia.moneda}` : 'NO APLICA'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pr-4">
                      <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400">
                        <Map className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ubicación GPS</p>
                        <p className="text-xs font-bold text-[#002147]">
                          {denuncia.latitud && denuncia.longitud ? `${parseFloat(String(denuncia.latitud)).toFixed(6)}, ${parseFloat(String(denuncia.longitud)).toFixed(6)}` : 'SIN REGISTRO'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supuestos Autores */}
              {denuncia.supuestos_autores && denuncia.supuestos_autores.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="h-2 bg-slate-400"></div>
                  <div className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600">
                        <BadgeAlert className="h-5 w-5" />
                      </div>
                      <h2 className="text-sm font-black text-[#002147] uppercase tracking-widest">
                        Supuestos Autores
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {denuncia.supuestos_autores.map((autor, index) => (
                        <div key={index} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                          <div className="flex items-center gap-2 mb-4">
                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${autor.autor_conocido === 'Conocido'
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : 'bg-slate-200 text-slate-700 border-slate-300'
                              }`}>
                              {autor.autor_conocido === 'Conocido' ? 'Autor Identificado' : 'Sin Identificar'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {autor.autor_conocido === 'Conocido' ? (
                              <>
                                <DataGroup label="Nombre del Autor" value={autor.nombre_autor || 'N/A'} icon={<User className="h-3.5 w-3.5" />} />
                                <DataGroup label="Cédula" value={autor.cedula_autor || 'N/A'} icon={<CreditCard className="h-3.5 w-3.5" />} />
                                <div className="md:col-span-2">
                                  <DataGroup label="Domicilio" value={autor.domicilio_autor || 'N/A'} icon={<MapPin className="h-3.5 w-3.5" />} />
                                </div>
                                <DataGroup label="Teléfono" value={autor.telefono_autor || 'N/A'} icon={<Phone className="h-3.5 w-3.5" />} />
                                <DataGroup label="Entidad Asociada" value={autor.entidad_bancaria || 'N/A'} icon={<BadgeAlert className="h-3.5 w-3.5" />} />
                              </>
                            ) : (
                              <>
                                {autor.descripcion_fisica && formatearDescripcionFisica(autor.descripcion_fisica) && (
                                  <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Descripción Física Detallada</label>
                                    <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                                      {formatearDescripcionFisica(autor.descripcion_fisica)}
                                    </div>
                                  </div>
                                )}
                                <DataGroup label="Cuentas/Teléfonos Involucrados" value={autor.telefonos_involucrados || autor.numero_cuenta_beneficiaria || 'N/A'} icon={<AlertCircle className="h-3.5 w-3.5" />} />
                                <DataGroup label="Entidad Bancaria" value={autor.entidad_bancaria || 'N/A'} icon={<Shield className="h-3.5 w-3.5" />} />
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Ampliaciones */}
              {denuncia.estado === 'completada' && ampliaciones.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="h-2 bg-purple-500"></div>
                  <div className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
                        <Plus className="h-5 w-5" />
                      </div>
                      <h2 className="text-sm font-black text-[#002147] uppercase tracking-widest">
                        Ampliaciones del Expediente
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {ampliaciones.map((ampliacion) => (
                        <div key={ampliacion.id} className="p-6 border border-slate-100 rounded-3xl bg-slate-50/70 hover:bg-slate-50 transition-colors">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 pb-4 border-b border-slate-200/60">
                            <div>
                              <h3 className="text-base font-black text-[#002147]">
                                AMPLACIÓN Nº {ampliacion.numero_ampliacion}
                              </h3>
                              <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {formatearFechaSinTimezone(ampliacion.fecha_ampliacion)}</span>
                                <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {ampliacion.hora_ampliacion}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => descargarPDFAmpliacion(ampliacion.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-[#002147] rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm text-xs font-bold"
                            >
                              <Download className="h-3.5 w-3.5 text-blue-500" />
                              VER AMPLIACIÓN
                            </button>
                          </div>
                          <div>
                            <p className="text-sm text-[#002147] font-medium leading-relaxed whitespace-pre-wrap">{ampliacion.relato}</p>
                            <div className="mt-4 flex items-center gap-2">
                              <Shield className="h-3 w-3 text-slate-400" />
                              <p className="text-[10px] font-bold text-slate-400 italic">
                                Interviniente: {ampliacion.operador_grado} {ampliacion.operador_nombre} {ampliacion.operador_apellido}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Borrador */}
        {mostrarModalEliminar && (
          <div className="fixed inset-0 bg-[#002147]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-sm w-full border border-slate-100 animate-in fade-in zoom-in duration-200">
              <div className="h-12 w-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-[#002147] mb-2 uppercase tracking-tight">¿Eliminar Borrador?</h3>
              <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                Esta acción es irreversible y se perderán todos los datos cargados hasta el momento.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={eliminarBorrador}
                  disabled={eliminando}
                  className="w-full px-6 py-3.5 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all font-black text-sm shadow-lg shadow-red-900/10 disabled:opacity-50"
                >
                  {eliminando ? 'ELIMINANDO...' : 'ELIMINAR PERMANENTEMENTE'}
                </button>
                <button
                  onClick={() => setMostrarModalEliminar(false)}
                  disabled={eliminando}
                  className="w-full px-6 py-3.5 bg-slate-100 text-[#002147] rounded-2xl hover:bg-slate-200 transition-all font-black text-sm"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

function DataGroup({ label, value, icon }: { label: string, value: string | number | null, icon?: React.ReactNode }) {
  return (
    <div className="group">
      <div className="flex items-center gap-1.5 mb-1.5 ml-1">
        {icon && <span className="text-slate-300 group-hover:text-blue-400 transition-colors">{icon}</span>}
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      </div>
      <p className="text-sm text-[#002147] font-bold min-h-[1.25rem]">
        {value === null || value === undefined || value === '' ? (
          <span className="text-slate-300 font-medium italic">Sin Registro</span>
        ) : (
          value
        )}
      </p>
    </div>
  )
}


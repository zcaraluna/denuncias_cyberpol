'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatearFechaSinTimezone } from '@/lib/utils/fecha'

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
  const [mostrarModalPDF, setMostrarModalPDF] = useState(false)
  const [tipoPapelSeleccionado, setTipoPapelSeleccionado] = useState<'oficio' | 'a4'>('oficio')
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

  const descargarPDFAmpliacion = (ampliacionId: number, tipoPapel: 'oficio' | 'a4' = 'oficio') => {
    window.open(`/api/denuncias/ampliacion/pdf/${ampliacionId}?tipo=${tipoPapel}`, '_blank')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('usuario')
    router.push('/')
  }

  const abrirModalPDF = () => {
    if (denuncia?.estado !== 'completada') {
      alert('Solo se puede ver el PDF de denuncias completadas')
      return
    }
    setMostrarModalPDF(true)
  }

  const descargarPDF = () => {
    if (!usuario) return
    window.open(`/api/denuncias/pdf/${denunciaId}?tipo=${tipoPapelSeleccionado}&usuario_id=${usuario.id}`, '_blank')
    setMostrarModalPDF(false)
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/mis-denuncias" className="text-gray-600 hover:text-gray-900">
              ← Volver a Mis Denuncias
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Ver Denuncia</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                denuncia.estado === 'completada'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {denuncia.estado === 'completada' ? 'Completada' : 'Borrador'}
              </span>
            </div>
            <div className="flex gap-4">
              {denuncia.estado === 'borrador' && (
                <>
                  <button
                    onClick={continuarBorrador}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
                  >
                    Continuar Denuncia
                  </button>
                  <button
                    onClick={abrirModalEliminar}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-medium"
                  >
                    Eliminar Borrador
                  </button>
                </>
              )}
              {denuncia.estado === 'completada' && (
                <>
                  <Link
                    href={`/ampliar-denuncia/${denunciaId}`}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 font-medium"
                  >
                    Ampliar Denuncia
                  </Link>
                  <button
                    onClick={abrirModalPDF}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium"
                  >
                    Ver PDF
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8 space-y-8">
            {/* Información del Denunciante */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                Datos del Denunciante
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nombres y Apellidos</p>
                  <p className="text-base text-gray-900">{denuncia.nombres_denunciante}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Tipo de Documento</p>
                  <p className="text-base text-gray-900">{denuncia.tipo_documento || 'Cédula de Identidad Paraguaya'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Número de Documento</p>
                  <p className="text-base text-gray-900">{denuncia.cedula}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Nacionalidad</p>
                  <p className="text-base text-gray-900">{denuncia.nacionalidad}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Fecha de Nacimiento</p>
                  <p className="text-base text-gray-900">{formatearFechaSinTimezone(denuncia.fecha_nacimiento)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Edad</p>
                  <p className="text-base text-gray-900">{denuncia.edad} años</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Lugar de Nacimiento</p>
                  <p className="text-base text-gray-900">{denuncia.lugar_nacimiento}</p>
                </div>
                {denuncia.domicilio && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-600">Domicilio</p>
                    <p className="text-base text-gray-900">{denuncia.domicilio}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-600">Estado Civil</p>
                  <p className="text-base text-gray-900">{denuncia.estado_civil}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Teléfono</p>
                  <p className="text-base text-gray-900">{denuncia.telefono}</p>
                </div>
                {denuncia.correo && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Correo Electrónico</p>
                    <p className="text-base text-gray-900">{denuncia.correo}</p>
                  </div>
                )}
                {denuncia.profesion && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Profesión</p>
                    <p className="text-base text-gray-900">{denuncia.profesion}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Información de la Denuncia */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                Detalles de la Denuncia
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Número de Orden</p>
                  <p className="text-base text-gray-900">{denuncia.orden}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Hash</p>
                  <p className="text-base text-gray-900 font-mono">{denuncia.hash}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Tipo de Denuncia</p>
                  <p className="text-base text-gray-900">{denuncia.tipo_denuncia === 'OTRO' ? denuncia.otro_tipo : denuncia.tipo_denuncia}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Fecha del Hecho</p>
                  <p className="text-base text-gray-900">{formatearFechaSinTimezone(denuncia.fecha_hecho)} {denuncia.hora_hecho}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-600">Lugar del Hecho</p>
                  <p className="text-base text-gray-900">{denuncia.lugar_hecho}</p>
                </div>
                {denuncia.latitud && denuncia.longitud && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-600">Coordenadas GPS</p>
                    <p className="text-base text-gray-900 font-mono">{typeof denuncia.latitud === 'string' ? parseFloat(denuncia.latitud).toFixed(6) : denuncia.latitud.toFixed(6)}, {typeof denuncia.longitud === 'string' ? parseFloat(denuncia.longitud).toFixed(6) : denuncia.longitud.toFixed(6)}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-600">Relato del Hecho</p>
                  <p className="text-base text-gray-900 whitespace-pre-wrap">{denuncia.relato}</p>
                </div>
                {denuncia.monto_dano && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monto del Daño</p>
                    <p className="text-base text-gray-900">{typeof denuncia.monto_dano === 'string' ? parseFloat(denuncia.monto_dano).toLocaleString('es-PY') : denuncia.monto_dano.toLocaleString('es-PY')} {denuncia.moneda}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Supuestos Autores */}
            {denuncia.supuestos_autores && denuncia.supuestos_autores.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                  Supuestos Autores
                </h2>
                {denuncia.supuestos_autores.map((autor, index) => (
                  <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg">
                    <div className="mb-3">
                      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                        autor.autor_conocido === 'Conocido'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {autor.autor_conocido === 'Conocido' ? 'Autor Conocido' : 'Autor Desconocido'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {autor.autor_conocido === 'Conocido' ? (
                        <>
                          {autor.nombre_autor && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">Nombre</p>
                              <p className="text-base text-gray-900">{autor.nombre_autor}</p>
                            </div>
                          )}
                          {autor.cedula_autor && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">Cédula</p>
                              <p className="text-base text-gray-900">{autor.cedula_autor}</p>
                            </div>
                          )}
                          {autor.domicilio_autor && (
                            <div className="col-span-2">
                              <p className="text-sm font-medium text-gray-600">Domicilio</p>
                              <p className="text-base text-gray-900">{autor.domicilio_autor}</p>
                            </div>
                          )}
                          {autor.nacionalidad_autor && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">Nacionalidad</p>
                              <p className="text-base text-gray-900">{autor.nacionalidad_autor}</p>
                            </div>
                          )}
                          {autor.estado_civil_autor && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">Estado Civil</p>
                              <p className="text-base text-gray-900">{autor.estado_civil_autor}</p>
                            </div>
                          )}
                          {autor.edad_autor && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">Edad</p>
                              <p className="text-base text-gray-900">{autor.edad_autor} años</p>
                            </div>
                          )}
                          {autor.fecha_nacimiento_autor && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">Fecha de Nacimiento</p>
                              <p className="text-base text-gray-900">{new Date(autor.fecha_nacimiento_autor).toLocaleDateString('es-ES')}</p>
                            </div>
                          )}
                          {autor.lugar_nacimiento_autor && (
                            <div className="col-span-2">
                              <p className="text-sm font-medium text-gray-600">Lugar de Nacimiento</p>
                              <p className="text-base text-gray-900">{autor.lugar_nacimiento_autor}</p>
                            </div>
                          )}
                          {autor.telefono_autor && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">Teléfono</p>
                              <p className="text-base text-gray-900">{autor.telefono_autor}</p>
                            </div>
                          )}
                          {autor.profesion_autor && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">Profesión</p>
                              <p className="text-base text-gray-900">{autor.profesion_autor}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {autor.descripcion_fisica && formatearDescripcionFisica(autor.descripcion_fisica) && (
                            <div className="col-span-2">
                              <p className="text-sm font-medium text-gray-600 mb-2">Descripción Física</p>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <p className="text-base text-gray-900 whitespace-pre-line text-sm leading-relaxed">
                                  {formatearDescripcionFisica(autor.descripcion_fisica)}
                                </p>
                              </div>
                            </div>
                          )}
                          {autor.telefonos_involucrados && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">Teléfono(s) Involucrado(s)</p>
                              <p className="text-base text-gray-900">{autor.telefonos_involucrados}</p>
                            </div>
                          )}
                          {autor.numero_cuenta_beneficiaria && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">Número de Cuenta</p>
                              <p className="text-base text-gray-900">{autor.numero_cuenta_beneficiaria}</p>
                            </div>
                          )}
                          {autor.nombre_cuenta_beneficiaria && (
                            <div className="col-span-2">
                              <p className="text-sm font-medium text-gray-600">Nombre de Cuenta</p>
                              <p className="text-base text-gray-900">{autor.nombre_cuenta_beneficiaria}</p>
                            </div>
                          )}
                          {autor.entidad_bancaria && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">Entidad Bancaria</p>
                              <p className="text-base text-gray-900">{autor.entidad_bancaria}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Ampliaciones */}
            {denuncia.estado === 'completada' && ampliaciones.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                  Ampliaciones de Denuncia
                </h2>
                <div className="space-y-4">
                  {ampliaciones.map((ampliacion) => (
                    <div key={ampliacion.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            Ampliación Nº {ampliacion.numero_ampliacion}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Fecha: {formatearFechaSinTimezone(ampliacion.fecha_ampliacion)} {ampliacion.hora_ampliacion}
                          </p>
                          <p className="text-sm text-gray-600">
                            Operador: {ampliacion.operador_grado} {ampliacion.operador_nombre} {ampliacion.operador_apellido}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => descargarPDFAmpliacion(ampliacion.id, 'oficio')}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-sm font-medium"
                          >
                            PDF Oficio
                          </button>
                          <button
                            onClick={() => descargarPDFAmpliacion(ampliacion.id, 'a4')}
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-sm font-medium"
                          >
                            PDF A4
                          </button>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-600 mb-1">Relato:</p>
                        <p className="text-base text-gray-900 whitespace-pre-wrap">{ampliacion.relato}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de selección de tipo de papel */}
      {mostrarModalPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Seleccionar Formato de Papel</h3>
            <p className="text-gray-600 mb-6">Elija el formato de papel para la impresión</p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Formato de Papel</label>
              <div className="space-y-3">
              <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  value="oficio"
                  checked={tipoPapelSeleccionado === 'oficio'}
                  onChange={(e) => setTipoPapelSeleccionado(e.target.value as 'oficio' | 'a4')}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Formato Oficio (8.5" x 13")</div>
                  <div className="text-sm text-gray-500">Formato estándar institucional</div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  value="a4"
                  checked={tipoPapelSeleccionado === 'a4'}
                  onChange={(e) => setTipoPapelSeleccionado(e.target.value as 'oficio' | 'a4')}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Formato A4 (8.27" x 11.69")</div>
                  <div className="text-sm text-gray-500">Formato internacional estándar</div>
                </div>
              </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setMostrarModalPDF(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={descargarPDF}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {mostrarModalEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Eliminar Borrador</h3>
            <p className="text-gray-600 mb-6">
              ¿Está seguro que desea eliminar este borrador? Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setMostrarModalEliminar(false)}
                disabled={eliminando}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarBorrador}
                disabled={eliminando}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


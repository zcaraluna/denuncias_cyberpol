'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dynamic from 'next/dynamic'
import Select from 'react-select'

// Importar el mapa dinámicamente (solo en cliente)
const MapSelector = dynamic(() => import('@/components/MapSelector'), { ssr: false })

// Esquemas de validación
const denuncianteSchema = z.object({
  nombres: z.string().min(1, 'Este campo es obligatorio'),
  tipoDocumento: z.string().min(1, 'Debe seleccionar un tipo de documento'),
  numeroDocumento: z.string().min(1, 'Este campo es obligatorio'),
  nacionalidad: z.string().min(1, 'Este campo es obligatorio'),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  lugarNacimiento: z.string().min(1, 'Este campo es obligatorio'),
  estadoCivil: z.string().min(1, 'Este campo es obligatorio'),
  telefono: z.string().min(1, 'Este campo es obligatorio'),
  profesion: z.string().optional(),
})

const denunciaSchema = z.object({
  fechaHecho: z.string().min(1, 'Fecha requerida'),
  horaHecho: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  tipoDenuncia: z.string().min(1, 'Debe seleccionar un tipo'),
  otroTipo: z.string().optional(),
  lugarHecho: z.string().min(1, 'Este campo es obligatorio'),
  relato: z.string().min(10, 'El relato debe tener al menos 10 caracteres'),
  montoDano: z.string().optional(),
  moneda: z.string().optional(),
})

interface Usuario {
  id: number
  nombre: string
  apellido: string
  grado: string
  oficina: string
}

export default function NuevaDenunciaPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [paso, setPaso] = useState(1)
  const [autorConocido, setAutorConocido] = useState<'Conocido' | 'Desconocido'>('Desconocido')
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lng: number } | null>(null)
  const [mostrarMapa, setMostrarMapa] = useState(false)
  const [loading, setLoading] = useState(false)
  const [infoAdicionalLista, setInfoAdicionalLista] = useState<Array<{
    telefonosInvolucrados: string
    numeroCuenta: string
    nombreCuenta: string
    entidadBancaria: string
  }>>([])

  const tiposDenuncia = [
    'Estafa',
    'Estafa a través de sistemas informáticos',
    'Acceso indebido a datos',
    'Pornografía infantil',
    'Clonación de tarjetas de crédito y/o débito',
    'Lesión a la imagen y la comunicación',
    'Suplantación de identidad',
    'Abuso de documento de identidad',
    'Difamación, Calumnia y/o Injuria',
    'Producción de documentos no auténticos',
    'Extravío de documentos',
    'Usura',
    'Otro (Especificar)'
  ]

  const bancos = [
    'Banco Atlas',
    'Banco Continental',
    'Banco Familiar',
    'Banco Itaú',
    'Banco Nacional de Fomento',
    'Banco Regional',
    'Banco Río',
    'Banco Sudameris',
    'Bancop',
    'GNB Paraguay',
    'Visión Banco',
    'Ueno Bank'
  ]

  const nacionalidades = [
    'PARAGUAYA',
    'ARGENTINA',
    'BOLIVIANA',
    'BRASILEÑA',
    'CHILENA',
    'COLOMBIANA',
    'COSTARRICENSE',
    'CUBANA',
    'DOMINICANA',
    'ECUATORIANA',
    'SALVADOREÑA',
    'GUATEMALTECA',
    'HONDUREÑA',
    'MEXICANA',
    'NICARAGÜENSE',
    'PANAMEÑA',
    'PERUANA',
    'URUGUAYA',
    'VENEZOLANA',
    'ESPAÑOLA',
    'FRANCESA',
    'ITALIANA',
    'ALEMANA',
    'PORTUGUESA',
    'BRITÁNICA',
    'ESTADOUNIDENSE',
    'CANADIENSE',
    'RUSA',
    'CHINA',
    'JAPONESA',
    'COREANA',
    'TAILANDESA',
    'FILIPINA',
    'INDIA',
    'PAKISTANÍ',
    'BANGLADESÍ',
    'SRI LANKESA',
    'NEPALÍ',
    'AFGANISTANA',
    'IRANÍ',
    'IRAQUÍ',
    'ISRAELÍ',
    'LIBANESA',
    'SIRIA',
    'TURCA',
    'EGIPCIA',
    'SUDAFRICANA',
    'NIGERIANA',
    'KENIATA',
    'ETÍOPE',
    'MARROQUÍ',
    'ARGELINA',
    'TUNECINA',
    'AUSTRALIANA',
    'NEOZELANDESA',
    'OTRA'
  ]

  const estadosCiviles = ['SOLTERO', 'CASADO', 'VIUDO']

  const {
    register: registerDenunciante,
    handleSubmit: handleSubmitDenunciante,
    formState: { errors: errorsDenunciante },
    watch: watchDenunciante,
    setValue: setValueDenunciante,
    control: controlDenunciante,
  } = useForm({
    resolver: zodResolver(denuncianteSchema),
    defaultValues: {
      nacionalidad: 'PARAGUAYA',
    },
  })

  const tipoDocumento = watchDenunciante('tipoDocumento')

  // Establecer PARAGUAYA como valor por defecto
  useEffect(() => {
    const currentNacionalidad = watchDenunciante('nacionalidad')
    if (!currentNacionalidad || currentNacionalidad === '') {
      setValueDenunciante('nacionalidad', 'PARAGUAYA')
    }
  }, [setValueDenunciante, watchDenunciante])

  // Función para convertir a mayúsculas automáticamente
  const convertirAMayusculas = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const input = e.target
    const start = input.selectionStart
    const end = input.selectionEnd
    input.value = input.value.toUpperCase()
    input.setSelectionRange(start, end)
  }

  const fechaNacimiento = watchDenunciante('fechaNacimiento')

  useEffect(() => {
    if (fechaNacimiento && /^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) {
      try {
        const [año, mes, dia] = fechaNacimiento.split('-')
        const fecha = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia))
        const hoy = new Date()
        let edad = hoy.getFullYear() - fecha.getFullYear()
        const mesDiff = hoy.getMonth() - fecha.getMonth()
        if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < fecha.getDate())) {
          edad--
        }
        if (edad >= 0 && edad <= 120) {
          setValueDenunciante('edad', edad.toString())
        }
      } catch (error) {
        // Ignorar errores de cálculo
      }
    }
  }, [fechaNacimiento, setValueDenunciante])

  const {
    register: registerDenuncia,
    handleSubmit: handleSubmitDenuncia,
    formState: { errors: errorsDenuncia },
    watch: watchDenuncia,
    control: controlDenuncia,
  } = useForm({
    resolver: zodResolver(denunciaSchema),
  })

  const tipoDenuncia = watchDenuncia('tipoDenuncia')

  const {
    register: registerAutor,
    handleSubmit: handleSubmitAutor,
    formState: { errors: errorsAutor },
    watch: watchAutor,
    control: controlAutor,
    setValue: setValueAutor,
  } = useForm()

  const fechaNacimientoAutor = watchAutor('fechaNacimiento')

  useEffect(() => {
    if (fechaNacimientoAutor) {
      const edadCalculada = calcularEdad(fechaNacimientoAutor)
      setValueAutor('edad', edadCalculada)
    }
  }, [fechaNacimientoAutor, setValueAutor])

  useEffect(() => {
    const usuarioStr = sessionStorage.getItem('usuario')
    if (!usuarioStr) {
      router.push('/')
      return
    }

    try {
      const usuarioData = JSON.parse(usuarioStr)
      setUsuario(usuarioData)
    } catch (error) {
      router.push('/')
    }
  }, [router])

  const obtenerFechaHoraActual = async () => {
    try {
      const response = await fetch('/api/utils/fecha-hora')
      const data = await response.json()
      return data
    } catch (error) {
      const now = new Date()
      return {
        fecha: now.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Asuncion' }),
        hora: now.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Asuncion' }),
      }
    }
  }

  const onDenuncianteSubmit = (data: any) => {
    setPaso(2)
  }

  const onAutorSubmit = (data: any) => {
    setPaso(3)
  }

  const onVistaPrevia = async () => {
    if (!usuario) return

    // Validar que todos los formularios estén completos
    const denuncianteData = watchDenunciante()
    const autorData = watchAutor()
    const denunciaData = watchDenuncia()

    if (!denuncianteData.nombres || !denuncianteData.numeroDocumento || !denunciaData.fechaHecho || !denunciaData.relato) {
      alert('Por favor complete todos los campos obligatorios antes de ver la vista previa.')
      return
    }

    setLoading(true)

    try {
      // Obtener fecha y hora actual
      const { fecha, hora } = await obtenerFechaHoraActual()
      const fechaActual = fecha.split('/').reverse().join('-')
      
      // Convertir fecha de hecho si viene en formato YYYY-MM-DD
      let fechaHecho = denunciaData.fechaHecho
      if (fechaHecho.includes('-')) {
        // Ya está en formato YYYY-MM-DD
      } else if (fechaHecho.includes('/')) {
        // Convertir de DD/MM/YYYY a YYYY-MM-DD
        const [dia, mes, año] = fechaHecho.split('/')
        fechaHecho = `${año}-${mes}-${dia}`
      }

      // Preparar datos para enviar (todos en mayúsculas)
      const payload = {
        denunciante: {
          nombres: denuncianteData.nombres?.toUpperCase() || '',
          tipoDocumento: denuncianteData.tipoDocumento || '',
          numeroDocumento: denuncianteData.numeroDocumento?.toUpperCase() || '',
          nacionalidad: denuncianteData.nacionalidad?.toUpperCase() || '',
          estadoCivil: denuncianteData.estadoCivil?.toUpperCase() || '',
          fechaNacimiento: denuncianteData.fechaNacimiento,
          lugarNacimiento: denuncianteData.lugarNacimiento?.toUpperCase() || '',
          telefono: denuncianteData.telefono?.toUpperCase() || '',
          profesion: denuncianteData.profesion?.toUpperCase() || null,
          edad: denuncianteData.edad || calcularEdad(denuncianteData.fechaNacimiento),
        },
        denuncia: {
          fechaDenuncia: fechaActual,
          horaDenuncia: hora,
          fechaHecho: fechaHecho,
          horaHecho: denunciaData.horaHecho,
          tipoDenuncia: denunciaData.tipoDenuncia === 'Otro (Especificar)' ? 'OTRO' : denunciaData.tipoDenuncia,
          otroTipo: denunciaData.tipoDenuncia === 'Otro (Especificar)' ? denunciaData.otroTipo?.toUpperCase() : null,
          lugarHecho: denunciaData.lugarHecho?.toUpperCase() || '',
          relato: denunciaData.relato || '',
          montoDano: denunciaData.montoDano ? parseInt(denunciaData.montoDano.replace(/\./g, '')) : null,
          moneda: denunciaData.moneda || null,
          latitud: coordenadas?.lat || null,
          longitud: coordenadas?.lng || null,
        },
        autor: {
          conocido: autorConocido,
          ...(autorConocido === 'Conocido' && {
            nombre: autorData.nombre?.toUpperCase() || null,
            cedula: autorData.cedula?.toUpperCase() || null,
            domicilio: autorData.domicilio?.toUpperCase() || null,
            nacionalidad: autorData.nacionalidad?.toUpperCase() || null,
            estadoCivil: autorData.estadoCivil?.toUpperCase() || null,
            edad: autorData.edad || null,
            fechaNacimiento: autorData.fechaNacimiento || null,
            lugarNacimiento: autorData.lugarNacimiento?.toUpperCase() || null,
            telefono: autorData.telefono?.toUpperCase() || null,
            profesion: autorData.profesion?.toUpperCase() || null,
          }),
        },
        infoAdicional: infoAdicionalLista.map(info => ({
          telefonosInvolucrados: info.telefonosInvolucrados || null,
          numeroCuenta: info.numeroCuenta || null,
          nombreCuenta: info.nombreCuenta || null,
          entidadBancaria: info.entidadBancaria || null,
        })),
        operador: {
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          grado: usuario.grado,
          oficina: usuario.oficina,
        },
      }

      const response = await fetch('/api/denuncias/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Error al generar la vista previa')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'vista_previa.pdf'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al generar la vista previa. Por favor, intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const onDenunciaSubmit = async (data: any) => {
    if (!usuario) return

    setLoading(true)

    try {
      // Obtener fecha y hora actual
      const { fecha, hora } = await obtenerFechaHoraActual()
      const fechaActual = fecha.split('/').reverse().join('-')
      
      const denuncianteData = watchDenunciante()
      const autorData = watchAutor()
      const denunciaData = watchDenuncia()
      
      // Convertir fecha de hecho si viene en formato YYYY-MM-DD
      let fechaHecho = denunciaData.fechaHecho
      if (fechaHecho.includes('-')) {
        // Ya está en formato YYYY-MM-DD
      } else if (fechaHecho.includes('/')) {
        // Convertir de DD/MM/YYYY a YYYY-MM-DD
        const [dia, mes, año] = fechaHecho.split('/')
        fechaHecho = `${año}-${mes}-${dia}`
      }

      // Preparar datos para enviar (todos en mayúsculas)
      const payload = {
        denunciante: {
          nombres: denuncianteData.nombres?.toUpperCase() || '',
          tipoDocumento: denuncianteData.tipoDocumento || '',
          numeroDocumento: denuncianteData.numeroDocumento?.toUpperCase() || '',
          nacionalidad: denuncianteData.nacionalidad?.toUpperCase() || '',
          estadoCivil: denuncianteData.estadoCivil?.toUpperCase() || '',
          fechaNacimiento: denuncianteData.fechaNacimiento,
          lugarNacimiento: denuncianteData.lugarNacimiento?.toUpperCase() || '',
          telefono: denuncianteData.telefono?.toUpperCase() || '',
          profesion: denuncianteData.profesion?.toUpperCase() || null,
          edad: denuncianteData.edad || calcularEdad(denuncianteData.fechaNacimiento),
        },
        denuncia: {
          fechaDenuncia: fechaActual,
          horaDenuncia: hora,
          fechaHecho: fechaHecho,
          horaHecho: denunciaData.horaHecho,
          tipoDenuncia: denunciaData.tipoDenuncia === 'Otro (Especificar)' ? 'OTRO' : denunciaData.tipoDenuncia,
          otroTipo: denunciaData.tipoDenuncia === 'Otro (Especificar)' ? denunciaData.otroTipo?.toUpperCase() : null,
          lugarHecho: denunciaData.lugarHecho?.toUpperCase() || '',
          relato: denunciaData.relato || '',
          montoDano: denunciaData.montoDano ? parseInt(denunciaData.montoDano.replace(/\./g, '')) : null,
          moneda: denunciaData.moneda || null,
          latitud: coordenadas?.lat || null,
          longitud: coordenadas?.lng || null,
        },
        autor: {
          conocido: autorConocido,
          ...(autorConocido === 'Conocido' && {
            nombre: autorData.nombre?.toUpperCase() || null,
            cedula: autorData.cedula?.toUpperCase() || null,
            domicilio: autorData.domicilio?.toUpperCase() || null,
            nacionalidad: autorData.nacionalidad?.toUpperCase() || null,
            estadoCivil: autorData.estadoCivil?.toUpperCase() || null,
            edad: autorData.edad || null,
            fechaNacimiento: autorData.fechaNacimiento || null,
            lugarNacimiento: autorData.lugarNacimiento?.toUpperCase() || null,
            telefono: autorData.telefono?.toUpperCase() || null,
            profesion: autorData.profesion?.toUpperCase() || null,
          }),
        },
        infoAdicional: infoAdicionalLista.map(info => ({
          telefonosInvolucrados: info.telefonosInvolucrados || null,
          numeroCuenta: info.numeroCuenta || null,
          nombreCuenta: info.nombreCuenta || null,
          entidadBancaria: info.entidadBancaria || null,
        })),
        usuarioId: usuario.id,
      }

      const response = await fetch('/api/denuncias/nueva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Error al guardar la denuncia')
      }

      const result = await response.json()
      
      // Redirigir a página de confirmación
      router.push(`/nueva-denuncia/confirmacion?id=${result.id}`)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar la denuncia. Por favor, intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const calcularEdad = (fechaNac: string): string => {
    try {
      const [año, mes, dia] = fechaNac.split('-') // Formato YYYY-MM-DD
      const fecha = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia))
      const hoy = new Date()
      let edad = hoy.getFullYear() - fecha.getFullYear()
      const mesDiff = hoy.getMonth() - fecha.getMonth()
      if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < fecha.getDate())) {
        edad--
      }
      return edad.toString()
    } catch {
      return ''
    }
  }


  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Volver
            </button>
            <h1 className="text-xl font-bold text-gray-800">Nueva Denuncia</h1>
            <div className="text-sm text-gray-600">
              {usuario.grado} {usuario.nombre} {usuario.apellido}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Indicador de pasos */}
        <div className="mb-8">
          <div className="flex items-center">
            {[
              { num: 1, label: 'Denunciante' },
              { num: 2, label: 'Supuesto Autor' },
              { num: 3, label: 'Detalles' }
            ].map((step, index) => (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center relative">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      paso >= step.num
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-500'
                    }`}
                  >
                    {step.num}
                  </div>
                  <span className="text-sm text-gray-600 mt-2 whitespace-nowrap">
                    {step.label}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      paso > step.num ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Paso 1: Datos del Denunciante */}
        {paso === 1 && (
          <form
            onSubmit={handleSubmitDenunciante(onDenuncianteSubmit)}
            autoComplete="off"
            className="bg-white rounded-lg shadow-md p-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Datos del Denunciante
            </h2>

            <div className="space-y-4">
              {/* 1. Nombres y Apellidos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombres y Apellidos *
                </label>
                <input
                  {...registerDenunciante('nombres')}
                  onChange={(e) => {
                    convertirAMayusculas(e)
                    registerDenunciante('nombres').onChange(e)
                  }}
                  autoComplete="off"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                />
                {errorsDenunciante.nombres && (
                  <p className="text-red-600 text-sm mt-1">{errorsDenunciante.nombres.message as string}</p>
                )}
              </div>

              {/* 2. Tipo de Documento y Número */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Documento de Identidad Tipo *
                  </label>
                  <select
                    {...registerDenunciante('tipoDocumento')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans text-sm"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <option value="">Seleccione...</option>
                    <option value="Cédula de Identidad Paraguaya">Cédula de Identidad Paraguaya</option>
                    <option value="Documento de origen">Documento de origen</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                  {errorsDenunciante.tipoDocumento && (
                    <p className="text-red-600 text-sm mt-1">{errorsDenunciante.tipoDocumento.message as string}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Documento *
                  </label>
                  <input
                    {...registerDenunciante('numeroDocumento')}
                    onChange={(e) => {
                      const tipoDoc = watchDenunciante('tipoDocumento')
                      if (tipoDoc === 'Pasaporte' || tipoDoc === 'Documento de origen') {
                        // Permitir alfanumérico
                        convertirAMayusculas(e)
                      } else {
                        // Solo números para cédula paraguaya
                        e.target.value = e.target.value.replace(/[^0-9]/g, '')
                      }
                      registerDenunciante('numeroDocumento').onChange(e)
                    }}
                    autoComplete="off"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  />
                  {errorsDenunciante.numeroDocumento && (
                    <p className="text-red-600 text-sm mt-1">{errorsDenunciante.numeroDocumento.message as string}</p>
                  )}
                </div>
              </div>

              {/* 3. Nacionalidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nacionalidad *
                </label>
                <Controller
                  name="nacionalidad"
                  control={controlDenunciante}
                  render={({ field }) => {
                    const currentValue = field.value || 'PARAGUAYA'
                    return (
                      <Select
                        options={nacionalidades.map((nac) => ({ value: nac, label: nac }))}
                        value={nacionalidades.find((nac) => nac === currentValue) ? { value: currentValue, label: currentValue } : { value: 'PARAGUAYA', label: 'PARAGUAYA' }}
                        onChange={(option) => {
                          field.onChange(option?.value || 'PARAGUAYA')
                        }}
                        isSearchable
                        placeholder="Buscar nacionalidad..."
                        className="text-sm"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          minHeight: '42px',
                          borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                          boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                          '&:hover': {
                            borderColor: '#3b82f6',
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          maxHeight: '250px',
                          zIndex: 9999,
                        }),
                        menuList: (base) => ({
                          ...base,
                          maxHeight: '250px',
                        }),
                        option: (base, state) => ({
                          ...base,
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          padding: '8px 12px',
                          backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
                          color: state.isSelected ? 'white' : '#1f2937',
                          cursor: 'pointer',
                        }),
                        input: (base) => ({
                          ...base,
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          margin: 0,
                          padding: 0,
                        }),
                        singleValue: (base) => ({
                          ...base,
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          color: '#1f2937',
                        }),
                        placeholder: (base) => ({
                          ...base,
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          color: '#9ca3af',
                        }),
                      }}
                      classNamePrefix="react-select"
                      />
                    )
                  }}
                />
                {errorsDenunciante.nacionalidad && (
                  <p className="text-red-600 text-sm mt-1">{errorsDenunciante.nacionalidad.message as string}</p>
                )}
              </div>

              {/* 4. Fecha de Nacimiento y Edad */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    {...registerDenunciante('fechaNacimiento')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errorsDenunciante.fechaNacimiento && (
                    <p className="text-red-600 text-sm mt-1">{errorsDenunciante.fechaNacimiento.message as string}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Edad
                  </label>
                  <input
                    {...registerDenunciante('edad')}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
              </div>

              {/* 5. Lugar de Nacimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lugar de Nacimiento *
                </label>
                <input
                  {...registerDenunciante('lugarNacimiento')}
                  onChange={(e) => {
                    convertirAMayusculas(e)
                    registerDenunciante('lugarNacimiento').onChange(e)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                />
                {errorsDenunciante.lugarNacimiento && (
                  <p className="text-red-600 text-sm mt-1">{errorsDenunciante.lugarNacimiento.message as string}</p>
                )}
              </div>

              {/* 6. Estado Civil */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado Civil *
                </label>
                <select
                  {...registerDenunciante('estadoCivil')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans text-sm"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <option value="">Seleccione...</option>
                  {estadosCiviles.map((ec) => (
                    <option key={ec} value={ec}>
                      {ec}
                    </option>
                  ))}
                </select>
                {errorsDenunciante.estadoCivil && (
                  <p className="text-red-600 text-sm mt-1">{errorsDenunciante.estadoCivil.message as string}</p>
                )}
              </div>

              {/* 7. Número de Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Teléfono *
                </label>
                <input
                  {...registerDenunciante('telefono')}
                  onChange={(e) => {
                    convertirAMayusculas(e)
                    registerDenunciante('telefono').onChange(e)
                  }}
                  autoComplete="off"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                />
                {errorsDenunciante.telefono && (
                  <p className="text-red-600 text-sm mt-1">{errorsDenunciante.telefono.message as string}</p>
                )}
              </div>

              {/* 8. Profesión */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profesión
                </label>
                <input
                  {...registerDenunciante('profesion')}
                  onChange={(e) => {
                    convertirAMayusculas(e)
                    registerDenunciante('profesion').onChange(e)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                />
                {errorsDenunciante.profesion && (
                  <p className="text-red-600 text-sm mt-1">{errorsDenunciante.profesion.message as string}</p>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Siguiente
              </button>
            </div>
          </form>
        )}

        {/* Paso 2: Supuesto Autor */}
        {paso === 2 && (
          <form
            data-paso="2"
            onSubmit={handleSubmitAutor(onAutorSubmit)}
            autoComplete="off"
            className="bg-white rounded-lg shadow-md p-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Supuesto Autor
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ¿El supuesto autor es conocido o desconocido? *
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Conocido"
                    checked={autorConocido === 'Conocido'}
                    onChange={(e) => setAutorConocido(e.target.value as 'Conocido' | 'Desconocido')}
                    className="mr-2"
                  />
                  Conocido
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Desconocido"
                    checked={autorConocido === 'Desconocido'}
                    onChange={(e) => setAutorConocido(e.target.value as 'Conocido' | 'Desconocido')}
                    className="mr-2"
                  />
                  Desconocido
                </label>
              </div>
            </div>

            {autorConocido === 'Conocido' && (
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombres y Apellidos
                    </label>
                    <input
                      {...registerAutor('nombre')}
                      onChange={(e) => {
                        convertirAMayusculas(e)
                        registerAutor('nombre').onChange(e)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cédula de Identidad
                    </label>
                    <input
                      {...registerAutor('cedula')}
                      onChange={(e) => {
                        convertirAMayusculas(e)
                        registerAutor('cedula').onChange(e)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domicilio
                  </label>
                  <input
                    {...registerAutor('domicilio')}
                    onChange={(e) => {
                      convertirAMayusculas(e)
                      registerAutor('domicilio').onChange(e)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nacionalidad
                    </label>
                    <Controller
                      name="nacionalidad"
                      control={controlAutor}
                      render={({ field }) => {
                        const currentValue = field.value || 'PARAGUAYA'
                        return (
                          <Select
                            options={nacionalidades.map((nac) => ({ value: nac, label: nac }))}
                            value={nacionalidades.find((nac) => nac === currentValue) ? { value: currentValue, label: currentValue } : { value: 'PARAGUAYA', label: 'PARAGUAYA' }}
                            onChange={(option) => {
                              field.onChange(option?.value || 'PARAGUAYA')
                            }}
                            isSearchable
                            placeholder="Buscar nacionalidad..."
                            className="text-sm"
                            styles={{
                              control: (base, state) => ({
                                ...base,
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '14px',
                                minHeight: '42px',
                                borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                                boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                                '&:hover': {
                                  borderColor: '#3b82f6',
                                },
                              }),
                              menu: (base) => ({
                                ...base,
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '14px',
                                maxHeight: '250px',
                                zIndex: 9999,
                              }),
                              menuList: (base) => ({
                                ...base,
                                maxHeight: '250px',
                              }),
                              option: (base, state) => ({
                                ...base,
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '14px',
                                padding: '8px 12px',
                                backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
                                color: state.isSelected ? 'white' : '#1f2937',
                                cursor: 'pointer',
                              }),
                              input: (base) => ({
                                ...base,
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '14px',
                                margin: 0,
                                padding: 0,
                              }),
                              singleValue: (base) => ({
                                ...base,
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '14px',
                                color: '#1f2937',
                              }),
                              placeholder: (base) => ({
                                ...base,
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '14px',
                                color: '#9ca3af',
                              }),
                            }}
                            classNamePrefix="react-select"
                          />
                        )
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado Civil
                    </label>
                    <select
                      {...registerAutor('estadoCivil')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <option value="">Seleccione...</option>
                      {estadosCiviles.map((ec) => (
                        <option key={ec} value={ec}>
                          {ec}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      {...registerAutor('fechaNacimiento')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Edad
                    </label>
                    <input
                      {...registerAutor('edad')}
                      type="number"
                      readOnly={!!fechaNacimientoAutor}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        fechaNacimientoAutor ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lugar de Nacimiento
                    </label>
                    <input
                      {...registerAutor('lugarNacimiento')}
                      onChange={(e) => {
                        convertirAMayusculas(e)
                        registerAutor('lugarNacimiento').onChange(e)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Teléfono
                    </label>
                    <input
                      {...registerAutor('telefono')}
                      onChange={(e) => {
                        convertirAMayusculas(e)
                        registerAutor('telefono').onChange(e)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profesión
                    </label>
                    <input
                      {...registerAutor('profesion')}
                      onChange={(e) => {
                        convertirAMayusculas(e)
                        registerAutor('profesion').onChange(e)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Información Adicional</h3>
                  <p className="text-sm text-gray-500 mt-1">Teléfonos y cuentas bancarias relacionadas</p>
                </div>
                <button
                  type="button"
                  onClick={() => setInfoAdicionalLista([...infoAdicionalLista, {
                    telefonosInvolucrados: '',
                    numeroCuenta: '',
                    nombreCuenta: '',
                    entidadBancaria: ''
                  }])}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm font-medium shadow-sm transition-all"
                >
                  + Agregar Grupo
                </button>
              </div>

              {infoAdicionalLista.length > 0 && (
                <div className="space-y-4">
                  {infoAdicionalLista.map((info, index) => (
                    <div key={index} className="border border-gray-300 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                          </div>
                          <h4 className="font-semibold text-gray-800">Grupo {index + 1}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInfoAdicionalLista(infoAdicionalLista.filter((_, i) => i !== index))}
                          className="px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Teléfono(s) involucrado(s)
                          </label>
                          <input
                            type="text"
                            value={info.telefonosInvolucrados}
                            onChange={(e) => {
                              const nuevaLista = [...infoAdicionalLista]
                              nuevaLista[index].telefonosInvolucrados = e.target.value.toUpperCase()
                              setInfoAdicionalLista(nuevaLista)
                            }}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Cuenta Beneficiaria
                          </label>
                          <input
                            type="text"
                            value={info.numeroCuenta}
                            onChange={(e) => {
                              const nuevaLista = [...infoAdicionalLista]
                              nuevaLista[index].numeroCuenta = e.target.value.toUpperCase()
                              setInfoAdicionalLista(nuevaLista)
                            }}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre de Cuenta Beneficiaria
                          </label>
                          <input
                            type="text"
                            value={info.nombreCuenta}
                            onChange={(e) => {
                              const nuevaLista = [...infoAdicionalLista]
                              nuevaLista[index].nombreCuenta = e.target.value.toUpperCase()
                              setInfoAdicionalLista(nuevaLista)
                            }}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Entidad Bancaria
                          </label>
                          <select
                            value={info.entidadBancaria}
                            onChange={(e) => {
                              const nuevaLista = [...infoAdicionalLista]
                              nuevaLista[index].entidadBancaria = e.target.value
                              setInfoAdicionalLista(nuevaLista)
                            }}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            <option value="">Seleccione...</option>
                            {bancos.map((banco) => (
                              <option key={banco} value={banco}>
                                {banco}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {infoAdicionalLista.length === 0 && (
                <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                  <p className="text-gray-500 text-sm">No hay información adicional agregada</p>
                  <p className="text-gray-400 text-xs mt-1">Presiona "Agregar Grupo" para comenzar</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setPaso(1)}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Anterior
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Siguiente
              </button>
            </div>
          </form>
        )}

        {/* Paso 3: Detalles y Relato */}
        {paso === 3 && (
          <form
            onSubmit={handleSubmitDenuncia(onDenunciaSubmit)}
            autoComplete="off"
            className="bg-white rounded-lg shadow-md p-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Detalles y Relato
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha del Hecho *
                </label>
                <input
                  type="date"
                  {...registerDenuncia('fechaHecho')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errorsDenuncia.fechaHecho && (
                  <p className="text-red-600 text-sm mt-1">{errorsDenuncia.fechaHecho.message as string}</p>
                )}
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora del Hecho (HH:MM) *
                  </label>
                  <input
                    type="time"
                    {...registerDenuncia('horaHecho')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errorsDenuncia.horaHecho && (
                    <p className="text-red-600 text-sm mt-1">{errorsDenuncia.horaHecho.message as string}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Denuncia *
                </label>
                <select
                  {...registerDenuncia('tipoDenuncia')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccione...</option>
                  {tiposDenuncia.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
                {errorsDenuncia.tipoDenuncia && (
                  <p className="text-red-600 text-sm mt-1">{errorsDenuncia.tipoDenuncia.message as string}</p>
                )}
              </div>

              {tipoDenuncia === 'Otro (Especificar)' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especifique aquí *
                  </label>
                  <input
                    {...registerDenuncia('otroTipo')}
                    onChange={(e) => {
                      convertirAMayusculas(e)
                      registerDenuncia('otroTipo').onChange(e)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  />
                  {errorsDenuncia.otroTipo && (
                    <p className="text-red-600 text-sm mt-1">{errorsDenuncia.otroTipo.message as string}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lugar del Hecho *
                </label>
                <div className="flex gap-2">
                  <input
                    {...registerDenuncia('lugarHecho')}
                    onChange={(e) => {
                      convertirAMayusculas(e)
                      registerDenuncia('lugarHecho').onChange(e)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarMapa(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Abrir Mapa
                  </button>
                </div>
                {coordenadas && (
                  <p className="text-sm text-gray-600 mt-1">
                    Coordenadas: {coordenadas.lat.toFixed(6)}, {coordenadas.lng.toFixed(6)}
                  </p>
                )}
                {errorsDenuncia.lugarHecho && (
                  <p className="text-red-600 text-sm mt-1">{errorsDenuncia.lugarHecho.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relato del Hecho *
                </label>
                <textarea
                  {...registerDenuncia('relato')}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Escriba el relato del hecho..."
                />
                {errorsDenuncia.relato && (
                  <p className="text-red-600 text-sm mt-1">{errorsDenuncia.relato.message as string}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto estimado de daño patrimonial
                  </label>
                  <input
                    {...registerDenuncia('montoDano')}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) => {
                      const value = e.target.value.replace(/\./g, '')
                      if (/^\d*$/.test(value)) {
                        e.target.value = parseInt(value) ? parseInt(value).toLocaleString('es-PY').replace(/,/g, '.') : ''
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Moneda
                  </label>
                  <select
                    {...registerDenuncia('moneda')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccione...</option>
                    <option value="Guaraníes (PYG)">Guaraníes (PYG)</option>
                    <option value="Dólares (USD)">Dólares (USD)</option>
                    <option value="Euros (EUR)">Euros (EUR)</option>
                    <option value="Pesos Argentinos (ARS)">Pesos Argentinos (ARS)</option>
                    <option value="Reales (BRL)">Reales (BRL)</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">
                  LA PERSONA RECURRENTE DEBE SER INFORMADA SOBRE:
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  ARTÍCULO 289.- "DENUNCIA FALSA"; ARTÍCULO 242.- "TESTIMONIO FALSO"; ARTÍCULO 243.- "DECLARACIÓN FALSA", DEL CODIGO PROCESAL PENAL
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setPaso(2)}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Anterior
              </button>
              <div className="flex gap-4">
                {/* <button
                  type="button"
                  onClick={onVistaPrevia}
                  disabled={loading}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generando...' : 'Vista Previa'}
                </button> */}
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Guardando...' : 'Finalizar'}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>

      {mostrarMapa && (
        <MapSelector
          onSelect={(lat, lng) => {
            setCoordenadas({ lat, lng })
            setMostrarMapa(false)
          }}
          onClose={() => setMostrarMapa(false)}
        />
      )}
    </div>
  )
}


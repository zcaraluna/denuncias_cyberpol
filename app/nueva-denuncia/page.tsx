'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dynamic from 'next/dynamic'
import Select from 'react-select'
import { departamentosParaguay } from '@/lib/data/departamentos'
import { obtenerBarriosPorCiudad } from '@/lib/data/barrios'
import { useAuth } from '@/lib/hooks/useAuth'
import { obtenerHechosPuniblesEspecificos } from '@/lib/data/hechos-punibles'

// Importar el mapa dinámicamente (solo en cliente)
const MapSelector = dynamic(() => import('@/components/MapSelector'), { ssr: false })

// Esquemas de validación
const ROLES_DENUNCIANTE = ['principal', 'co-denunciante', 'abogado'] as const
type RolDenunciante = (typeof ROLES_DENUNCIANTE)[number]

const denuncianteSchema = z
  .object({
    nombres: z.string().optional(),
    tipoDocumento: z.string().optional(),
    numeroDocumento: z.string().optional(),
    nacionalidad: z.string().optional(),
    fechaNacimiento: z.string().optional(),
    edad: z.string().optional(),
    lugarNacimiento: z.string().optional(),
    estadoCivil: z.string().optional(),
    telefono: z.string().optional(),
    correo: z.string().optional(),
    departamento: z.string().optional(),
    ciudad: z.string().optional(),
    barrio: z.string().optional(),
    calles: z.string().optional(),
    profesion: z.string().optional(),
    matricula: z.string().optional(),
    rol: z.enum(ROLES_DENUNCIANTE),
    representaA: z.string().optional().nullable(),
    conCartaPoder: z.boolean().optional(),
    cartaPoderFecha: z.string().optional(),
    cartaPoderNumero: z.string().optional(),
    cartaPoderNotario: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const esAbogado = data.rol === 'abogado'
    const validarCorreo = (valor?: string | null) => {
      if (!valor) return false
      const trimmed = valor.trim()
      if (!trimmed) return false
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    }

    const requiereValor = (condicion: boolean, path: string[], mensaje: string) => {
      if (!condicion) {
        ctx.addIssue({
          path,
          code: z.ZodIssueCode.custom,
          message: mensaje,
        })
      }
    }

    if (esAbogado) {
      requiereValor(Boolean(data.nombres?.trim()), ['nombres'], 'Ingrese el nombre completo del abogado')
      requiereValor(Boolean(data.tipoDocumento?.trim()), ['tipoDocumento'], 'Debe seleccionar un tipo de documento')
      requiereValor(Boolean(data.numeroDocumento?.trim()), ['numeroDocumento'], 'Ingrese el número de documento')
      requiereValor(Boolean(data.matricula?.trim()), ['matricula'], 'Ingrese la matrícula del abogado')
      requiereValor(Boolean(data.telefono?.trim()), ['telefono'], 'Ingrese el número de teléfono')
      if (data.correo && data.correo.trim() && !validarCorreo(data.correo)) {
        ctx.addIssue({
          path: ['correo'],
          code: z.ZodIssueCode.custom,
          message: 'Ingrese un correo válido',
        })
      }
      if (data.conCartaPoder) {
        const fechaValida = data.cartaPoderFecha ? /^\d{4}-\d{2}-\d{2}$/.test(data.cartaPoderFecha) : false
        requiereValor(fechaValida, ['cartaPoderFecha'], 'Ingrese la fecha de la carta poder (formato YYYY-MM-DD)')
        requiereValor(Boolean(data.cartaPoderNotario?.trim()), ['cartaPoderNotario'], 'Ingrese el nombre del notario')
      }
    } else {
      const fechaValida = data.fechaNacimiento ? /^\d{4}-\d{2}-\d{2}$/.test(data.fechaNacimiento) : false
      requiereValor(Boolean(data.nombres?.trim()), ['nombres'], 'Este campo es obligatorio')
      requiereValor(Boolean(data.tipoDocumento?.trim()), ['tipoDocumento'], 'Debe seleccionar un tipo de documento')
      requiereValor(Boolean(data.numeroDocumento?.trim()), ['numeroDocumento'], 'Este campo es obligatorio')
      requiereValor(Boolean(data.nacionalidad?.trim()), ['nacionalidad'], 'Seleccione una nacionalidad')
      requiereValor(fechaValida, ['fechaNacimiento'], 'Formato YYYY-MM-DD')
      requiereValor(Boolean(data.lugarNacimiento?.trim()), ['lugarNacimiento'], 'Este campo es obligatorio')
      requiereValor(Boolean(data.estadoCivil?.trim()), ['estadoCivil'], 'Este campo es obligatorio')
      requiereValor(Boolean(data.telefono?.trim()), ['telefono'], 'Este campo es obligatorio')
      if (data.correo && data.correo.trim() && !validarCorreo(data.correo)) {
        ctx.addIssue({
          path: ['correo'],
          code: z.ZodIssueCode.custom,
          message: 'Ingrese un correo válido',
        })
      }
      requiereValor(Boolean(data.departamento?.trim()), ['departamento'], 'Seleccione un departamento')
      requiereValor(Boolean(data.ciudad?.trim()), ['ciudad'], 'Seleccione una ciudad')
      requiereValor(Boolean(data.calles?.trim()), ['calles'], 'Ingrese las calles o dirección')
    }
  })

type DenuncianteFormValues = z.infer<typeof denuncianteSchema>

interface DenuncianteEnLista extends DenuncianteFormValues {
  id: string
}

const valoresInicialesDenunciante: DenuncianteFormValues = {
  nombres: '',
  tipoDocumento: '',
  numeroDocumento: '',
  nacionalidad: 'PARAGUAYA',
  fechaNacimiento: '',
  edad: '',
  lugarNacimiento: '',
  estadoCivil: '',
  telefono: '',
  correo: '',
  departamento: '',
  ciudad: '',
  barrio: '',
  calles: '',
  profesion: '',
  matricula: '',
  rol: 'principal',
  representaA: null,
  conCartaPoder: false,
  cartaPoderFecha: '',
  cartaPoderNumero: '',
  cartaPoderNotario: '',
}

const denunciaSchema = z.object({
  fechaHecho: z.string().min(1, 'Fecha requerida'),
  horaHecho: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  usarRango: z.boolean().optional(),
  fechaHechoFin: z.string().optional(),
  horaHechoFin: z.string().optional(),
  tipoDenuncia: z.string().min(1, 'Debe seleccionar un tipo'),
  otroTipo: z.string().optional(),
  lugarHecho: z.string().optional(),
  lugarHechoDepartamento: z.string().optional(),
  lugarHechoCiudad: z.string().optional(),
  lugarHechoBarrio: z.string().optional(),
  lugarHechoCalles: z.string().optional(),
  lugarHechoNoAplica: z.boolean().optional(),
  relato: z.string().min(10, 'El relato debe tener al menos 10 caracteres'),
  montoDano: z.string().optional(),
  moneda: z.string().optional(),
}).superRefine((data, ctx) => {
  // Si se usa rango, validar que fecha y hora de fin estén presentes
  if (data.usarRango) {
    if (!data.fechaHechoFin || data.fechaHechoFin.trim() === '') {
      ctx.addIssue({
        path: ['fechaHechoFin'],
        code: z.ZodIssueCode.custom,
        message: 'La fecha de fin es requerida cuando se usa un rango',
      })
    }
    if (!data.horaHechoFin || !/^\d{2}:\d{2}$/.test(data.horaHechoFin)) {
      ctx.addIssue({
        path: ['horaHechoFin'],
        code: z.ZodIssueCode.custom,
        message: 'La hora de fin es requerida y debe estar en formato HH:MM',
      })
    }
  }
  // Validar lugar del hecho solo si "No aplica" no está marcado
  if (!data.lugarHechoNoAplica) {
    if (!data.lugarHecho || data.lugarHecho.trim() === '') {
      ctx.addIssue({
        path: ['lugarHecho'],
        code: z.ZodIssueCode.custom,
        message: 'Este campo es obligatorio',
      })
    }
    if (!data.lugarHechoDepartamento || data.lugarHechoDepartamento.trim() === '') {
      ctx.addIssue({
        path: ['lugarHechoDepartamento'],
        code: z.ZodIssueCode.custom,
        message: 'Seleccione un departamento',
      })
    }
    if (!data.lugarHechoCiudad || data.lugarHechoCiudad.trim() === '') {
      ctx.addIssue({
        path: ['lugarHechoCiudad'],
        code: z.ZodIssueCode.custom,
        message: 'Seleccione una ciudad',
      })
    }

    if (!data.lugarHechoCalles || data.lugarHechoCalles.trim() === '') {
      ctx.addIssue({
        path: ['lugarHechoCalles'],
        code: z.ZodIssueCode.custom,
        message: 'Ingrese las calles o dirección',
      })
    }
  }
})

interface Usuario {
  id: number
  nombre: string
  apellido: string
  grado: string
  oficina: string
  rol: string
}

// Función para generar datos aleatorios (SOLO PARA PRUEBAS)
const generarDatosAleatorios = (
  rol: 'principal' | 'co-denunciante' | 'abogado',
  departamentos: typeof departamentosParaguay
): Partial<DenuncianteFormValues> => {
  const { obtenerBarriosPorCiudad } = require('@/lib/data/barrios')
  const nombresAleatorios = [
    'Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Luis', 'Carmen',
    'Roberto', 'Patricia', 'Miguel', 'Sofía', 'José', 'Elena', 'Francisco', 'Lucía'
  ]
  const apellidosAleatorios = [
    'García', 'López', 'Martínez', 'González', 'Rodríguez', 'Fernández',
    'Sánchez', 'Ramírez', 'Torres', 'Morales', 'Jiménez', 'Hernández',
    'Díaz', 'Cruz', 'Ortiz', 'Vargas', 'Mendoza', 'Romero'
  ]
  const lugaresNacimiento = [
    'ASUNCIÓN', 'CIUDAD DEL ESTE', 'ENCARNACIÓN', 'SAN LORENZO', 'LUQUE',
    'CAPIATÁ', 'LAMBARÉ', 'FERNANDO DE LA MORA', 'LIMPIEO', 'ÑEMBY',
    'PEDRO JUAN CABALLERO', 'VILLA HAYES', 'CONCEPCIÓN', 'VILLARRICA'
  ]
  const profesiones = [
    'COMERCIANTE', 'DOCENTE', 'EMPLEADO', 'PROFESIONAL', 'ESTUDIANTE',
    'OBRERO', 'AGRICULTOR', 'JUBILADO', 'FUNCIONARIO PÚBLICO', 'INDEPENDIENTE'
  ]
  const callesAleatorias = [
    'AVENIDA MARISCAL LÓPEZ 123', 'CALLE PARAGUARI 456', 'RUTA 2 KM 12',
    'CALLE ESTRELLA 789', 'AVENIDA ESPAÑA 321', 'CALLE CHACO 654',
    'RUTA 1 KM 8', 'AVENIDA FÉLIX BOGADO 987'
  ]

  const nombre = nombresAleatorios[Math.floor(Math.random() * nombresAleatorios.length)]
  const apellido1 = apellidosAleatorios[Math.floor(Math.random() * apellidosAleatorios.length)]
  const apellido2 = apellidosAleatorios[Math.floor(Math.random() * apellidosAleatorios.length)]
  const nombresCompletos = `${nombre} ${apellido1} ${apellido2}`.toUpperCase()

  // Generar fecha de nacimiento (entre 25 y 65 años)
  const edad = Math.floor(Math.random() * 40) + 25
  const añoNacimiento = new Date().getFullYear() - edad
  const mesNacimiento = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')
  const diaNacimiento = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')
  const fechaNacimiento = `${añoNacimiento}-${mesNacimiento}-${diaNacimiento}`

  // Seleccionar departamento y ciudad aleatorios
  const departamentoAleatorio = departamentos[Math.floor(Math.random() * departamentos.length)]
  const ciudadAleatoria =
    departamentoAleatorio.ciudades[Math.floor(Math.random() * departamentoAleatorio.ciudades.length)]

  // Seleccionar barrio aleatorio si está disponible
  const barriosDisponibles = obtenerBarriosPorCiudad(departamentoAleatorio.nombre, ciudadAleatoria)
  const barrioAleatorio = barriosDisponibles.length > 0
    ? barriosDisponibles[Math.floor(Math.random() * barriosDisponibles.length)]
    : ''

  if (rol === 'abogado') {
    const tiposDocumento = ['Cédula de Identidad Paraguaya', 'Documento de origen', 'Pasaporte']
    const tipoDoc = tiposDocumento[Math.floor(Math.random() * tiposDocumento.length)]
    const numeroDoc =
      tipoDoc === 'Pasaporte' || tipoDoc === 'Documento de origen'
        ? Math.random().toString(36).substring(2, 10).toUpperCase()
        : Math.floor(Math.random() * 9999999) + 1000000 + ''
    const matricula = Math.floor(Math.random() * 99999) + 10000 + ''
    const telefono = `098${Math.floor(Math.random() * 10000000)}`
    const correo = `abogado${Math.floor(Math.random() * 1000)}@ejemplo.com`

    return {
      rol: 'abogado',
      nombres: nombresCompletos,
      tipoDocumento: tipoDoc,
      numeroDocumento: numeroDoc,
      telefono,
      correo,
      matricula,
      conCartaPoder: Math.random() > 0.5,
      cartaPoderFecha: Math.random() > 0.5 ? fechaNacimiento : '',
      cartaPoderNotario: Math.random() > 0.5 ? 'DR. JUAN PÉREZ GARCÍA' : '',
      representaA: null,
    }
  }

  // Para denunciante principal o co-denunciante
  const tiposDocumento = ['Cédula de Identidad Paraguaya', 'Documento de origen', 'Pasaporte']
  const tipoDoc = tiposDocumento[Math.floor(Math.random() * tiposDocumento.length)]
  const numeroDoc =
    tipoDoc === 'Pasaporte' || tipoDoc === 'Documento de origen'
      ? Math.random().toString(36).substring(2, 10).toUpperCase()
      : Math.floor(Math.random() * 9999999) + 1000000 + ''
  const nacionalidades = ['PARAGUAYA', 'ARGENTINA', 'BRASILEÑA', 'BOLIVIANA']
  const estadosCiviles = ['Soltero/a', 'Casado/a', 'Viudo/a', 'Divorciado/a']
  const telefono = `098${Math.floor(Math.random() * 10000000)}`
  const correo = `denunciante${Math.floor(Math.random() * 1000)}@ejemplo.com`

  return {
    rol,
    nombres: nombresCompletos,
    tipoDocumento: tipoDoc,
    numeroDocumento: numeroDoc,
    nacionalidad: nacionalidades[Math.floor(Math.random() * nacionalidades.length)],
    fechaNacimiento,
    edad: edad.toString(),
    lugarNacimiento: lugaresNacimiento[Math.floor(Math.random() * lugaresNacimiento.length)],
    estadoCivil: estadosCiviles[Math.floor(Math.random() * estadosCiviles.length)],
    telefono,
    correo,
    departamento: departamentoAleatorio.nombre,
    ciudad: ciudadAleatoria,
    barrio: barrioAleatorio,
    calles: callesAleatorias[Math.floor(Math.random() * callesAleatorias.length)],
    profesion: profesiones[Math.floor(Math.random() * profesiones.length)],
    representaA: null,
    conCartaPoder: false,
    cartaPoderFecha: '',
    cartaPoderNotario: '',
  }
}

export default function NuevaDenunciaPage() {
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()
  const [paso, setPaso] = useState(1)
  const [autorConocido, setAutorConocido] = useState<'Conocido' | 'Desconocido' | 'No aplica'>('Desconocido')
  const [lugarHechoNoAplica, setLugarHechoNoAplica] = useState(false)
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lng: number } | null>(null)
  const [mostrarMapa, setMostrarMapa] = useState(false)
  const [loading, setLoading] = useState(false)
  const [guardandoBorrador, setGuardandoBorrador] = useState(false)
  const [borradorId, setBorradorId] = useState<number | null>(null)
  const [mostrarModalBorrador, setMostrarModalBorrador] = useState(false)
  const [descripcionFisica, setDescripcionFisica] = useState<{
    altura?: string
    complexion?: string
    postura?: string
    formaRostro?: string
    tonoPiel?: string
    texturaPiel?: string
    colorCabello?: string
    longitudCabello?: string
    texturaCabello?: string
    peinado?: string
    formaOjos?: string
    colorOjos?: string
    caracteristicasOjos?: string[]
    otrosRasgos?: string[]
    cabelloTeñido?: string
    detallesAdicionales?: string
  }>({})
  const [denunciantes, setDenunciantes] = useState<DenuncianteEnLista[]>([])
  const [denuncianteEnEdicionId, setDenuncianteEnEdicionId] = useState<string | null>(null)
  const [mostrarModalVistaPrevia, setMostrarModalVistaPrevia] = useState(false)
  const [textoVistaPrevia, setTextoVistaPrevia] = useState<string>('')
  const [generandoVistaPrevia, setGenerandoVistaPrevia] = useState(false)
  const [modoPruebas, setModoPruebas] = useState(false)
  // Capturar fecha y hora cuando se inicia la creación de la denuncia (no al finalizar)
  const [fechaHoraInicioDenuncia, setFechaHoraInicioDenuncia] = useState<{ fecha: string; hora: string } | null>(null)

  // Ref para prevenir múltiples envíos simultáneos
  const isSubmittingRef = useRef(false)

  // Cargar estado del modo pruebas desde localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('modoPruebas')
    if (savedMode !== null) {
      setModoPruebas(savedMode === 'true')
    }
  }, [])

  // Función para obtener fecha/hora actual
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

  // Capturar fecha y hora cuando se carga la página (inicio de creación de denuncia)
  // Esto solo se ejecuta para denuncias nuevas, no para borradores cargados
  useEffect(() => {
    // Si ya hay fecha/hora (por ejemplo, de un borrador cargado), no sobrescribirla
    if (fechaHoraInicioDenuncia) return

    const capturarFechaHoraInicio = async () => {
      try {
        const { fecha, hora } = await obtenerFechaHoraActual()
        setFechaHoraInicioDenuncia({ fecha, hora })
      } catch (error) {
        // Si falla, usar fecha/hora del cliente
        const now = new Date()
        const fecha = now.toLocaleDateString('es-PY', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'America/Asuncion'
        })
        const hora = now.toLocaleTimeString('es-PY', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'America/Asuncion'
        })
        setFechaHoraInicioDenuncia({ fecha, hora })
      }
    }

    capturarFechaHoraInicio()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Usar hechos punibles específicos en lugar de capítulos genéricos
  const tiposDenuncia = [
    ...obtenerHechosPuniblesEspecificos(),
    'EXTRAVÍO DE OBJETOS Y/O DOCUMENTOS'
    // 'Otro (Especificar)' - Deshabilitado temporalmente
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

  // Opciones para descripción física
  const opcionesAltura = [
    'Muy baja (≤ 1.50 m)',
    'Baja (1.51–1.64 m)',
    'Promedio (1.65–1.75 m)',
    'Alta (1.76–1.85 m)',
    'Muy alta (≥ 1.86 m)'
  ]

  const opcionesComplexion = [
    'Delgada',
    'Atlética',
    'Robusta',
    'Musculosa',
    'Normal/Promedio',
    'Voluminosa'
  ]

  const opcionesPostura = [
    'Erguida',
    'Relajada',
    'Encogida',
    'Elegante',
    'Pesada'
  ]

  const opcionesFormaRostro = [
    'Ovalado',
    'Redondo',
    'Cuadrado',
    'Rectangular',
    'Triangular',
    'Diamante'
  ]

  const opcionesTonoPiel = [
    'Muy clara',
    'Clara',
    'Trigueña / Oliva',
    'Morena',
    'Muy morena',
    'Oscura'
  ]

  const opcionesTexturaPiel = [
    'Lisa',
    'Rugosa',
    'Con pecas',
    'Con arrugas',
    'Con cicatrices visibles',
    'Con lunares'
  ]

  const opcionesColorCabello = [
    'Negro',
    'Castaño oscuro',
    'Castaño claro',
    'Rubio oscuro',
    'Rubio claro',
    'Pelirrojo',
    'Canoso',
    'Teñido'
  ]

  const opcionesLongitudCabello = [
    'Muy corto',
    'Corto',
    'Medio',
    'Largo',
    'Muy largo'
  ]

  const opcionesTexturaCabello = [
    'Liso',
    'Ondulado',
    'Rizado',
    'Afro'
  ]

  const opcionesPeinado = [
    'Suelto',
    'Recogido',
    'Moño',
    'Trenza',
    'Corte militar',
    'Flequillo'
  ]

  const opcionesFormaOjos = [
    'Almendrados',
    'Redondos',
    'Rasgados',
    'Profundos',
    'Grandes',
    'Pequeños'
  ]

  const opcionesColorOjos = [
    'Negros',
    'Cafés',
    'Verdes',
    'Azules',
    'Grises',
    'Avellana',
    'Otros'
  ]

  const opcionesCaracteristicasOjos = [
    'Ojeras',
    'Pestañas largas',
    'Pestañas cortas',
    'Cejas gruesas',
    'Cejas delgadas'
  ]

  const opcionesOtrosRasgos = [
    'Tatuajes',
    'Cicatrices',
    'Piercings',
    'Barba/bigote',
    'Lentes',
    'Hoyuelos',
    'Manera de caminar'
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

  const estadosCiviles = ['Soltero/a', 'Casado/a', 'Viudo/a', 'Divorciado/a', 'Concubinato']

  const DOMICILIO_REGEX_NUEVO = /DEPARTAMENTO\s+DE\s+([A-ZÁÉÍÓÚÑ\s]+?)(?:,\s*CIUDAD\s+DE\s+([A-ZÁÉÍÓÚÑ\s]+?))?(?:,\s*BARRIO\s+([A-ZÁÉÍÓÚÑ\s]+?))?(?:,\s*(.*))?\.?$/i
  const DOMICILIO_REGEX_ANTERIOR = /DEPARTAMENTO\s*\{([^}]+)\}\s*,\s*CIUDAD DE\s*\{([^}]+)\}\s*(?:,\s*BARRIO\s*\{([^}]+)\})?\s*,\s*\{([^}]+)\}/i

  const construirDomicilio = (departamento?: string, ciudad?: string, barrio?: string, calles?: string) => {
    const partes: string[] = []
    const dep = departamento ? departamento.toUpperCase() : ''
    const city = ciudad ? ciudad.toUpperCase() : ''
    const bar = barrio ? barrio.toUpperCase() : ''

    if (dep) {
      if (dep === 'ASUNCIÓN') {
        // omit departamento, será tratado como ciudad capital
      } else if (dep === 'CENTRAL') {
        partes.push('DEPARTAMENTO CENTRAL')
      } else {
        partes.push(`DEPARTAMENTO DE ${dep}`)
      }
    }
    if (city) {
      partes.push(`CIUDAD DE ${city}`)
    }
    if (bar) {
      partes.push(`BARRIO ${bar}`)
    }
    if (calles) {
      partes.push(calles.toUpperCase())
    }
    if (partes.length === 0) return ''
    return partes.join(', ')
  }

  // Función para generar el texto de descripción física a partir de los valores seleccionados
  const generarTextoDescripcionFisica = (desc: typeof descripcionFisica): string => {
    const partes: string[] = []

    // 1. Constitución física
    const constitucion: string[] = []
    if (desc.altura) constitucion.push(`altura ${desc.altura}`)
    if (desc.complexion) constitucion.push(`complexión ${desc.complexion}`)
    if (desc.postura) constitucion.push(`postura ${desc.postura}`)
    if (constitucion.length > 0) partes.push(`Constitución física: ${constitucion.join(', ')}.`)

    // 2. Forma del rostro
    if (desc.formaRostro) partes.push(`Forma del rostro: ${desc.formaRostro}.`)

    // 3. Piel
    const piel: string[] = []
    if (desc.tonoPiel) piel.push(`tono ${desc.tonoPiel}`)
    if (desc.texturaPiel) piel.push(`textura ${desc.texturaPiel}`)
    if (piel.length > 0) partes.push(`Piel: ${piel.join(', ')}.`)

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
    if (cabello.length > 0) partes.push(`Cabello: ${cabello.join(', ')}.`)

    // 5. Ojos
    const ojos: string[] = []
    if (desc.formaOjos) ojos.push(`forma ${desc.formaOjos}`)
    if (desc.colorOjos) ojos.push(`color ${desc.colorOjos}`)
    if (desc.caracteristicasOjos && desc.caracteristicasOjos.length > 0) {
      ojos.push(desc.caracteristicasOjos.join(', '))
    }
    if (ojos.length > 0) partes.push(`Ojos: ${ojos.join(', ')}.`)

    // 6. Otros rasgos distintivos
    if (desc.otrosRasgos && desc.otrosRasgos.length > 0) {
      partes.push(`Otros rasgos distintivos: ${desc.otrosRasgos.join(', ')}.`)
    }

    return partes.join(' ')
  }

  const descomponerDomicilio = (domicilio: string | null | undefined) => {
    if (!domicilio) return { departamento: '', ciudad: '', barrio: '', calles: '' }

    const matchNuevo = DOMICILIO_REGEX_NUEVO.exec(domicilio)
    if (matchNuevo) {
      const departamento = (matchNuevo[1] || '').trim().toUpperCase()
      const ciudad = (matchNuevo[2] || '').trim().toUpperCase()
      const barrio = (matchNuevo[3] || '').trim().toUpperCase()
      const calles = (matchNuevo[4] || '').replace(/\.$/, '').trim().toUpperCase()
      return {
        departamento,
        ciudad,
        barrio,
        calles,
      }
    }

    const matchAnterior = DOMICILIO_REGEX_ANTERIOR.exec(domicilio)
    if (matchAnterior) {
      return {
        departamento: matchAnterior[1].trim().toUpperCase(),
        ciudad: matchAnterior[2].trim().toUpperCase(),
        barrio: (matchAnterior[3] || '').trim().toUpperCase(),
        calles: matchAnterior[4].trim().toUpperCase(),
      }
    }

    // Si no coincide con ningún patrón, intentar parsearlo como calles solamente
    return { departamento: '', ciudad: '', barrio: '', calles: domicilio.replace(/\.$/, '').trim().toUpperCase() }
  }

  const {
    register: registerDenunciante,
    handleSubmit: handleSubmitDenunciante,
    formState: { errors: errorsDenunciante },
    watch: watchDenunciante,
    setValue: setValueDenunciante,
    control: controlDenunciante,
    reset: resetDenunciante,
    getValues: getValuesDenunciante,
  } = useForm<z.infer<typeof denuncianteSchema>>({
    resolver: zodResolver(denuncianteSchema),
    defaultValues: {
      ...valoresInicialesDenunciante,
    },
  })

  const tipoDocumento = watchDenunciante('tipoDocumento')
  const departamentoSeleccionado = watchDenunciante('departamento')
  const ciudadSeleccionada = watchDenunciante('ciudad')
  const barrioSeleccionado = watchDenunciante('barrio')
  const rolSeleccionado = watchDenunciante('rol')
  const matriculaActual = watchDenunciante('matricula')

  const principalActual = obtenerDenunciantePrincipal()

  const denunciantesOrdenados = useMemo(() => {
    const copia = [...denunciantes]
    return copia.sort((a, b) => {
      if (a.rol === 'principal' && b.rol !== 'principal') return -1
      if (b.rol === 'principal' && a.rol !== 'principal') return 1
      return 0
    })
  }, [denunciantes])

  const existePrincipalRegistrado = useMemo(
    () =>
      denunciantes.some(
        (denunciante) => denunciante.rol === 'principal' && denunciante.id !== denuncianteEnEdicionId
      ),
    [denunciantes, denuncianteEnEdicionId]
  )

  const registroDenuncianteEnEdicion = obtenerDenunciantePorId(denuncianteEnEdicionId)
  const esAbogado = rolSeleccionado === 'abogado'

  const esFormularioDenuncianteVacio = (data: DenuncianteFormValues) => {
    const camposRelevantes: Array<string | null | undefined> = [
      data.nombres,
      data.tipoDocumento,
      data.numeroDocumento,
      data.fechaNacimiento,
      data.lugarNacimiento,
      data.estadoCivil,
      data.telefono,
      data.correo,
      data.departamento,
      data.ciudad,
      data.calles,
      data.profesion,
      data.matricula,
    ]

    const nacionalidadDistintaPorDefecto =
      data.nacionalidad && data.nacionalidad.trim() !== '' && data.nacionalidad.trim().toUpperCase() !== 'PARAGUAYA'

    const hayDatoRelevante =
      camposRelevantes.some((campo) => typeof campo === 'string' && campo.trim() !== '') || nacionalidadDistintaPorDefecto

    const onlyRepresentaA = !hayDatoRelevante && !!data.representaA && data.rol === 'abogado'

    return !hayDatoRelevante && !onlyRepresentaA
  }

  // Establecer PARAGUAYA como valor por defecto
  useEffect(() => {
    const currentNacionalidad = watchDenunciante('nacionalidad')
    if (!currentNacionalidad || currentNacionalidad === '') {
      setValueDenunciante('nacionalidad', 'PARAGUAYA')
    }
  }, [setValueDenunciante, watchDenunciante])

  useEffect(() => {
    const coActuales = denunciantes.filter((denunciante) => denunciante.rol === 'co-denunciante')
    if (coActuales.length >= 2 && rolSeleccionado === 'co-denunciante') {
      setValueDenunciante('rol', 'abogado')
    }
  }, [denunciantes, rolSeleccionado, setValueDenunciante])

  // Función para completar automáticamente el formulario con datos aleatorios (SOLO PARA PRUEBAS)
  const completarFormularioAutomatico = () => {
    const rolActual = watchDenunciante('rol') || 'principal'
    const datos = generarDatosAleatorios(rolActual as 'principal' | 'co-denunciante' | 'abogado', departamentosParaguay)

    // Completar todos los campos con los datos aleatorios
    Object.entries(datos).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        setValueDenunciante(key as keyof DenuncianteFormValues, value as any)
      }
    })

    // Calcular edad si hay fecha de nacimiento
    if (datos.fechaNacimiento && !esAbogado) {
      const edadCalculada = calcularEdad(datos.fechaNacimiento)
      setValueDenunciante('edad', edadCalculada)
    }
  }

  // Función para completar automáticamente los datos del autor conocido (SOLO PARA PRUEBAS)
  const completarAutorAutomatico = () => {
    const nombresAleatorios = [
      'Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Luis', 'Carmen',
      'Roberto', 'Patricia', 'Miguel', 'Sofía', 'José', 'Elena', 'Francisco', 'Lucía'
    ]
    const apellidosAleatorios = [
      'García', 'López', 'Martínez', 'González', 'Rodríguez', 'Fernández',
      'Sánchez', 'Ramírez', 'Torres', 'Morales', 'Jiménez', 'Hernández',
      'Díaz', 'Cruz', 'Ortiz', 'Vargas', 'Mendoza', 'Romero'
    ]
    const lugaresNacimiento = [
      'ASUNCIÓN', 'CIUDAD DEL ESTE', 'ENCARNACIÓN', 'SAN LORENZO', 'LUQUE',
      'CAPIATÁ', 'LAMBARÉ', 'FERNANDO DE LA MORA', 'LIMPIEO', 'ÑEMBY',
      'PEDRO JUAN CABALLERO', 'VILLA HAYES', 'CONCEPCIÓN', 'VILLARRICA'
    ]
    const callesAleatorias = [
      'AVENIDA MARISCAL LÓPEZ 123', 'CALLE PARAGUARI 456', 'RUTA 2 KM 12',
      'CALLE ESTRELLA 789', 'AVENIDA ESPAÑA 321', 'CALLE CHACO 654',
      'RUTA 1 KM 8', 'AVENIDA FÉLIX BOGADO 987'
    ]

    const nombre = nombresAleatorios[Math.floor(Math.random() * nombresAleatorios.length)]
    const apellido1 = apellidosAleatorios[Math.floor(Math.random() * apellidosAleatorios.length)]
    const apellido2 = apellidosAleatorios[Math.floor(Math.random() * apellidosAleatorios.length)]
    const nombresCompletos = `${nombre} ${apellido1} ${apellido2}`.toUpperCase()

    // Generar fecha de nacimiento (entre 25 y 65 años)
    const edad = Math.floor(Math.random() * 40) + 25
    const añoNacimiento = new Date().getFullYear() - edad
    const mesNacimiento = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')
    const diaNacimiento = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')
    const fechaNacimiento = `${añoNacimiento}-${mesNacimiento}-${diaNacimiento}`

    const nacionalidades = ['PARAGUAYA', 'ARGENTINA', 'BRASILEÑA', 'BOLIVIANA']
    const estadosCiviles = ['Soltero/a', 'Casado/a', 'Viudo/a', 'Divorciado/a']
    const profesiones = [
      'COMERCIANTE', 'DOCENTE', 'EMPLEADO', 'PROFESIONAL', 'ESTUDIANTE',
      'OBRERO', 'AGRICULTOR', 'JUBILADO', 'FUNCIONARIO PÚBLICO', 'INDEPENDIENTE'
    ]
    const telefono = `098${Math.floor(Math.random() * 10000000)}`
    const cedula = Math.floor(Math.random() * 9999999) + 1000000 + ''

    // Completar campos
    setValueAutor('nombre', nombresCompletos)
    setValueAutor('cedula', cedula)
    // Seleccionar departamento y ciudad aleatorios
    const departamentoAleatorio = departamentosParaguay[Math.floor(Math.random() * departamentosParaguay.length)]
    const ciudadAleatoria =
      departamentoAleatorio.ciudades[Math.floor(Math.random() * departamentoAleatorio.ciudades.length)]

    // Seleccionar barrio aleatorio si está disponible
    const barriosDisponibles = obtenerBarriosPorCiudad(departamentoAleatorio.nombre, ciudadAleatoria)
    const barrioAleatorio = barriosDisponibles.length > 0
      ? barriosDisponibles[Math.floor(Math.random() * barriosDisponibles.length)]
      : ''

    setValueAutor('departamento', departamentoAleatorio.nombre)
    setValueAutor('ciudad', ciudadAleatoria)
    setValueAutor('barrio', barrioAleatorio)
    setValueAutor('calles', callesAleatorias[Math.floor(Math.random() * callesAleatorias.length)])
    setValueAutor('nacionalidad', nacionalidades[Math.floor(Math.random() * nacionalidades.length)])
    setValueAutor('estadoCivil', estadosCiviles[Math.floor(Math.random() * estadosCiviles.length)])
    setValueAutor('fechaNacimiento', fechaNacimiento)
    setValueAutor('lugarNacimiento', lugaresNacimiento[Math.floor(Math.random() * lugaresNacimiento.length)])
    setValueAutor('telefono', telefono)
    setValueAutor('profesion', profesiones[Math.floor(Math.random() * profesiones.length)])

    // Calcular edad automáticamente
    const edadCalculada = calcularEdad(fechaNacimiento)
    setValueAutor('edad', edadCalculada)
  }

  useEffect(() => {
    if (rolSeleccionado !== 'abogado' && matriculaActual && matriculaActual.trim() !== '') {
      setValueDenunciante('matricula', '')
    }
  }, [rolSeleccionado, matriculaActual, setValueDenunciante])

  const generarIdDenunciante = () => {
    if (typeof window !== 'undefined' && window.crypto && 'randomUUID' in window.crypto) {
      return window.crypto.randomUUID()
    }
    return `den-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }

  function obtenerDenunciantePrincipal(lista: DenuncianteEnLista[] = denunciantes) {
    return lista.find((denunciante) => denunciante.rol === 'principal') || null
  }

  const obtenerRolSugerido = (lista: DenuncianteEnLista[] = denunciantes): RolDenunciante =>
    lista.some((denunciante) => denunciante.rol === 'principal') ? 'co-denunciante' : 'principal'

  const resetFormularioDenunciante = (rolPorDefecto: RolDenunciante = obtenerRolSugerido()) => {
    resetDenunciante({
      ...valoresInicialesDenunciante,
      rol: rolPorDefecto,
      representaA: null,
    })
  }

  function obtenerDenunciantePorId(id?: string | null) {
    if (!id) return null
    return denunciantes.find((denunciante) => denunciante.id === id) || null
  }

  const guardarDenuncianteEnLista = (
    data: DenuncianteFormValues,
    opciones: { mantenerFormulario?: boolean } = {}
  ): DenuncianteEnLista[] | null => {
    if (data.rol !== 'principal' && esFormularioDenuncianteVacio(data)) {
      if (!opciones.mantenerFormulario) {
        resetFormularioDenunciante(obtenerRolSugerido())
      }
      return denunciantes
    }

    const registro: DenuncianteEnLista = {
      id: denuncianteEnEdicionId ?? generarIdDenunciante(),
      ...data,
      representaA: null,
    }

    const listaSinActual = denunciantes.filter((denunciante) => denunciante.id !== registro.id)

    if (registro.rol === 'principal' && listaSinActual.some((denunciante) => denunciante.rol === 'principal')) {
      alert('Ya existe un denunciante principal. Edite el registro existente si desea modificarlo.')
      return null
    }

    if (registro.rol === 'abogado') {
      const principalTarget = obtenerDenunciantePrincipal(listaSinActual)
      if (!principalTarget) {
        alert('Debes registrar un denunciante principal antes de agregar un abogado.')
        return null
      }
      registro.representaA = principalTarget.id
    }

    if (registro.rol === 'co-denunciante') {
      const coDenunciantesExistentes = listaSinActual.filter((denunciante) => denunciante.rol === 'co-denunciante')
      if (coDenunciantesExistentes.length >= 2) {
        alert('Solo se permiten hasta dos co-denunciantes en la denuncia.')
        return null
      }
    }

    const nuevaLista = [...listaSinActual, registro]

    if (!nuevaLista.some((denunciante) => denunciante.rol === 'principal')) {
      alert('Debe existir al menos un denunciante principal.')
      return null
    }

    setDenunciantes(nuevaLista)
    setDenuncianteEnEdicionId(null)

    if (!opciones.mantenerFormulario) {
      resetFormularioDenunciante(obtenerRolSugerido(nuevaLista))
    }

    return nuevaLista
  }

  const manejarAgregarDenunciante = () => {
    handleSubmitDenunciante((datos) => {
      guardarDenuncianteEnLista(datos)
    })()
  }

  const manejarCancelarEdicion = () => {
    setDenuncianteEnEdicionId(null)
    resetFormularioDenunciante()
  }

  const manejarEditarDenunciante = (id: string) => {
    const registro = denunciantes.find((denunciante) => denunciante.id === id)
    if (!registro) return
    setDenuncianteEnEdicionId(id)

    // Parsear el domicilio completo en sus componentes
    const domicilioCompleto = [
      registro.departamento,
      registro.ciudad,
      registro.barrio,
      registro.calles
    ].filter(Boolean).join(', ')

    const domicilioParsed = descomponerDomicilio(domicilioCompleto)

    const { id: _id, ...resto } = registro
    resetDenunciante({
      ...resto,
      departamento: domicilioParsed.departamento || '',
      ciudad: domicilioParsed.ciudad || '',
      barrio: domicilioParsed.barrio || '',
      calles: domicilioParsed.calles || '',
      representaA: registro.rol === 'abogado' ? registro.representaA : null,
    })
  }

  const manejarEliminarDenunciante = (id: string) => {
    let listaActualizada = denunciantes.filter((denunciante) => denunciante.id !== id)
    const abogadosDependientes = listaActualizada.filter(
      (denunciante) => denunciante.rol === 'abogado' && denunciante.representaA === id
    )

    if (abogadosDependientes.length > 0) {
      alert('También se eliminarán los abogados vinculados a la persona seleccionada.')
      listaActualizada = listaActualizada.filter(
        (denunciante) => !(denunciante.rol === 'abogado' && denunciante.representaA === id)
      )
    }

    if (listaActualizada.length === 0) {
      resetFormularioDenunciante('principal')
    } else {
      const nuevoRol = obtenerRolSugerido(listaActualizada)
      if (denuncianteEnEdicionId === id || abogadosDependientes.some((abogado) => abogado.id === denuncianteEnEdicionId)) {
        resetFormularioDenunciante(nuevoRol)
        setDenuncianteEnEdicionId(null)
      }
    }
    setDenunciantes(listaActualizada)
    if (listaActualizada.length > 0 && !listaActualizada.some((denunciante) => denunciante.rol === 'principal')) {
      alert('Recuerda asignar un nuevo denunciante principal antes de continuar con la denuncia.')
    }
  }

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
    setValue: setValueDenuncia,
  } = useForm<z.infer<typeof denunciaSchema>>({
    resolver: zodResolver(denunciaSchema),
  })

  const tipoDenuncia = watchDenuncia('tipoDenuncia')
  const usarRango = watchDenuncia('usarRango')
  const lugarHechoDepartamento = watchDenuncia('lugarHechoDepartamento')
  const lugarHechoCiudad = watchDenuncia('lugarHechoCiudad')

  // Opciones para tipo de denuncia (react-select)
  const tiposDenunciaOptions = useMemo(
    () => tiposDenuncia.map((tipo) => ({ value: tipo, label: tipo })),
    []
  )

  // Opciones de departamento y ciudad para lugar del hecho
  const lugarHechoDepartamentoOptions = useMemo(
    () => departamentosParaguay.map((dep) => ({ value: dep.nombre, label: dep.nombre })),
    []
  )

  const lugarHechoCiudadOptions = useMemo(() => {
    if (!lugarHechoDepartamento) return []
    const departamento = departamentosParaguay.find((dep) => dep.nombre === lugarHechoDepartamento)
    if (!departamento) return []
    return departamento.ciudades.map((ciudad) => ({ value: ciudad, label: ciudad }))
  }, [lugarHechoDepartamento])

  const lugarHechoBarrioOptions = useMemo(() => {
    if (!lugarHechoDepartamento || !lugarHechoCiudad) return []
    const barrios = obtenerBarriosPorCiudad(lugarHechoDepartamento, lugarHechoCiudad)
    return barrios.map((barrio) => ({ value: barrio, label: barrio }))
  }, [lugarHechoDepartamento, lugarHechoCiudad])

  const departamentoOptions = useMemo(
    () => departamentosParaguay.map((dep) => ({ value: dep.nombre, label: dep.nombre })),
    []
  )

  const ciudadOptions = useMemo(() => {
    if (!departamentoSeleccionado) return []
    const departamento = departamentosParaguay.find((dep) => dep.nombre === departamentoSeleccionado)
    if (!departamento) return []
    return departamento.ciudades.map((ciudad) => ({ value: ciudad, label: ciudad }))
  }, [departamentoSeleccionado])

  const barrioOptions = useMemo(() => {
    if (!departamentoSeleccionado || !ciudadSeleccionada) return []
    const barrios = obtenerBarriosPorCiudad(departamentoSeleccionado, ciudadSeleccionada)
    return barrios.map((barrio) => ({ value: barrio, label: barrio }))
  }, [departamentoSeleccionado, ciudadSeleccionada])

  useEffect(() => {
    if (!departamentoSeleccionado) {
      if (ciudadSeleccionada) {
        setValueDenunciante('ciudad', '')
      }
      if (barrioSeleccionado) {
        setValueDenunciante('barrio', '')
      }
      return
    }

    const departamento = departamentosParaguay.find((dep) => dep.nombre === departamentoSeleccionado)
    if (departamento && ciudadSeleccionada && !departamento.ciudades.includes(ciudadSeleccionada)) {
      setValueDenunciante('ciudad', '')
      setValueDenunciante('barrio', '')
    }
  }, [departamentoSeleccionado, ciudadSeleccionada, barrioSeleccionado, setValueDenunciante])

  // Efecto para resetear barrio cuando cambia la ciudad
  useEffect(() => {
    if (barrioSeleccionado && ciudadSeleccionada && departamentoSeleccionado) {
      const barriosDisponibles = obtenerBarriosPorCiudad(departamentoSeleccionado, ciudadSeleccionada)
      if (!barriosDisponibles.includes(barrioSeleccionado)) {
        setValueDenunciante('barrio', '')
      }
    } else if (!ciudadSeleccionada && barrioSeleccionado) {
      setValueDenunciante('barrio', '')
    }
  }, [ciudadSeleccionada, departamentoSeleccionado, barrioSeleccionado, setValueDenunciante])

  const {
    register: registerAutor,
    handleSubmit: handleSubmitAutor,
    formState: { errors: errorsAutor },
    watch: watchAutor,
    control: controlAutor,
    setValue: setValueAutor,
  } = useForm<any>()

  const fechaNacimientoAutor = watchAutor('fechaNacimiento')
  const departamentoAutor = watchAutor('departamento')
  const ciudadAutor = watchAutor('ciudad')
  const barrioAutor = watchAutor('barrio')

  // Opciones de departamento y ciudad para el autor
  const departamentoAutorOptions = useMemo(
    () => departamentosParaguay.map((dep) => ({ value: dep.nombre, label: dep.nombre })),
    []
  )

  const ciudadAutorOptions = useMemo(() => {
    if (!departamentoAutor) return []
    const departamento = departamentosParaguay.find((dep) => dep.nombre === departamentoAutor)
    if (!departamento) return []
    return departamento.ciudades.map((ciudad) => ({ value: ciudad, label: ciudad }))
  }, [departamentoAutor])

  const barrioAutorOptions = useMemo(() => {
    if (!departamentoAutor || !ciudadAutor) return []
    const barrios = obtenerBarriosPorCiudad(departamentoAutor, ciudadAutor)
    return barrios.map((barrio) => ({ value: barrio, label: barrio }))
  }, [departamentoAutor, ciudadAutor])

  // Efecto para manejar cambio de departamento del autor
  useEffect(() => {
    if (!departamentoAutor) {
      if (ciudadAutor) {
        setValueAutor('ciudad', '')
      }
      if (barrioAutor) {
        setValueAutor('barrio', '')
      }
      return
    }

    const departamento = departamentosParaguay.find((dep) => dep.nombre === departamentoAutor)
    if (departamento && ciudadAutor && !departamento.ciudades.includes(ciudadAutor)) {
      setValueAutor('ciudad', '')
      setValueAutor('barrio', '')
    }
  }, [departamentoAutor, ciudadAutor, barrioAutor, setValueAutor])

  // Efecto para resetear barrio cuando cambia la ciudad del autor
  useEffect(() => {
    if (barrioAutor && ciudadAutor && departamentoAutor) {
      const barriosDisponibles = obtenerBarriosPorCiudad(departamentoAutor, ciudadAutor)
      if (!barriosDisponibles.includes(barrioAutor)) {
        setValueAutor('barrio', '')
      }
    } else if (!ciudadAutor && barrioAutor) {
      setValueAutor('barrio', '')
    }
  }, [ciudadAutor, departamentoAutor, barrioAutor, setValueAutor])

  const lugarHechoBarrio = watchDenuncia('lugarHechoBarrio')

  // Efecto para manejar cambio de departamento del lugar del hecho
  useEffect(() => {
    if (!lugarHechoDepartamento) {
      if (lugarHechoCiudad) {
        setValueDenuncia('lugarHechoCiudad', '')
      }
      if (lugarHechoBarrio) {
        setValueDenuncia('lugarHechoBarrio', '')
      }
      return
    }

    const departamento = departamentosParaguay.find((dep) => dep.nombre === lugarHechoDepartamento)
    if (departamento && lugarHechoCiudad && !departamento.ciudades.includes(lugarHechoCiudad)) {
      setValueDenuncia('lugarHechoCiudad', '')
      setValueDenuncia('lugarHechoBarrio', '')
    }
  }, [lugarHechoDepartamento, lugarHechoCiudad, lugarHechoBarrio, setValueDenuncia])

  // Efecto para resetear barrio del lugar del hecho cuando cambia la ciudad
  useEffect(() => {
    if (lugarHechoBarrio && lugarHechoCiudad && lugarHechoDepartamento) {
      const barriosDisponibles = obtenerBarriosPorCiudad(lugarHechoDepartamento, lugarHechoCiudad)
      if (!barriosDisponibles.includes(lugarHechoBarrio)) {
        setValueDenuncia('lugarHechoBarrio', '')
      }
    } else if (!lugarHechoCiudad && lugarHechoBarrio) {
      setValueDenuncia('lugarHechoBarrio', '')
    }
  }, [lugarHechoCiudad, lugarHechoDepartamento, lugarHechoBarrio, setValueDenuncia])

  // Efecto para construir lugarHecho automáticamente cuando cambian los campos
  useEffect(() => {
    const dep = watchDenuncia('lugarHechoDepartamento')
    const ciu = watchDenuncia('lugarHechoCiudad')
    const bar = watchDenuncia('lugarHechoBarrio')
    const call = watchDenuncia('lugarHechoCalles')
    const lugarHechoConstruido = construirDomicilio(dep, ciu, bar, call)
    if (lugarHechoConstruido) {
      setValueDenuncia('lugarHecho', lugarHechoConstruido, { shouldValidate: false })
    }
  }, [lugarHechoDepartamento, lugarHechoCiudad, lugarHechoBarrio, watchDenuncia('lugarHechoCalles'), setValueDenuncia])

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

  const construirDenunciantePayload = (data: z.infer<typeof denuncianteSchema>) => {
    const { rol: _rol, representaA: _representaA, ...datos } = data
    const departamento = datos.departamento?.toUpperCase() || ''
    const ciudad = datos.ciudad?.toUpperCase() || ''
    const barrio = datos.barrio?.toUpperCase() || ''
    const calles = datos.calles?.toUpperCase() || ''
    const domicilio = construirDomicilio(
      departamento || undefined,
      ciudad || undefined,
      barrio || undefined,
      calles || undefined
    )
    const edadCalculada = datos.fechaNacimiento ? calcularEdad(datos.fechaNacimiento) : ''

    return {
      nombres: datos.nombres?.toUpperCase() || '',
      tipoDocumento: datos.tipoDocumento || '',
      numeroDocumento: datos.numeroDocumento?.toUpperCase() || '',
      nacionalidad: datos.nacionalidad?.toUpperCase() || '',
      estadoCivil: datos.estadoCivil?.toUpperCase() || '',
      fechaNacimiento: datos.fechaNacimiento,
      lugarNacimiento: datos.lugarNacimiento?.toUpperCase() || '',
      telefono: datos.telefono?.toUpperCase() || '',
      correo: datos.correo ? datos.correo.trim().toLowerCase() : null,
      domicilio: domicilio || null,
      departamento: departamento || null,
      ciudad: ciudad || null,
      calles: calles || null,
      profesion: datos.profesion?.toUpperCase() || null,
      edad: datos.edad || edadCalculada,
      matricula: datos.matricula?.toUpperCase() || null,
    }
  }

  const construirColeccionDenunciantesPayload = (lista: DenuncianteEnLista[]) =>
    lista.map((denunciante) => {
      const representado =
        denunciante.rol === 'abogado'
          ? lista.find((item) => item.id === denunciante.representaA) || null
          : null
      return {
        id: denunciante.id,
        rol: denunciante.rol,
        representaA: denunciante.rol === 'abogado' ? denunciante.representaA || null : null,
        representaDocumento:
          denunciante.rol === 'abogado' ? representado?.numeroDocumento || null : null,
        conCartaPoder: denunciante.rol === 'abogado' ? denunciante.conCartaPoder || false : false,
        cartaPoderFecha: denunciante.rol === 'abogado' ? denunciante.cartaPoderFecha || null : null,
        cartaPoderNotario: denunciante.rol === 'abogado' ? denunciante.cartaPoderNotario?.toUpperCase() || null : null,
        datos: construirDenunciantePayload(denunciante),
      }
    })

  const cargarBorrador = async (id: number) => {
    try {
      const response = await fetch(`/api/denuncias/ver/${id}`, { cache: 'no-store' })
      if (!response.ok) return

      const data = await response.json()
      setBorradorId(data.id)

      // Restaurar la fecha/hora original del borrador si existe
      if (data.fecha_denuncia && data.hora_denuncia) {
        // Convertir fecha de YYYY-MM-DD a DD/MM/YYYY para el formato esperado
        const fechaParts = data.fecha_denuncia.split('-')
        const fechaFormateada = `${fechaParts[2]}/${fechaParts[1]}/${fechaParts[0]}`
        setFechaHoraInicioDenuncia({ fecha: fechaFormateada, hora: data.hora_denuncia })
      }

      const involucradosApi = Array.isArray(data.denunciantes_involucrados)
        ? data.denunciantes_involucrados
        : []

      let listaDenunciantes: DenuncianteEnLista[] = []

      if (involucradosApi.length > 0) {
        const transformarFila = (fila: any): DenuncianteEnLista => {
          let fechaNacimientoISO = ''
          if (fila.fecha_nacimiento) {
            try {
              fechaNacimientoISO = new Date(fila.fecha_nacimiento).toISOString().split('T')[0]
            } catch {
              fechaNacimientoISO = ''
            }
          }

          const domicilioParsed = descomponerDomicilio(fila.domicilio)

          return {
            ...valoresInicialesDenunciante,
            id: String(fila.denunciante_id),
            nombres: fila.nombres || '',
            tipoDocumento: fila.tipo_documento || '',
            numeroDocumento: fila.cedula || '',
            nacionalidad: fila.nacionalidad || 'PARAGUAYA',
            estadoCivil: fila.estado_civil || '',
            edad: fila.edad ? String(fila.edad) : '',
            fechaNacimiento: fechaNacimientoISO,
            lugarNacimiento: fila.lugar_nacimiento || '',
            telefono: fila.telefono || '',
            correo: fila.correo || '',
            departamento: domicilioParsed.departamento || '',
            ciudad: domicilioParsed.ciudad || '',
            barrio: domicilioParsed.barrio || '',
            calles: domicilioParsed.calles || '',
            profesion: fila.profesion || '',
            matricula: fila.matricula || '',
            rol: (fila.rol as RolDenunciante) || 'co-denunciante',
            representaA:
              fila.rol === 'abogado' && fila.representa_denunciante_id
                ? String(fila.representa_denunciante_id)
                : null,
            conCartaPoder: fila.con_carta_poder || false,
            cartaPoderFecha: fila.carta_poder_fecha ? new Date(fila.carta_poder_fecha).toISOString().split('T')[0] : '',
            cartaPoderNotario: fila.carta_poder_notario || '',
          }
        }

        listaDenunciantes = involucradosApi.map(transformarFila)
        const principalApi =
          involucradosApi.find((fila: any) => fila.rol === 'principal') || involucradosApi[0]
        const principalTransformado =
          listaDenunciantes.find((item) => item.id === String(principalApi.denunciante_id)) ||
          transformarFila(principalApi)

        setValueDenunciante('nombres', principalTransformado.nombres)
        setValueDenunciante('tipoDocumento', principalTransformado.tipoDocumento || 'Cédula de Identidad Paraguaya')
        setValueDenunciante('numeroDocumento', principalTransformado.numeroDocumento || '')
        setValueDenunciante('nacionalidad', principalTransformado.nacionalidad || 'PARAGUAYA')
        setValueDenunciante('estadoCivil', principalTransformado.estadoCivil || '')
        setValueDenunciante('edad', principalTransformado.edad || '')
        setValueDenunciante('fechaNacimiento', principalTransformado.fechaNacimiento || '')
        setValueDenunciante('lugarNacimiento', principalTransformado.lugarNacimiento || '')
        setValueDenunciante('telefono', principalTransformado.telefono || '')
        setValueDenunciante('profesion', principalTransformado.profesion || '')
        setValueDenunciante('correo', principalTransformado.correo || '')
        setValueDenunciante('departamento', principalTransformado.departamento || '')
        setValueDenunciante('ciudad', principalTransformado.ciudad || '')
        setValueDenunciante('calles', principalTransformado.calles || '')
        setValueDenunciante('rol', principalTransformado.rol)
        setValueDenunciante('representaA', null)
        setValueDenunciante('matricula', principalTransformado.matricula || '')
        setValueDenunciante('conCartaPoder', principalTransformado.conCartaPoder || false)
        setValueDenunciante('cartaPoderFecha', principalTransformado.cartaPoderFecha || '')
        setValueDenunciante('cartaPoderNumero', principalTransformado.cartaPoderNumero || '')
        setValueDenunciante('cartaPoderNotario', principalTransformado.cartaPoderNotario || '')

        setDenunciantes(listaDenunciantes)
        setDenuncianteEnEdicionId(principalTransformado.id)
      } else if (data.nombres_denunciante) {
        let fechaNacimientoISO = ''
        if (data.fecha_nacimiento) {
          try {
            fechaNacimientoISO = new Date(data.fecha_nacimiento).toISOString().split('T')[0]
          } catch {
            fechaNacimientoISO = ''
          }
        }

        setValueDenunciante('nombres', data.nombres_denunciante)
        setValueDenunciante('tipoDocumento', data.tipo_documento || 'Cédula de Identidad Paraguaya')
        setValueDenunciante('numeroDocumento', data.cedula)
        setValueDenunciante('nacionalidad', data.nacionalidad)
        setValueDenunciante('estadoCivil', data.estado_civil)
        setValueDenunciante('edad', data.edad?.toString() || '')
        setValueDenunciante('fechaNacimiento', fechaNacimientoISO)
        setValueDenunciante('lugarNacimiento', data.lugar_nacimiento)
        setValueDenunciante('telefono', data.telefono)
        if (data.profesion) setValueDenunciante('profesion', data.profesion)
        setValueDenunciante('correo', data.correo || '')
        setValueDenunciante('matricula', data.matricula || '')

        const domicilioParsed = descomponerDomicilio(data.domicilio)
        const departamentoValido =
          domicilioParsed.departamento && departamentosParaguay.some((dep) => dep.nombre === domicilioParsed.departamento)

        if (departamentoValido) {
          setValueDenunciante('departamento', domicilioParsed.departamento)
          const departamentoActual = departamentosParaguay.find((dep) => dep.nombre === domicilioParsed.departamento)
          if (departamentoActual && domicilioParsed.ciudad && departamentoActual.ciudades.includes(domicilioParsed.ciudad)) {
            setValueDenunciante('ciudad', domicilioParsed.ciudad)
            // Intentar setear el barrio si está disponible
            if (domicilioParsed.barrio) {
              const barriosDisponibles = obtenerBarriosPorCiudad(domicilioParsed.departamento, domicilioParsed.ciudad)
              if (barriosDisponibles.includes(domicilioParsed.barrio)) {
                setValueDenunciante('barrio', domicilioParsed.barrio)
              } else {
                setValueDenunciante('barrio', '')
              }
            } else {
              setValueDenunciante('barrio', '')
            }
          } else {
            setValueDenunciante('ciudad', '')
            setValueDenunciante('barrio', '')
          }
          setValueDenunciante('calles', domicilioParsed.calles || '')
        } else {
          setValueDenunciante('departamento', '')
          setValueDenunciante('ciudad', '')
          setValueDenunciante('barrio', '')
          setValueDenunciante('calles', domicilioParsed.calles || '')
        }

        setValueDenunciante('rol', 'principal')
        setValueDenunciante('representaA', null)

        const idGenerado = generarIdDenunciante()
        const registroPrincipal: DenuncianteEnLista = {
          ...valoresInicialesDenunciante,
          id: idGenerado,
          nombres: data.nombres_denunciante || '',
          tipoDocumento: data.tipo_documento || 'Cédula de Identidad Paraguaya',
          numeroDocumento: data.cedula || '',
          nacionalidad: data.nacionalidad || 'PARAGUAYA',
          estadoCivil: data.estado_civil || '',
          edad: data.edad?.toString() || '',
          fechaNacimiento: fechaNacimientoISO,
          lugarNacimiento: data.lugar_nacimiento || '',
          telefono: data.telefono || '',
          correo: data.correo || '',
          departamento: domicilioParsed.departamento || '',
          ciudad: domicilioParsed.ciudad || '',
          barrio: domicilioParsed.barrio || '',
          calles: domicilioParsed.calles || '',
          profesion: data.profesion || '',
          matricula: data.matricula || '',
          rol: 'principal',
          representaA: null,
        }
        listaDenunciantes = [registroPrincipal]
        setDenunciantes(listaDenunciantes)
        setDenuncianteEnEdicionId(idGenerado)
      }

      // Cargar datos de la denuncia
      if (data.fecha_hecho) {
        // Formatear fecha del hecho al formato YYYY-MM-DD
        const fechaHecho = new Date(data.fecha_hecho)
        const fechaHechoFormateada = fechaHecho.toISOString().split('T')[0]
        setValueDenuncia('fechaHecho', fechaHechoFormateada)
        setValueDenuncia('horaHecho', data.hora_hecho)
        // Cargar rango de fechas si existe
        if (data.fecha_hecho_fin) {
          setValueDenuncia('usarRango', true)
          const fechaHechoFin = new Date(data.fecha_hecho_fin)
          const fechaHechoFinFormateada = fechaHechoFin.toISOString().split('T')[0]
          setValueDenuncia('fechaHechoFin', fechaHechoFinFormateada)
          setValueDenuncia('horaHechoFin', data.hora_hecho_fin || '')
        } else {
          setValueDenuncia('usarRango', false)
          setValueDenuncia('fechaHechoFin', '')
          setValueDenuncia('horaHechoFin', '')
        }
        setValueDenuncia('tipoDenuncia', data.tipo_denuncia === 'OTRO' ? 'Otro (Especificar)' : data.tipo_denuncia)
        if (data.otro_tipo) setValueDenuncia('otroTipo', data.otro_tipo)
        // Cargar lugar del hecho (descomponer)
        const lugarHechoParsed = descomponerDomicilio(data.lugar_hecho)
        const departamentoLugarValido =
          lugarHechoParsed.departamento && departamentosParaguay.some((dep) => dep.nombre === lugarHechoParsed.departamento)

        if (departamentoLugarValido) {
          setValueDenuncia('lugarHechoDepartamento', lugarHechoParsed.departamento)
          const departamentoActual = departamentosParaguay.find((dep) => dep.nombre === lugarHechoParsed.departamento)
          if (departamentoActual && lugarHechoParsed.ciudad && departamentoActual.ciudades.includes(lugarHechoParsed.ciudad)) {
            setValueDenuncia('lugarHechoCiudad', lugarHechoParsed.ciudad)
            // Verificar si el barrio es válido para esta ciudad
            if (lugarHechoParsed.barrio) {
              const barriosDisponibles = obtenerBarriosPorCiudad(lugarHechoParsed.departamento, lugarHechoParsed.ciudad)
              if (barriosDisponibles.includes(lugarHechoParsed.barrio)) {
                setValueDenuncia('lugarHechoBarrio', lugarHechoParsed.barrio)
              } else {
                setValueDenuncia('lugarHechoBarrio', '')
              }
            } else {
              setValueDenuncia('lugarHechoBarrio', '')
            }
          } else {
            setValueDenuncia('lugarHechoCiudad', '')
            setValueDenuncia('lugarHechoBarrio', '')
          }
          setValueDenuncia('lugarHechoCalles', lugarHechoParsed.calles || '')
          // También mantener lugarHecho completo para compatibilidad
          setValueDenuncia('lugarHecho', construirDomicilio(lugarHechoParsed.departamento, lugarHechoParsed.ciudad, lugarHechoParsed.barrio, lugarHechoParsed.calles))
        } else {
          setValueDenuncia('lugarHechoDepartamento', '')
          setValueDenuncia('lugarHechoCiudad', '')
          setValueDenuncia('lugarHechoBarrio', '')
          setValueDenuncia('lugarHechoCalles', lugarHechoParsed.calles || '')
          setValueDenuncia('lugarHecho', data.lugar_hecho)
        }
        setValueDenuncia('relato', data.relato)
        if (data.monto_dano) setValueDenuncia('montoDano', data.monto_dano.toString())
        if (data.moneda) setValueDenuncia('moneda', data.moneda)
        if (data.latitud && data.longitud) {
          setCoordenadas({ lat: parseFloat(data.latitud), lng: parseFloat(data.longitud) })
        }
      }

      // Cargar datos del autor
      if (data.supuestos_autores && data.supuestos_autores.length > 0) {
        const primerAutor = data.supuestos_autores.find((a: any) => a.autor_conocido === 'Conocido')
        if (primerAutor) {
          setAutorConocido('Conocido')
          setValueAutor('nombre', primerAutor.nombre_autor)
          setValueAutor('cedula', primerAutor.cedula_autor)
          // Cargar domicilio del autor (descomponer)
          const domicilioAutorParsed = descomponerDomicilio(primerAutor.domicilio_autor)
          const departamentoAutorValido =
            domicilioAutorParsed.departamento && departamentosParaguay.some((dep) => dep.nombre === domicilioAutorParsed.departamento)

          if (departamentoAutorValido) {
            setValueAutor('departamento', domicilioAutorParsed.departamento)
            const departamentoActual = departamentosParaguay.find((dep) => dep.nombre === domicilioAutorParsed.departamento)
            if (departamentoActual && domicilioAutorParsed.ciudad && departamentoActual.ciudades.includes(domicilioAutorParsed.ciudad)) {
              setValueAutor('ciudad', domicilioAutorParsed.ciudad)
              // Verificar si el barrio es válido para esta ciudad
              if (domicilioAutorParsed.barrio) {
                const barriosDisponibles = obtenerBarriosPorCiudad(domicilioAutorParsed.departamento, domicilioAutorParsed.ciudad)
                if (barriosDisponibles.includes(domicilioAutorParsed.barrio)) {
                  setValueAutor('barrio', domicilioAutorParsed.barrio)
                } else {
                  setValueAutor('barrio', '')
                }
              } else {
                setValueAutor('barrio', '')
              }
            } else {
              setValueAutor('ciudad', '')
              setValueAutor('barrio', '')
            }
            setValueAutor('calles', domicilioAutorParsed.calles || '')
          } else {
            setValueAutor('departamento', '')
            setValueAutor('ciudad', '')
            setValueAutor('barrio', '')
            setValueAutor('calles', domicilioAutorParsed.calles || '')
          }
          setValueAutor('nacionalidad', primerAutor.nacionalidad_autor)
          setValueAutor('estadoCivil', primerAutor.estado_civil_autor)
          setValueAutor('edad', primerAutor.edad_autor?.toString())
          // Formatear fecha de nacimiento del autor al formato YYYY-MM-DD
          if (primerAutor.fecha_nacimiento_autor) {
            const fechaNacAutor = new Date(primerAutor.fecha_nacimiento_autor)
            const fechaFormateadaAutor = fechaNacAutor.toISOString().split('T')[0]
            setValueAutor('fechaNacimiento', fechaFormateadaAutor)
          }
          setValueAutor('lugarNacimiento', primerAutor.lugar_nacimiento_autor)
          setValueAutor('telefono', primerAutor.telefono_autor)
          setValueAutor('profesion', primerAutor.profesion_autor)
        }

        // Cargar descripción física
        const autorDesconocido = data.supuestos_autores.find((a: any) => a.autor_conocido === 'Desconocido')
        if (autorDesconocido && autorDesconocido.descripcion_fisica) {
          setAutorConocido('Desconocido')
          try {
            const descFisica = typeof autorDesconocido.descripcion_fisica === 'string'
              ? JSON.parse(autorDesconocido.descripcion_fisica)
              : autorDesconocido.descripcion_fisica
            setDescripcionFisica(descFisica || {})
          } catch {
            // Si no es JSON válido, intentar como texto plano (legacy)
            setDescripcionFisica({})
          }
        }
      } else {
        // Si no hay supuestos_autores, significa que es "No aplica"
        setAutorConocido('No aplica')
      }

      // Cargar lugar del hecho "No aplica"
      if (!data.lugar_hecho || data.lugar_hecho.trim() === '') {
        setLugarHechoNoAplica(true)
      } else {
        setLugarHechoNoAplica(false)
      }

      // Ir directamente al paso 3 (relato) cuando se carga un borrador
      setPaso(3)
    } catch (error) {
      console.error('Error cargando borrador:', error)
    }
  }

  useEffect(() => {
    if (fechaNacimientoAutor) {
      const edadCalculada = calcularEdad(fechaNacimientoAutor)
      setValueAutor('edad', edadCalculada)
    }
  }, [fechaNacimientoAutor, setValueAutor])

  useEffect(() => {
    if (usuario) {
      // Verificar si hay un borrador para continuar
      if (typeof window !== 'undefined') {
        const borradorId = sessionStorage.getItem('borradorId')
        if (borradorId) {
          // Cargar el borrador (esto restaurará la fecha/hora original del borrador)
          cargarBorrador(parseInt(borradorId))
          sessionStorage.removeItem('borradorId')
          // No capturar nueva fecha/hora ya que cargarBorrador restaurará la original
          return
        }
      }
    }
  }, [usuario])

  const onDenuncianteSubmit = (data: DenuncianteFormValues) => {
    const listaActualizada = guardarDenuncianteEnLista(data, { mantenerFormulario: false })
    if (!listaActualizada) return

    const principal = obtenerDenunciantePrincipal(listaActualizada)
    if (!principal) {
      alert('Debes registrar al menos un denunciante principal para continuar.')
      return
    }

    setPaso(2)
  }

  const handlePaso1Submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const datosActuales = getValuesDenunciante()
    const principal = obtenerDenunciantePrincipal()

    if (esFormularioDenuncianteVacio(datosActuales)) {
      resetFormularioDenunciante(obtenerRolSugerido())
      setPaso(2)
      return
    }

    handleSubmitDenunciante(onDenuncianteSubmit)(event)
  }

  const onAutorSubmit = (data: any) => {
    setPaso(3)
  }

  const onVistaPrevia = async () => {
    if (!usuario) return

    if (denunciantes.length === 0) {
      alert('Agrega al menos un denunciante antes de generar la vista previa.')
      setPaso(1)
      return
    }

    const denunciantePrincipal = obtenerDenunciantePrincipal()
    if (!denunciantePrincipal) {
      alert('Debes registrar un denunciante principal antes de continuar.')
      setPaso(1)
      return
    }

    // Validar campos obligatorios del denunciante principal
    if (
      !denunciantePrincipal.nombres ||
      !denunciantePrincipal.numeroDocumento ||
      !denunciantePrincipal.departamento ||
      !denunciantePrincipal.ciudad ||
      !denunciantePrincipal.calles ||
      !denunciantePrincipal.correo
    ) {
      alert('Por favor completa todos los campos obligatorios del denunciante principal.')
      setPaso(1)
      return
    }

    const autorData = watchAutor()
    const denunciaData = watchDenuncia()

    if (!denunciaData.fechaHecho || !denunciaData.relato) {
      alert('Por favor completa los campos obligatorios del hecho antes de generar la vista previa.')
      return
    }

    setLoading(true)

    try {
      // Usar la fecha/hora capturada al inicio, no la actual
      if (!fechaHoraInicioDenuncia) {
        alert('Error: No se pudo determinar la hora de inicio de la denuncia. Por favor, recarga la página.')
        setLoading(false)
        return
      }
      const fechaActual = fechaHoraInicioDenuncia.fecha.split('/').reverse().join('-')
      const hora = fechaHoraInicioDenuncia.hora

      let fechaHecho = denunciaData.fechaHecho || ''
      if (fechaHecho.includes('/')) {
        const [dia, mes, año] = fechaHecho.split('/')
        fechaHecho = `${año}-${mes}-${dia}`
      }

      const denunciantePayload = construirDenunciantePayload(denunciantePrincipal)
      const coleccionDenunciantes = construirColeccionDenunciantesPayload(denunciantes)

      const payload = {
        borradorId: borradorId || null,
        denunciante: denunciantePayload,
        denunciantes: coleccionDenunciantes,
        denunciantePrincipalId: denunciantePrincipal.id,
        denunciantesAdicionales: coleccionDenunciantes.filter(
          (denunciante) => denunciante.id !== denunciantePrincipal.id
        ),
        denuncia: {
          fechaDenuncia: fechaActual,
          horaDenuncia: hora,
          fechaHecho: fechaHecho,
          horaHecho: denunciaData.horaHecho,
          usarRango: denunciaData.usarRango || false,
          fechaHechoFin: denunciaData.fechaHechoFin || null,
          horaHechoFin: denunciaData.horaHechoFin || null,
          tipoDenuncia: denunciaData.tipoDenuncia === 'Otro (Especificar)' ? 'OTRO' : denunciaData.tipoDenuncia,
          otroTipo: denunciaData.tipoDenuncia === 'Otro (Especificar)' ? denunciaData.otroTipo?.toUpperCase() : null,
          lugarHecho: lugarHechoNoAplica ? '' : (construirDomicilio(denunciaData.lugarHechoDepartamento, denunciaData.lugarHechoCiudad, denunciaData.lugarHechoBarrio, denunciaData.lugarHechoCalles)?.toUpperCase() || denunciaData.lugarHecho?.toUpperCase() || ''),
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
            domicilio: construirDomicilio(autorData.departamento, autorData.ciudad, autorData.barrio, autorData.calles) || null,
            nacionalidad: autorData.nacionalidad?.toUpperCase() || null,
            estadoCivil: autorData.estadoCivil?.toUpperCase() || null,
            edad: autorData.edad || null,
            fechaNacimiento: autorData.fechaNacimiento || null,
            lugarNacimiento: autorData.lugarNacimiento?.toUpperCase() || null,
            telefono: autorData.telefono?.toUpperCase() || null,
            profesion: autorData.profesion?.toUpperCase() || null,
          }),
        },
        descripcionFisica: autorConocido === 'Desconocido'
          ? (Object.keys(descripcionFisica).length > 0 ? JSON.stringify(descripcionFisica) : null)
          : autorConocido === 'No aplica'
            ? null
            : null,
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

  const generarVistaPrevia = async () => {
    if (!usuario) return

    if (denunciantes.length === 0) {
      alert('Debes agregar al menos un denunciante antes de completar la denuncia.')
      setPaso(1)
      return
    }

    const denunciantePrincipal = obtenerDenunciantePrincipal()
    if (!denunciantePrincipal) {
      alert('Debes registrar un denunciante principal antes de completar la denuncia.')
      setPaso(1)
      return
    }

    setGenerandoVistaPrevia(true)

    try {
      const autorData = watchAutor()
      const denunciaData = watchDenuncia()

      let fechaHecho = denunciaData.fechaHecho || ''
      if (fechaHecho.includes('/')) {
        const [dia, mes, año] = fechaHecho.split('/')
        fechaHecho = `${año}-${mes}-${dia}`
      }

      const denunciantePayload = construirDenunciantePayload(denunciantePrincipal)
      const coleccionDenunciantes = construirColeccionDenunciantesPayload(denunciantes)

      // Usar la fecha/hora capturada al inicio, no la actual
      if (!fechaHoraInicioDenuncia) {
        alert('Error: No se pudo determinar la hora de inicio de la denuncia. Por favor, recarga la página.')
        setLoading(false)
        return
      }
      const fechaDenuncia = fechaHoraInicioDenuncia.fecha.split('/').reverse().join('-')
      const horaDenuncia = fechaHoraInicioDenuncia.hora

      const payload = {
        borradorId: borradorId || null,
        denunciante: denunciantePayload,
        denunciantes: coleccionDenunciantes,
        denunciantePrincipalId: denunciantePrincipal.id,
        denunciantesAdicionales: coleccionDenunciantes.filter(
          (denunciante) => denunciante.id !== denunciantePrincipal.id
        ),
        denuncia: {
          fechaDenuncia: fechaDenuncia,
          horaDenuncia: horaDenuncia,
          fechaHecho: fechaHecho,
          horaHecho: denunciaData.horaHecho,
          usarRango: denunciaData.usarRango || false,
          fechaHechoFin: denunciaData.fechaHechoFin || null,
          horaHechoFin: denunciaData.horaHechoFin || null,
          tipoDenuncia: denunciaData.tipoDenuncia === 'Otro (Especificar)' ? 'OTRO' : denunciaData.tipoDenuncia,
          otroTipo: denunciaData.tipoDenuncia === 'Otro (Especificar)' ? denunciaData.otroTipo?.toUpperCase() : null,
          lugarHecho: lugarHechoNoAplica ? '' : (construirDomicilio(denunciaData.lugarHechoDepartamento, denunciaData.lugarHechoCiudad, denunciaData.lugarHechoBarrio, denunciaData.lugarHechoCalles)?.toUpperCase() || denunciaData.lugarHecho?.toUpperCase() || ''),
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
            domicilio: construirDomicilio(autorData.departamento, autorData.ciudad, autorData.barrio, autorData.calles) || null,
            nacionalidad: autorData.nacionalidad?.toUpperCase() || null,
            estadoCivil: autorData.estadoCivil?.toUpperCase() || null,
            edad: autorData.edad || null,
            fechaNacimiento: autorData.fechaNacimiento || null,
            lugarNacimiento: autorData.lugarNacimiento?.toUpperCase() || null,
            telefono: autorData.telefono?.toUpperCase() || null,
            profesion: autorData.profesion?.toUpperCase() || null,
          }),
        },
        descripcionFisica: autorConocido === 'Desconocido'
          ? (Object.keys(descripcionFisica).length > 0 ? JSON.stringify(descripcionFisica) : null)
          : autorConocido === 'No aplica'
            ? null
            : null,
        operador: {
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          grado: usuario.grado,
          oficina: usuario.oficina,
        },
      }

      const response = await fetch('/api/denuncias/preview-texto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Error al generar la vista previa')
      }

      const result = await response.json()
      setTextoVistaPrevia(result.texto)
      setMostrarModalVistaPrevia(true)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al generar la vista previa. Por favor, intente nuevamente.')
    } finally {
      setGenerandoVistaPrevia(false)
    }
  }

  const onDenunciaPrueba = async (data: any) => {
    if (!usuario) return

    // Prevenir múltiples envíos simultáneos
    if (loading) return

    if (denunciantes.length === 0) {
      alert('Debes agregar al menos un denunciante antes de completar la denuncia.')
      setPaso(1)
      return
    }

    const denunciantePrincipal = obtenerDenunciantePrincipal()
    if (!denunciantePrincipal) {
      alert('Debes registrar un denunciante principal antes de completar la denuncia.')
      setPaso(1)
      return
    }

    setLoading(true)

    try {
      const autorData = watchAutor()
      const denunciaData = watchDenuncia()

      let fechaHecho = denunciaData.fechaHecho || ''
      if (fechaHecho.includes('/')) {
        const [dia, mes, año] = fechaHecho.split('/')
        fechaHecho = `${año}-${mes}-${dia}`
      }

      const denunciantePayload = construirDenunciantePayload(denunciantePrincipal)
      const coleccionDenunciantes = construirColeccionDenunciantesPayload(denunciantes)

      // Usar la fecha/hora capturada al inicio, no la actual
      if (!fechaHoraInicioDenuncia) {
        alert('Error: No se pudo determinar la hora de inicio de la denuncia. Por favor, recarga la página.')
        setLoading(false)
        return
      }
      const fechaDenuncia = fechaHoraInicioDenuncia.fecha.split('/').reverse().join('-')
      const horaDenuncia = fechaHoraInicioDenuncia.hora

      const payload = {
        usuario: usuario.usuario, // Para validar en el backend
        denunciante: denunciantePayload,
        denunciantes: coleccionDenunciantes,
        denuncia: {
          fechaDenuncia: fechaDenuncia,
          horaDenuncia: horaDenuncia,
          fechaHecho: fechaHecho,
          horaHecho: denunciaData.horaHecho,
          usarRango: denunciaData.usarRango || false,
          fechaHechoFin: denunciaData.fechaHechoFin || null,
          horaHechoFin: denunciaData.horaHechoFin || null,
          tipoDenuncia: denunciaData.tipoDenuncia === 'Otro (Especificar)' ? 'OTRO' : denunciaData.tipoDenuncia,
          otroTipo: denunciaData.tipoDenuncia === 'Otro (Especificar)' ? denunciaData.otroTipo?.toUpperCase() : null,
          lugarHecho: lugarHechoNoAplica ? '' : (construirDomicilio(denunciaData.lugarHechoDepartamento, denunciaData.lugarHechoCiudad, denunciaData.lugarHechoBarrio, denunciaData.lugarHechoCalles)?.toUpperCase() || denunciaData.lugarHecho?.toUpperCase() || ''),
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
            domicilio: construirDomicilio(autorData.departamento, autorData.ciudad, autorData.barrio, autorData.calles) || null,
            nacionalidad: autorData.nacionalidad?.toUpperCase() || null,
            estadoCivil: autorData.estadoCivil?.toUpperCase() || null,
            edad: autorData.edad || null,
            fechaNacimiento: autorData.fechaNacimiento || null,
            lugarNacimiento: autorData.lugarNacimiento?.toUpperCase() || null,
            telefono: autorData.telefono?.toUpperCase() || null,
            profesion: autorData.profesion?.toUpperCase() || null,
          }),
        },
        descripcionFisica: autorConocido === 'Desconocido'
          ? (Object.keys(descripcionFisica).length > 0 ? JSON.stringify(descripcionFisica) : null)
          : autorConocido === 'No aplica'
            ? null
            : null,
        operador: {
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          grado: usuario.grado,
          oficina: usuario.oficina,
        },
      }

      const response = await fetch('/api/denuncias/prueba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Error al generar el PDF de prueba')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `denuncia_prueba_${new Date().getTime()}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)

      alert('PDF de prueba generado exitosamente. No se guardó nada en la base de datos.')
    } catch (error) {
      console.error('Error:', error)
      alert('Error al generar el PDF de prueba. Por favor, intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const onDenunciaSubmit = async (data: any) => {
    if (!usuario) return

    // Prevenir múltiples envíos simultáneos - verificación inmediata con ref
    if (isSubmittingRef.current || loading) {
      console.log('Envío bloqueado: ya hay un envío en proceso')
      return
    }

    if (denunciantes.length === 0) {
      alert('Debes agregar al menos un denunciante antes de completar la denuncia.')
      setPaso(1)
      return
    }

    const denunciantePrincipal = obtenerDenunciantePrincipal()
    if (!denunciantePrincipal) {
      alert('Debes registrar un denunciante principal antes de completar la denuncia.')
      setPaso(1)
      return
    }

    // Establecer flag inmediatamente (sincrónico)
    isSubmittingRef.current = true
    setLoading(true)

    try {
      const autorData = watchAutor()
      const denunciaData = watchDenuncia()

      let fechaHecho = denunciaData.fechaHecho || ''
      if (fechaHecho.includes('/')) {
        const [dia, mes, año] = fechaHecho.split('/')
        fechaHecho = `${año}-${mes}-${dia}`
      }

      const denunciantePayload = construirDenunciantePayload(denunciantePrincipal)
      const coleccionDenunciantes = construirColeccionDenunciantesPayload(denunciantes)

      // Usar la fecha/hora capturada al inicio, no la actual
      if (!fechaHoraInicioDenuncia) {
        alert('Error: No se pudo determinar la hora de inicio de la denuncia. Por favor, recarga la página.')
        setLoading(false)
        return
      }
      const fechaDenuncia = fechaHoraInicioDenuncia.fecha.split('/').reverse().join('-')
      const horaDenuncia = fechaHoraInicioDenuncia.hora

      const payload = {
        borradorId: borradorId || null,
        denunciante: denunciantePayload,
        denunciantes: coleccionDenunciantes,
        denunciantePrincipalId: denunciantePrincipal.id,
        denunciantesAdicionales: coleccionDenunciantes.filter(
          (denunciante) => denunciante.id !== denunciantePrincipal.id
        ),
        denuncia: {
          fechaDenuncia: fechaDenuncia,
          horaDenuncia: horaDenuncia,
          fechaHecho: fechaHecho,
          horaHecho: denunciaData.horaHecho,
          usarRango: denunciaData.usarRango || false,
          fechaHechoFin: denunciaData.fechaHechoFin || null,
          horaHechoFin: denunciaData.horaHechoFin || null,
          tipoDenuncia: denunciaData.tipoDenuncia === 'Otro (Especificar)' ? 'OTRO' : denunciaData.tipoDenuncia,
          otroTipo: denunciaData.tipoDenuncia === 'Otro (Especificar)' ? denunciaData.otroTipo?.toUpperCase() : null,
          lugarHecho: lugarHechoNoAplica ? '' : (construirDomicilio(denunciaData.lugarHechoDepartamento, denunciaData.lugarHechoCiudad, denunciaData.lugarHechoBarrio, denunciaData.lugarHechoCalles)?.toUpperCase() || denunciaData.lugarHecho?.toUpperCase() || ''),
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
            domicilio: construirDomicilio(autorData.departamento, autorData.ciudad, autorData.barrio, autorData.calles) || null,
            nacionalidad: autorData.nacionalidad?.toUpperCase() || null,
            estadoCivil: autorData.estadoCivil?.toUpperCase() || null,
            edad: autorData.edad || null,
            fechaNacimiento: autorData.fechaNacimiento || null,
            lugarNacimiento: autorData.lugarNacimiento?.toUpperCase() || null,
            telefono: autorData.telefono?.toUpperCase() || null,
            profesion: autorData.profesion?.toUpperCase() || null,
          }),
        },
        descripcionFisica: autorConocido === 'Desconocido'
          ? (Object.keys(descripcionFisica).length > 0 ? JSON.stringify(descripcionFisica) : null)
          : autorConocido === 'No aplica'
            ? null
            : null,
        usuarioId: usuario.id,
      }

      const response = await fetch('/api/denuncias/nueva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        // Manejar error de rate limiting (429)
        if (response.status === 429) {
          const mensaje = errorData.error || 'Debe esperar al menos un minuto entre la creación de denuncias completadas.'
          alert(mensaje)
          isSubmittingRef.current = false
          setLoading(false)
          return
        }

        throw new Error(errorData.error || 'Error al guardar la denuncia')
      }

      const result = await response.json()

      router.push(`/nueva-denuncia/confirmacion?id=${result.id}`)
      // En caso de éxito, el componente se desmonta con la redirección, así que no necesitamos resetear
    } catch (error) {
      console.error('Error:', error)
      const mensajeError = error instanceof Error ? error.message : 'Error al guardar la denuncia. Por favor, intente nuevamente.'
      alert(mensajeError)
      // Resetear flag en caso de error para permitir reintento
      isSubmittingRef.current = false
      setLoading(false)
    }
  }

  const guardarBorrador = async () => {
    if (!usuario) return

    setGuardandoBorrador(true)

    try {
      if (denunciantes.length === 0) {
        alert('Agrega al menos un denunciante antes de guardar el borrador.')
        setPaso(1)
        return
      }

      const denunciantePrincipal = obtenerDenunciantePrincipal()
      if (!denunciantePrincipal) {
        alert('Debes registrar un denunciante principal antes de guardar el borrador.')
        setPaso(1)
        return
      }

      // Usar la fecha/hora capturada al inicio, no la actual
      if (!fechaHoraInicioDenuncia) {
        alert('Error: No se pudo determinar la hora de inicio de la denuncia. Por favor, recarga la página.')
        setLoading(false)
        return
      }
      const fechaActual = fechaHoraInicioDenuncia.fecha.split('/').reverse().join('-')
      const hora = fechaHoraInicioDenuncia.hora

      const autorData = watchAutor()
      const denunciaData = watchDenuncia()

      // Convertir fecha de hecho si viene en formato YYYY-MM-DD
      let fechaHecho = denunciaData.fechaHecho
      if (fechaHecho && fechaHecho.includes('-')) {
        // Ya está en formato YYYY-MM-DD
      } else if (fechaHecho && fechaHecho.includes('/')) {
        // Convertir de DD/MM/YYYY a YYYY-MM-DD
        const [dia, mes, año] = fechaHecho.split('/')
        fechaHecho = `${año}-${mes}-${dia}`
      }

      // Preparar datos para enviar
      const denunciantePayload = construirDenunciantePayload(denunciantePrincipal)
      const coleccionDenunciantes = construirColeccionDenunciantesPayload(denunciantes)
      const documentoPrincipal = denunciantePrincipal.numeroDocumento || denunciantePrincipal.matricula || null
      const payload = {
        denunciante: denunciantePayload,
        denunciantes: coleccionDenunciantes,
        denunciantePrincipalId: denunciantePrincipal.id,
        denunciantePrincipalDocumento: documentoPrincipal,
        denunciantesAdicionales: coleccionDenunciantes.filter(
          (denunciante) => denunciante.id !== denunciantePrincipal.id
        ),
        denuncia: {
          fechaDenuncia: fechaActual,
          horaDenuncia: hora,
          fechaHecho: fechaHecho || '',
          horaHecho: denunciaData.horaHecho || '',
          tipoDenuncia: denunciaData.tipoDenuncia === 'Otro (Especificar)' ? 'OTRO' : denunciaData.tipoDenuncia || '',
          otroTipo: denunciaData.tipoDenuncia === 'Otro (Especificar)' ? denunciaData.otroTipo?.toUpperCase() : null,
          lugarHecho: lugarHechoNoAplica ? '' : (construirDomicilio(denunciaData.lugarHechoDepartamento, denunciaData.lugarHechoCiudad, denunciaData.lugarHechoBarrio, denunciaData.lugarHechoCalles)?.toUpperCase() || denunciaData.lugarHecho?.toUpperCase() || ''),
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
            domicilio: construirDomicilio(autorData.departamento, autorData.ciudad, autorData.barrio, autorData.calles) || null,
            nacionalidad: autorData.nacionalidad?.toUpperCase() || null,
            estadoCivil: autorData.estadoCivil?.toUpperCase() || null,
            edad: autorData.edad || null,
            fechaNacimiento: autorData.fechaNacimiento || null,
            lugarNacimiento: autorData.lugarNacimiento?.toUpperCase() || null,
            telefono: autorData.telefono?.toUpperCase() || null,
            profesion: autorData.profesion?.toUpperCase() || null,
          }),
        },
        descripcionFisica: autorConocido === 'Desconocido'
          ? (Object.keys(descripcionFisica).length > 0 ? JSON.stringify(descripcionFisica) : null)
          : autorConocido === 'No aplica'
            ? null
            : null,
        usuarioId: usuario.id,
        borradorId: borradorId,
      }

      const response = await fetch('/api/denuncias/borrador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Error al guardar borrador')
      }

      const result = await response.json()
      setBorradorId(result.borradorId)

      setMostrarModalBorrador(true)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar borrador. Por favor, intente nuevamente.')
    } finally {
      setGuardandoBorrador(false)
    }
  }

  const irAlInicio = () => {
    setMostrarModalBorrador(false)
    router.push('/dashboard')
  }

  const permanecerEnPagina = () => {
    setMostrarModalBorrador(false)
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
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${paso >= step.num
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
                    className={`flex-1 h-1 mx-2 ${paso > step.num ? 'bg-blue-600' : 'bg-gray-300'
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
            onSubmit={handlePaso1Submit}
            autoComplete="off"
            className="bg-white rounded-lg shadow-md p-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Datos del Denunciante
            </h2>

            <div className="space-y-4">
              {/* Rol dentro de la denuncia */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol dentro de la denuncia *
                </label>
                <select
                  {...registerDenunciante('rol')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans text-sm uppercase"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {ROLES_DENUNCIANTE.map((rol) => {
                    const esRolActual = registroDenuncianteEnEdicion?.rol === rol
                    const deshabilitarPrincipal = rol === 'principal' && existePrincipalRegistrado && !esRolActual
                    const coDenunciantesRegistrados = denunciantes.filter((denunciante) => denunciante.rol === 'co-denunciante').length
                    const deshabilitarCoDenunciante =
                      rol === 'co-denunciante' && coDenunciantesRegistrados >= 2 && !esRolActual
                    const deshabilitarAbogado = rol === 'abogado' && !principalActual && !esRolActual
                    return (
                      <option
                        key={rol}
                        value={rol}
                        disabled={deshabilitarPrincipal || deshabilitarAbogado || deshabilitarCoDenunciante}
                      >
                        {rol === 'principal' && 'Denunciante principal'}
                        {rol === 'co-denunciante' && 'Co-denunciante'}
                        {rol === 'abogado' && 'Abogado / representante legal'}
                      </option>
                    )
                  })}
                </select>
                {errorsDenunciante.rol && (
                  <p className="text-red-600 text-sm mt-1">{errorsDenunciante.rol.message as string}</p>
                )}

                {/* Botón temporal para completar automáticamente (SOLO PARA PRUEBAS) */}
                {modoPruebas && (
                  <button
                    type="button"
                    onClick={completarFormularioAutomatico}
                    className="mt-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    Completar automáticamente (PRUEBAS)
                  </button>
                )}
              </div>

              {/* Nombres y Apellidos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {esAbogado ? 'Nombre completo del abogado *' : 'Nombres y Apellidos *'}
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
              <div className={`grid ${esAbogado ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2'} gap-4`}>
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
                    Número de Documento {esAbogado ? '*' : '*'}
                  </label>
                  <input
                    {...registerDenunciante('numeroDocumento')}
                    onChange={(e) => {
                      const tipoDoc = watchDenunciante('tipoDocumento')
                      if (tipoDoc === 'Pasaporte' || tipoDoc === 'Documento de origen') {
                        convertirAMayusculas(e)
                      } else {
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

                {esAbogado && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Matrícula Número *
                    </label>
                    <input
                      {...registerDenunciante('matricula')}
                      onChange={(e) => {
                        convertirAMayusculas(e)
                        registerDenunciante('matricula').onChange(e)
                      }}
                      autoComplete="off"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    />
                    {errorsDenunciante.matricula && (
                      <p className="text-red-600 text-sm mt-1">{errorsDenunciante.matricula.message as string}</p>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Nacionalidad */}
              {!esAbogado && (
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
              )}

              {/* 4. Fecha de Nacimiento y Edad */}
              {!esAbogado && (
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
              )}

              {/* 5. Lugar de Nacimiento */}
              {!esAbogado && (
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
              )}

              {/* 6. Estado Civil */}
              {!esAbogado && (
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
              )}

              {/* 7. Contacto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    {...registerDenunciante('correo')}
                    onChange={(e) => {
                      e.target.value = e.target.value.toLowerCase()
                      registerDenunciante('correo').onChange(e)
                    }}
                    autoComplete="off"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errorsDenunciante.correo && (
                    <p className="text-red-600 text-sm mt-1">{errorsDenunciante.correo.message as string}</p>
                  )}
                </div>
              </div>

              {/* Carta Poder (solo para abogados) */}
              {esAbogado && (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="conCartaPoder"
                      {...registerDenunciante('conCartaPoder')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="conCartaPoder" className="ml-2 block text-sm font-medium text-gray-700">
                      El abogado actúa con carta poder (denunciante no presente)
                    </label>
                  </div>
                  {watchDenunciante('conCartaPoder') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-blue-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de la Carta Poder *
                        </label>
                        <input
                          type="date"
                          {...registerDenunciante('cartaPoderFecha')}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errorsDenunciante.cartaPoderFecha && (
                          <p className="text-red-600 text-sm mt-1">{errorsDenunciante.cartaPoderFecha.message as string}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notario *
                        </label>
                        <input
                          {...registerDenunciante('cartaPoderNotario')}
                          onChange={(e) => {
                            convertirAMayusculas(e)
                            registerDenunciante('cartaPoderNotario').onChange(e)
                          }}
                          autoComplete="off"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                        />
                        {errorsDenunciante.cartaPoderNotario && (
                          <p className="text-red-600 text-sm mt-1">{errorsDenunciante.cartaPoderNotario.message as string}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 8. Domicilio */}
              {!esAbogado && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    Domicilio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Departamento *
                      </label>
                      <Controller
                        name="departamento"
                        control={controlDenunciante}
                        render={({ field }) => (
                          <Select
                            options={departamentoOptions}
                            value={departamentoOptions.find((option) => option.value === field.value) || null}
                            onChange={(option) => field.onChange(option?.value || '')}
                            isClearable
                            placeholder="Seleccione..."
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
                        )}
                      />
                      {errorsDenunciante.departamento && (
                        <p className="text-red-600 text-sm mt-1">{errorsDenunciante.departamento.message as string}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad *
                      </label>
                      <Controller
                        name="ciudad"
                        control={controlDenunciante}
                        render={({ field }) => (
                          <Select
                            options={ciudadOptions}
                            value={ciudadOptions.find((option) => option.value === field.value) || null}
                            onChange={(option) => field.onChange(option?.value || '')}
                            isClearable
                            isDisabled={!departamentoSeleccionado}
                            placeholder={departamentoSeleccionado ? 'Seleccione...' : 'Seleccione un departamento primero'}
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
                        )}
                      />
                      {errorsDenunciante.ciudad && (
                        <p className="text-red-600 text-sm mt-1">{errorsDenunciante.ciudad.message as string}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Barrio
                      </label>
                      <Controller
                        name="barrio"
                        control={controlDenunciante}
                        render={({ field }) => (
                          <Select
                            options={barrioOptions}
                            value={barrioOptions.find((option) => option.value === field.value) || null}
                            onChange={(option) => field.onChange(option?.value || '')}
                            isClearable
                            isDisabled={!ciudadSeleccionada}
                            placeholder={ciudadSeleccionada ? 'Seleccione...' : 'Seleccione una ciudad primero'}
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
                        )}
                      />
                      {errorsDenunciante.barrio && (
                        <p className="text-red-600 text-sm mt-1">{errorsDenunciante.barrio.message as string}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Calles / Referencias *
                    </label>
                    <input
                      {...registerDenunciante('calles')}
                      onChange={(e) => {
                        convertirAMayusculas(e)
                        registerDenunciante('calles').onChange(e)
                      }}
                      autoComplete="off"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    />
                    {errorsDenunciante.calles && (
                      <p className="text-red-600 text-sm mt-1">{errorsDenunciante.calles.message as string}</p>
                    )}
                  </div>
                </div>
              )}

              {/* 9. Profesión */}
              {!esAbogado && (
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
              )}
            </div>

            <div className="mt-8 space-y-6">
              {denuncianteEnEdicionId && (
                <div className="px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 text-sm text-blue-800 font-medium">
                  Estás editando a {registroDenuncianteEnEdicion?.nombres || 'la persona seleccionada'}.
                </div>
              )}

              {denunciantes.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Personas agregadas</h3>
                    <p className="text-sm text-gray-500">
                      Puedes editar o eliminar cada registro antes de continuar al siguiente paso.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {denunciantesOrdenados.map((denunciante) => {
                      const esEdicionActual = denunciante.id === denuncianteEnEdicionId
                      const representado = obtenerDenunciantePorId(denunciante.representaA)
                      return (
                        <div
                          key={denunciante.id}
                          className={`rounded-lg border p-4 transition ${esEdicionActual ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'
                            }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                              <p className="text-base font-semibold text-gray-800 uppercase">
                                {denunciante.nombres || (denunciante.rol === 'abogado' ? 'ABOGADO/A' : '')}
                              </p>
                              <p className="text-sm text-gray-600">
                                Rol:{' '}
                                {denunciante.rol === 'principal'
                                  ? 'Denunciante principal'
                                  : denunciante.rol === 'co-denunciante'
                                    ? 'Co-denunciante'
                                    : 'Abogado / representante legal'}
                              </p>
                              {denunciante.rol === 'abogado' && representado && (
                                <p className="text-sm text-gray-600">
                                  Representa a: <span className="font-medium">{representado.nombres}</span>
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Documento:{' '}
                                {[
                                  denunciante.tipoDocumento || null,
                                  denunciante.numeroDocumento || null,
                                ]
                                  .filter(Boolean)
                                  .join(' ') || 'No especificado'}
                              </p>
                              {denunciante.rol === 'abogado' && (
                                <p className="text-xs text-gray-500">
                                  Matrícula: {denunciante.matricula || 'No especificada'}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => manejarEditarDenunciante(denunciante.id)}
                                className="px-4 py-2 bg-white border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm font-medium"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => manejarEliminarDenunciante(denunciante.id)}
                                className="px-4 py-2 bg-white border border-red-500 text-red-600 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm font-medium"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  type="button"
                  onClick={manejarAgregarDenunciante}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm font-medium"
                >
                  {denuncianteEnEdicionId ? 'Actualizar denunciante' : 'Guardar denunciante y cargar otro'}
                </button>
                {denuncianteEnEdicionId && (
                  <button
                    type="button"
                    onClick={manejarCancelarEdicion}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 text-sm font-medium"
                  >
                    Cancelar edición
                  </button>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={guardarBorrador}
                disabled={guardandoBorrador}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guardandoBorrador ? 'Guardando...' : 'Guardar Borrador'}
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
                <label className="flex items-center text-gray-800 cursor-pointer">
                  <input
                    type="radio"
                    value="Conocido"
                    checked={autorConocido === 'Conocido'}
                    onChange={(e) => setAutorConocido(e.target.value as 'Conocido' | 'Desconocido' | 'No aplica')}
                    className="mr-2"
                  />
                  <span className="text-gray-800">Conocido</span>
                </label>
                <label className="flex items-center text-gray-800 cursor-pointer">
                  <input
                    type="radio"
                    value="Desconocido"
                    checked={autorConocido === 'Desconocido'}
                    onChange={(e) => setAutorConocido(e.target.value as 'Conocido' | 'Desconocido' | 'No aplica')}
                    className="mr-2"
                  />
                  <span className="text-gray-800">Desconocido</span>
                </label>
                <label className="flex items-center text-gray-800 cursor-pointer">
                  <input
                    type="radio"
                    value="No aplica"
                    checked={autorConocido === 'No aplica'}
                    onChange={(e) => setAutorConocido(e.target.value as 'Conocido' | 'Desconocido' | 'No aplica')}
                    className="mr-2"
                  />
                  <span className="text-gray-800">No aplica</span>
                </label>
              </div>
            </div>

            {autorConocido === 'Conocido' && (
              <div className="space-y-4 mb-6">
                {/* Botón para completar automáticamente (SOLO PARA PRUEBAS) */}
                {modoPruebas && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={completarAutorAutomatico}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                      Completar automáticamente (PRUEBAS)
                    </button>
                  </div>
                )}

                {/* Nombres y Cédula */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Domicilio */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    Domicilio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Departamento
                      </label>
                      <Controller
                        name="departamento"
                        control={controlAutor}
                        render={({ field }) => (
                          <Select
                            options={departamentoAutorOptions}
                            value={departamentoAutorOptions.find((option) => option.value === field.value) || null}
                            onChange={(option) => field.onChange(option?.value || '')}
                            isClearable
                            placeholder="Seleccione..."
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
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad
                      </label>
                      <Controller
                        name="ciudad"
                        control={controlAutor}
                        render={({ field }) => (
                          <Select
                            options={ciudadAutorOptions}
                            value={ciudadAutorOptions.find((option) => option.value === field.value) || null}
                            onChange={(option) => field.onChange(option?.value || '')}
                            isClearable
                            isDisabled={!departamentoAutor}
                            placeholder={departamentoAutor ? 'Seleccione...' : 'Seleccione un departamento primero'}
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
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Barrio
                      </label>
                      <Controller
                        name="barrio"
                        control={controlAutor}
                        render={({ field }) => (
                          <Select
                            options={barrioAutorOptions}
                            value={barrioAutorOptions.find((option) => option.value === field.value) || null}
                            onChange={(option) => field.onChange(option?.value || '')}
                            isClearable
                            isDisabled={!ciudadAutor}
                            placeholder={ciudadAutor ? 'Seleccione...' : 'Seleccione una ciudad primero'}
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
                        )}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Calles / Referencias
                    </label>
                    <input
                      {...registerAutor('calles')}
                      onChange={(e) => {
                        convertirAMayusculas(e)
                        registerAutor('calles').onChange(e)
                      }}
                      autoComplete="off"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    />
                  </div>
                </div>

                {/* Nacionalidad y Estado Civil */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nacionalidad
                    </label>
                    <Controller
                      name="nacionalidad"
                      control={controlAutor}
                      render={({ field }) => {
                        const currentValue = field.value || null
                        return (
                          <Select
                            options={nacionalidades.map((nac) => ({ value: nac, label: nac }))}
                            value={currentValue && nacionalidades.find((nac) => nac === currentValue) ? { value: currentValue, label: currentValue } : null}
                            onChange={(option) => {
                              field.onChange(option?.value || null)
                            }}
                            isClearable
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

                {/* Fecha de Nacimiento y Edad juntos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fechaNacimientoAutor ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                    />
                  </div>
                </div>

                {/* Lugar de Nacimiento */}
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

                {/* Teléfono y Profesión */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {autorConocido === 'Desconocido' && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Descripción Física</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Complete los campos que sean relevantes para describir físicamente al supuesto autor desconocido.
                </p>

                <div className="space-y-6">
                  {/* 1. Constitución física */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-800 mb-3">1. Constitución física</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Altura</label>
                        <select
                          value={descripcionFisica.altura || ''}
                          onChange={(e) => setDescripcionFisica({ ...descripcionFisica, altura: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Seleccione...</option>
                          {opcionesAltura.map((opcion) => (
                            <option key={opcion} value={opcion}>{opcion}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Complexión</label>
                        <select
                          value={descripcionFisica.complexion || ''}
                          onChange={(e) => setDescripcionFisica({ ...descripcionFisica, complexion: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Seleccione...</option>
                          {opcionesComplexion.map((opcion) => (
                            <option key={opcion} value={opcion}>{opcion}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Postura</label>
                        <select
                          value={descripcionFisica.postura || ''}
                          onChange={(e) => setDescripcionFisica({ ...descripcionFisica, postura: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Seleccione...</option>
                          {opcionesPostura.map((opcion) => (
                            <option key={opcion} value={opcion}>{opcion}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 2. Forma del rostro */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-800 mb-3">2. Forma del rostro</h4>
                    <select
                      value={descripcionFisica.formaRostro || ''}
                      onChange={(e) => setDescripcionFisica({ ...descripcionFisica, formaRostro: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Seleccione...</option>
                      {opcionesFormaRostro.map((opcion) => (
                        <option key={opcion} value={opcion}>{opcion}</option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Piel */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-800 mb-3">3. Piel</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tono</label>
                        <select
                          value={descripcionFisica.tonoPiel || ''}
                          onChange={(e) => setDescripcionFisica({ ...descripcionFisica, tonoPiel: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Seleccione...</option>
                          {opcionesTonoPiel.map((opcion) => (
                            <option key={opcion} value={opcion}>{opcion}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Textura</label>
                        <select
                          value={descripcionFisica.texturaPiel || ''}
                          onChange={(e) => setDescripcionFisica({ ...descripcionFisica, texturaPiel: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Seleccione...</option>
                          {opcionesTexturaPiel.map((opcion) => (
                            <option key={opcion} value={opcion}>{opcion}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 4. Cabello */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-800 mb-3">4. Cabello</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                        <select
                          value={descripcionFisica.colorCabello || ''}
                          onChange={(e) => setDescripcionFisica({ ...descripcionFisica, colorCabello: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Seleccione...</option>
                          {opcionesColorCabello.map((opcion) => (
                            <option key={opcion} value={opcion}>{opcion}</option>
                          ))}
                        </select>
                        {descripcionFisica.colorCabello === 'Teñido' && (
                          <input
                            type="text"
                            value={descripcionFisica.cabelloTeñido || ''}
                            onChange={(e) => setDescripcionFisica({ ...descripcionFisica, cabelloTeñido: e.target.value.toUpperCase() })}
                            placeholder="Especificar color..."
                            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase text-sm"
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
                        <select
                          value={descripcionFisica.longitudCabello || ''}
                          onChange={(e) => setDescripcionFisica({ ...descripcionFisica, longitudCabello: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Seleccione...</option>
                          {opcionesLongitudCabello.map((opcion) => (
                            <option key={opcion} value={opcion}>{opcion}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Textura</label>
                        <select
                          value={descripcionFisica.texturaCabello || ''}
                          onChange={(e) => setDescripcionFisica({ ...descripcionFisica, texturaCabello: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Seleccione...</option>
                          {opcionesTexturaCabello.map((opcion) => (
                            <option key={opcion} value={opcion}>{opcion}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Peinado</label>
                        <select
                          value={descripcionFisica.peinado || ''}
                          onChange={(e) => setDescripcionFisica({ ...descripcionFisica, peinado: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Seleccione...</option>
                          {opcionesPeinado.map((opcion) => (
                            <option key={opcion} value={opcion}>{opcion}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 5. Ojos */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-800 mb-3">5. Ojos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Forma</label>
                        <select
                          value={descripcionFisica.formaOjos || ''}
                          onChange={(e) => setDescripcionFisica({ ...descripcionFisica, formaOjos: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Seleccione...</option>
                          {opcionesFormaOjos.map((opcion) => (
                            <option key={opcion} value={opcion}>{opcion}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                        <select
                          value={descripcionFisica.colorOjos || ''}
                          onChange={(e) => setDescripcionFisica({ ...descripcionFisica, colorOjos: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Seleccione...</option>
                          {opcionesColorOjos.map((opcion) => (
                            <option key={opcion} value={opcion}>{opcion}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Características</label>
                      <div className="flex flex-wrap gap-3">
                        {opcionesCaracteristicasOjos.map((opcion) => (
                          <label key={opcion} className="flex items-center text-sm text-gray-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={descripcionFisica.caracteristicasOjos?.includes(opcion) || false}
                              onChange={(e) => {
                                const actuales = descripcionFisica.caracteristicasOjos || []
                                if (e.target.checked) {
                                  setDescripcionFisica({ ...descripcionFisica, caracteristicasOjos: [...actuales, opcion] })
                                } else {
                                  setDescripcionFisica({ ...descripcionFisica, caracteristicasOjos: actuales.filter((c) => c !== opcion) })
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="text-gray-800">{opcion}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 6. Otros rasgos distintivos */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-800 mb-3">6. Otros rasgos distintivos</h4>
                    <div className="flex flex-wrap gap-3">
                      {opcionesOtrosRasgos.map((opcion) => (
                        <label key={opcion} className="flex items-center text-sm text-gray-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={descripcionFisica.otrosRasgos?.includes(opcion) || false}
                            onChange={(e) => {
                              const actuales = descripcionFisica.otrosRasgos || []
                              if (e.target.checked) {
                                setDescripcionFisica({ ...descripcionFisica, otrosRasgos: [...actuales, opcion] })
                              } else {
                                setDescripcionFisica({ ...descripcionFisica, otrosRasgos: actuales.filter((r) => r !== opcion) })
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-gray-800">{opcion}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 7. Detalles adicionales */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-800 mb-3">7. Detalles adicionales</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Agregar detalles adicionales no mencionados anteriormente
                      </label>
                      <textarea
                        value={descripcionFisica.detallesAdicionales || ''}
                        onChange={(e) => setDescripcionFisica({ ...descripcionFisica, detallesAdicionales: e.target.value.toUpperCase() })}
                        placeholder="Ingrese cualquier detalle físico adicional que considere relevante..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase transition-colors resize-vertical"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Este campo permite agregar información adicional que no esté contemplada en las opciones anteriores.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={guardarBorrador}
                  disabled={guardandoBorrador}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {guardandoBorrador ? 'Guardando...' : 'Guardar Borrador'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Anterior
                </button>
              </div>
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
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="usarRango"
                  {...registerDenuncia('usarRango')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="usarRango" className="ml-2 block text-sm font-medium text-gray-700">
                  El hecho ocurrió en un rango de fechas/horas (fecha/hora desconocida)
                </label>
              </div>

              {!usarRango ? (
                // Fecha y hora única
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
              ) : (
                // Rango de fechas/horas
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Fecha y Hora de Inicio</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Inicio *
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
                          Hora de Inicio (HH:MM) *
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
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Fecha y Hora de Fin</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Fin *
                        </label>
                        <input
                          type="date"
                          {...registerDenuncia('fechaHechoFin')}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errorsDenuncia.fechaHechoFin && (
                          <p className="text-red-600 text-sm mt-1">{errorsDenuncia.fechaHechoFin.message as string}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hora de Fin (HH:MM) *
                        </label>
                        <input
                          type="time"
                          {...registerDenuncia('horaHechoFin')}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errorsDenuncia.horaHechoFin && (
                          <p className="text-red-600 text-sm mt-1">{errorsDenuncia.horaHechoFin.message as string}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Denuncia *
                </label>
                <Controller
                  name="tipoDenuncia"
                  control={controlDenuncia}
                  render={({ field }) => (
                    <Select
                      options={tiposDenunciaOptions}
                      value={tiposDenunciaOptions.find((option) => option.value === field.value) || null}
                      onChange={(option) => field.onChange(option?.value || '')}
                      placeholder="Seleccione o busque..."
                      isSearchable
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
                          maxHeight: '300px',
                          zIndex: 9999,
                        }),
                        menuList: (base) => ({
                          ...base,
                          maxHeight: '300px',
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
                  )}
                />
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

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex-1">
                      Lugar del Hecho
                    </h3>
                    <label className="flex items-center ml-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lugarHechoNoAplica}
                        onChange={(e) => {
                          setLugarHechoNoAplica(e.target.checked)
                          if (e.target.checked) {
                            setValueDenuncia('lugarHechoDepartamento', '')
                            setValueDenuncia('lugarHechoCiudad', '')
                            setValueDenuncia('lugarHechoBarrio', '')
                            setValueDenuncia('lugarHechoCalles', '')
                            setValueDenuncia('lugarHecho', '')
                            setCoordenadas(null)
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">No aplica</span>
                    </label>
                  </div>
                  {!lugarHechoNoAplica && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Departamento *
                          </label>
                          <Controller
                            name="lugarHechoDepartamento"
                            control={controlDenuncia}
                            render={({ field }) => (
                              <Select
                                options={lugarHechoDepartamentoOptions}
                                value={lugarHechoDepartamentoOptions.find((option) => option.value === field.value) || null}
                                onChange={(option) => field.onChange(option?.value || '')}
                                isClearable
                                placeholder="Seleccione..."
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
                            )}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ciudad *
                          </label>
                          <Controller
                            name="lugarHechoCiudad"
                            control={controlDenuncia}
                            render={({ field }) => (
                              <Select
                                options={lugarHechoCiudadOptions}
                                value={lugarHechoCiudadOptions.find((option) => option.value === field.value) || null}
                                onChange={(option) => field.onChange(option?.value || '')}
                                isClearable
                                isDisabled={!lugarHechoDepartamento}
                                placeholder={lugarHechoDepartamento ? 'Seleccione...' : 'Seleccione un departamento primero'}
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
                            )}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Barrio
                          </label>
                          <Controller
                            name="lugarHechoBarrio"
                            control={controlDenuncia}
                            render={({ field }) => (
                              <Select
                                options={lugarHechoBarrioOptions}
                                value={lugarHechoBarrioOptions.find((option) => option.value === field.value) || null}
                                onChange={(option) => field.onChange(option?.value || '')}
                                isClearable
                                isDisabled={!lugarHechoCiudad}
                                placeholder={lugarHechoCiudad ? 'Seleccione...' : 'Seleccione una ciudad primero'}
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
                            )}
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Calles / Referencias *
                        </label>
                        <input
                          {...registerDenuncia('lugarHechoCalles')}
                          onChange={(e) => {
                            convertirAMayusculas(e)
                            registerDenuncia('lugarHechoCalles').onChange(e)
                          }}
                          autoComplete="off"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                        />
                      </div>
                    </>
                  )}
                  <div className="flex gap-2 mt-4">
                    <input
                      {...registerDenuncia('lugarHecho')}
                      type="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarMapa(true)}
                      disabled={lugarHechoNoAplica}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Abrir Mapa
                    </button>
                  </div>
                  {!lugarHechoNoAplica && coordenadas && (
                    <p className="text-sm text-gray-600 mt-1">
                      Coordenadas: {coordenadas.lat.toFixed(6)}, {coordenadas.lng.toFixed(6)}
                    </p>
                  )}
                  {errorsDenuncia.lugarHecho && (
                    <p className="text-red-600 text-sm mt-1">{errorsDenuncia.lugarHecho.message as string}</p>
                  )}
                </div>
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

              {/* Campos ocultos: Monto estimado de daño patrimonial y Moneda */}
              <div className="hidden grid grid-cols-2 gap-4">
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
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={guardarBorrador}
                  disabled={guardandoBorrador || loading}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {guardandoBorrador ? 'Guardando...' : 'Guardar Borrador'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaso(2)}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Anterior
                </button>
              </div>
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
                  type="button"
                  onClick={usuario?.usuario === 'garv' ? () => onDenunciaPrueba(watchDenuncia()) : generarVistaPrevia}
                  disabled={generandoVistaPrevia || guardandoBorrador || loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generando...' : usuario?.usuario === 'garv' ? 'PRUEBA' : (generandoVistaPrevia ? 'Generando vista previa...' : 'Finalizar')}
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

      {/* Modal de confirmación después de guardar borrador */}
      {mostrarModalBorrador && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Borrador Guardado</h3>
            <p className="text-gray-600 mb-6">
              El borrador ha sido guardado exitosamente.
            </p>

            <div className="flex gap-4">
              <button
                onClick={permanecerEnPagina}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
              >
                Continuar Editando
              </button>
              <button
                onClick={irAlInicio}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
              >
                Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de vista previa antes de finalizar */}
      {mostrarModalVistaPrevia && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Header con gradiente */}
            <div className="flex justify-between items-center px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-700 border-b border-blue-500">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Vista Previa de la Denuncia</h3>
                <p className="text-sm text-blue-100">Revise el contenido antes de finalizar</p>
              </div>
              <button
                onClick={() => setMostrarModalVistaPrevia(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
                aria-label="Cerrar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido con scroll */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="p-8">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-10 max-w-4xl mx-auto">
                  <div className="prose prose-lg max-w-none font-lato" style={{ fontFamily: 'var(--font-lato), Lato, sans-serif' }}>
                    <div
                      className="text-[15px] text-gray-900 leading-[1.8] tracking-wide antialiased font-lato"
                      style={{ fontFamily: 'var(--font-lato), Lato, sans-serif' }}
                      dangerouslySetInnerHTML={{ __html: textoVistaPrevia.replace(/\n/g, '<br />') }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer con botones */}
            <div className="flex gap-4 px-8 py-6 bg-white border-t border-gray-200 rounded-b-2xl">
              <button
                onClick={() => setMostrarModalVistaPrevia(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 font-semibold transition-all duration-200 shadow-sm hover:shadow"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  // Prevenir clics múltiples
                  if (isSubmittingRef.current || loading) {
                    return
                  }
                  setMostrarModalVistaPrevia(false)
                  const denunciaData = watchDenuncia()
                  // Llamar directamente a onDenunciaSubmit
                  await onDenunciaSubmit(denunciaData)
                }}
                disabled={isSubmittingRef.current || loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </span>
                ) : (
                  'Confirmar y Finalizar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



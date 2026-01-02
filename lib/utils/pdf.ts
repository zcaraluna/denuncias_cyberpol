import { jsPDF } from 'jspdf'
import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'

// URL base para la verificación de denuncias (se puede configurar con variable de entorno)
const URL_BASE_VERIFICACION = process.env.NEXT_PUBLIC_URL_BASE || 'https://neo.s1mple.cloud'

const datosOficina = {
  direccion: "E. V. Haedo 725 casi O'Leary",
  telefono: '(021) 443-159',
  fax: '(021) 443-126 (021) 441-111',
  email: 'ayudantia@delitoseconomicos.gov.py',
}

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return ''
  
  // Si es un objeto Date, extraer componentes directamente (sin conversión de timezone)
  // PostgreSQL normalmente devuelve DATE como string "YYYY-MM-DD", pero si viene como Date,
  // extraemos los componentes directamente para evitar problemas de timezone
  let dateString: string
  if (dateStr instanceof Date) {
    // Usar UTC para extraer componentes y evitar problemas de timezone
    const año = dateStr.getUTCFullYear()
    const mes = String(dateStr.getUTCMonth() + 1).padStart(2, '0')
    const dia = String(dateStr.getUTCDate()).padStart(2, '0')
    dateString = `${año}-${mes}-${dia}`
  } else {
    dateString = String(dateStr)
  }
  
  try {
    const [año, mes, dia] = dateString.split('-')
    return `${dia}/${mes}/${año}`
  } catch {
    return dateString
  }
}

export interface Denunciante {
  'Nombres y Apellidos': string
  'Tipo de Documento'?: string
  'Cédula de Identidad': string
  'Número de Documento'?: string
  'Nacionalidad': string
  'Estado Civil': string
  'Edad': string
  'Fecha de Nacimiento': string
  'Lugar de Nacimiento': string
  'Número de Teléfono': string
  'Domicilio': string | null
  'Correo Electrónico': string | null
  'Profesión': string | null
}

export type RolInvolucrado = 'principal' | 'co-denunciante' | 'abogado'

export interface DenuncianteInvolucrado {
  rol: RolInvolucrado
  nombres: string
  tipoDocumento?: string | null
  numeroDocumento?: string | null
  telefono?: string | null
  correo?: string | null
  profesion?: string | null
  matricula?: string | null
  representaA?: string | null
  domicilio?: string | null
  nacionalidad?: string | null
  estadoCivil?: string | null
  edad?: string | null
  fechaNacimiento?: string | null
  lugarNacimiento?: string | null
  conCartaPoder?: boolean | null
  cartaPoderFecha?: string | null
  cartaPoderNumero?: string | null
  cartaPoderNotario?: string | null
}

export interface DatosDenuncia {
  fecha_denuncia: string
  hora_denuncia: string
  fecha_hecho: string
  hora_hecho: string
  fecha_hecho_fin?: string | null
  hora_hecho_fin?: string | null
  tipo_denuncia: string
  otro_tipo?: string | null
  lugar_hecho: string
  relato: string
  orden: number
  hash: string
  oficina: string
  grado_operador: string
  nombre_operador: string
  tipo_papel?: 'oficio' | 'a4'
  latitud?: number | null
  longitud?: number | null
  monto_dano?: number | null
  moneda?: string | null
  nombre_autor?: string | null
  cedula_autor?: string | null
  domicilio_autor?: string | null
  nacionalidad_autor?: string | null
  estado_civil_autor?: string | null
  edad_autor?: string | null
  fecha_nacimiento_autor?: string | null
  lugar_nacimiento_autor?: string | null
  telefono_autor?: string | null
  profesion_autor?: string | null
  descripcion_fisica?: string | null
  // Para firma dinámica
  operador_autorizado?: {
    grado: string
    nombre: string
  }
  es_operador_autorizado?: boolean
  involucrados?: DenuncianteInvolucrado[]
}

// Función para sanitizar caracteres especiales que jsPDF no puede renderizar con Helvetica
const sanitizarTextoParaPDF = (texto: string): string => {
  return texto
    .replace(/≤/g, 'de')        // menor o igual → "de"
    .replace(/≥/g, 'de')        // mayor o igual → "de"  
    .replace(/–/g, '-')         // guión largo → guión normal
    .replace(/—/g, '-')         // guión extra largo → guión normal
    .replace(/'/g, "'")         // comilla tipográfica → comilla simple
    .replace(/'/g, "'")         // comilla tipográfica → comilla simple
    .replace(/"/g, '"')         // comilla tipográfica → comilla doble
    .replace(/"/g, '"')         // comilla tipográfica → comilla doble
    .replace(/…/g, '...')       // elipsis → tres puntos
    .replace(/•/g, '-')         // viñeta → guión
    .replace(/°/g, 'o')         // símbolo de grado → o
}

const formatearDocumento = (tipo?: string | null, numero?: string | null) => {
  const tipoLimpio = tipo ? tipo.trim() : ''
  const numeroLimpio = numero ? numero.trim() : ''
  if (!tipoLimpio && !numeroLimpio) return null
  if (tipoLimpio && numeroLimpio) return `${tipoLimpio} ${numeroLimpio.toUpperCase()}`
  return tipoLimpio || numeroLimpio.toUpperCase()
}

const unirConY = (partes: string[]): string => {
  if (partes.length === 0) return ''
  if (partes.length === 1) return partes[0]
  const ultima = partes[partes.length - 1]
  const restantes = partes.slice(0, -1)
  return `${restantes.join(', ')}, y ${ultima}`
}

const obtenerDatosAbogado = (item: DenuncianteInvolucrado) => {
  const nombre = item.nombres ? item.nombres.toUpperCase() : 'NOMBRE NO ESPECIFICADO'
  const documento = formatearDocumento(item.tipoDocumento, item.numeroDocumento)
  const matricula = item.matricula ? item.matricula.toUpperCase() : 'SIN MATRÍCULA REGISTRADA'
  const telefono = item.telefono && item.telefono.trim() !== '' ? item.telefono.toUpperCase() : null
  const correo = item.correo && item.correo.trim() !== '' ? item.correo : null
  return { nombre, documento, matricula, telefono, correo }
}

const describirAbogadoIntro = (item: DenuncianteInvolucrado) => {
  const { nombre, documento, matricula, telefono, correo } = obtenerDatosAbogado(item)
  const partes: string[] = []
  if (documento) partes.push(`con ${documento}`)
  partes.push(`Matrícula Profesional Nº ${matricula}`)
  if (telefono) partes.push(`teléfono ${telefono}`)
  if (correo) partes.push(`correo electrónico ${correo}`)
  return `${nombre}, ${unirConY(partes)}`
}

// Función para generar texto de descripción física a partir de objeto JSON
const generarTextoDescripcionFisica = (desc: any): string => {
  const partes: string[] = []
  
  // 1. Constitución física - títulos en minúsculas, valores en mayúsculas
  const constitucion: string[] = []
  if (desc.altura) {
    const alturaMayus = desc.altura.toUpperCase()
    constitucion.push(`altura ${alturaMayus}`)
  }
  if (desc.complexion) {
    const complexionMayus = desc.complexion.toUpperCase()
    constitucion.push(`complexión ${complexionMayus}`)
  }
  if (desc.postura) {
    const posturaMayus = desc.postura.toUpperCase()
    constitucion.push(`postura ${posturaMayus}`)
  }
  if (constitucion.length > 0) {
    partes.push(`constitución física: ${constitucion.join(', ')}`)
  }
  
  // 2. Forma del rostro
  if (desc.formaRostro) {
    partes.push(`forma del rostro: ${desc.formaRostro.toUpperCase()}`)
  }
  
  // 3. Piel
  const piel: string[] = []
  if (desc.tonoPiel) piel.push(`tono ${desc.tonoPiel.toUpperCase()}`)
  if (desc.texturaPiel) piel.push(`textura ${desc.texturaPiel.toUpperCase()}`)
  if (piel.length > 0) {
    partes.push(`piel: ${piel.join(', ')}`)
  }
  
  // 4. Cabello
  const cabello: string[] = []
  if (desc.colorCabello) {
    if (desc.colorCabello === 'Teñido' && desc.cabelloTeñido) {
      cabello.push(`color teñido (${desc.cabelloTeñido.toUpperCase()})`)
    } else {
      cabello.push(`color ${desc.colorCabello.toUpperCase()}`)
    }
  }
  if (desc.longitudCabello) cabello.push(`longitud ${desc.longitudCabello.toUpperCase()}`)
  if (desc.texturaCabello) cabello.push(`textura ${desc.texturaCabello.toUpperCase()}`)
  if (desc.peinado) cabello.push(`peinado ${desc.peinado.toUpperCase()}`)
  if (cabello.length > 0) {
    partes.push(`cabello: ${cabello.join(', ')}`)
  }
  
  // 5. Ojos
  const ojos: string[] = []
  if (desc.formaOjos) ojos.push(`forma ${desc.formaOjos.toUpperCase()}`)
  if (desc.colorOjos) ojos.push(`color ${desc.colorOjos.toUpperCase()}`)
  if (desc.caracteristicasOjos && Array.isArray(desc.caracteristicasOjos) && desc.caracteristicasOjos.length > 0) {
    ojos.push(desc.caracteristicasOjos.map((c: string) => c.toUpperCase()).join(', '))
  }
  if (ojos.length > 0) {
    partes.push(`ojos: ${ojos.join(', ')}`)
  }
  
  // 6. Otros rasgos distintivos
  if (desc.otrosRasgos && Array.isArray(desc.otrosRasgos) && desc.otrosRasgos.length > 0) {
    partes.push(`otros rasgos distintivos: ${desc.otrosRasgos.map((r: string) => r.toUpperCase()).join(', ')}`)
  }
  
  // 7. Detalles adicionales (texto libre)
  if (desc.detallesAdicionales && desc.detallesAdicionales.trim() !== '') {
    partes.push(`detalles adicionales: ${desc.detallesAdicionales.trim().toUpperCase()}`)
  }
  
  return partes.join(', ') + '.'
}

const describirCartaPoder = (item: DenuncianteInvolucrado) => {
  if (!item.conCartaPoder) return null
  const partes: string[] = []
  if (item.cartaPoderFecha) {
    let fechaFormateada: string
    const fechaStr = String(item.cartaPoderFecha)
    
    // Si contiene 'T' (formato ISO completo), extraer solo la fecha
    if (fechaStr.includes('T')) {
      fechaFormateada = formatDate(fechaStr.split('T')[0])
    } 
    // Si es formato YYYY-MM-DD, formatear directamente
    else if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
      fechaFormateada = formatDate(fechaStr)
    }
    // Si parece un objeto Date convertido a string (contiene "GMT" o días de la semana), intentar parsear
    else if (fechaStr.includes('GMT') || /^[A-Z][a-z]{2}\s/.test(fechaStr)) {
      try {
        const fecha = new Date(fechaStr)
        if (!isNaN(fecha.getTime())) {
          const año = fecha.getFullYear()
          const mes = String(fecha.getMonth() + 1).padStart(2, '0')
          const dia = String(fecha.getDate()).padStart(2, '0')
          fechaFormateada = `${dia}/${mes}/${año}`
        } else {
          fechaFormateada = fechaStr
        }
      } catch {
        fechaFormateada = fechaStr
      }
    }
    // Si no coincide con ningún patrón, intentar usar formatDate directamente
    else {
      try {
        fechaFormateada = formatDate(fechaStr)
      } catch {
        fechaFormateada = fechaStr
      }
    }
    partes.push(`otorgada en fecha ${fechaFormateada}`)
  }
  if (item.cartaPoderNotario) partes.push(`ante el notario ${item.cartaPoderNotario.toUpperCase()}`)
  return partes.length > 0 ? `con carta poder ${partes.join(', ')}` : 'con carta poder'
}

const describirCoDenunciante = (item: DenuncianteInvolucrado) => {
  const partes: string[] = []
  const documento = formatearDocumento(item.tipoDocumento, item.numeroDocumento)
  if (documento) partes.push(documento)
  if (item.domicilio) partes.push(`DOMICILIO: ${item.domicilio}`)
  if (item.profesion) partes.push(`PROFESIÓN: ${item.profesion.toUpperCase()}`)
  if (item.telefono) partes.push(`TEL.: ${item.telefono.toUpperCase()}`)
  if (item.correo) partes.push(`CORREO: ${item.correo}`)
  return `${item.nombres.toUpperCase()}${partes.length ? ` (${partes.join(', ')})` : ''}`
}

const describirAbogado = (item: DenuncianteInvolucrado) => {
  const { nombre, documento, matricula, telefono, correo } = obtenerDatosAbogado(item)
  const partes: string[] = []
  if (documento) partes.push(documento)
  partes.push(`MATRÍCULA PROFESIONAL Nº ${matricula}`)
  partes.push(`TEL.: ${telefono}`)
  partes.push(`CORREO: ${correo}`)
  let texto = nombre
  if (partes.length) {
    texto += ` (${partes.join(', ')})`
  }
  if (item.representaA) {
    texto += ` - Patrocina a ${item.representaA.toUpperCase()}`
  }
  return texto
}

const describirCoDenuncianteIntro = (item: DenuncianteInvolucrado) => {
  const documento = formatearDocumento(item.tipoDocumento, item.numeroDocumento) ?? 'DOCUMENTO NO ESPECIFICADO'
  const nacionalidad = item.nacionalidad ? item.nacionalidad.toUpperCase() : 'NO ESPECIFICADA'
  const estadoCivil = item.estadoCivil ? item.estadoCivil.toUpperCase() : 'NO ESPECIFICADO'
  const edad = item.edad ? `${item.edad} años` : 'EDAD NO ESPECIFICADA'
  const fechaNacimiento = item.fechaNacimiento ? formatDate(item.fechaNacimiento) : 'FECHA NO ESPECIFICADA'
  const lugarNacimiento = item.lugarNacimiento ? item.lugarNacimiento.toUpperCase() : 'LUGAR NO ESPECIFICADO'
  const domicilio = item.domicilio ? item.domicilio : 'DOMICILIO NO ESPECIFICADO'
  const telefono = item.telefono && item.telefono.trim() !== '' ? item.telefono.toUpperCase() : null
  const correo = item.correo && item.correo.trim() !== '' ? item.correo : null

  const partes: string[] = [
    `${item.nombres.toUpperCase()}, con ${documento}, de nacionalidad ${nacionalidad}, estado civil ${estadoCivil}, ${edad}, fecha de nacimiento ${fechaNacimiento}, en ${lugarNacimiento}, domiciliado en ${domicilio}`
  ]
  if (telefono) partes.push(`teléfono ${telefono}`)
  if (correo) partes.push(`correo electrónico ${correo}`)
  
  return partes.join(', ')
}

function agregarEncabezado(doc: jsPDF, titulo: string, anchoPagina: number) {
  // Cargar y agregar logos
  try {
    // Logo izquierdo - policianacional.png
    const logoIzq = fs.readFileSync(path.join(process.cwd(), 'policianacional.png'))
    doc.addImage(logoIzq, 'PNG', 12, 12, 35, 15)

    // Logo centro - dchef.png
    const logoCentro = fs.readFileSync(path.join(process.cwd(), 'dchef.png'))
    doc.addImage(logoCentro, 'PNG', 96, 5, 25, 25, undefined, undefined, 0)

    // Logo derecho - gobiernonacional.jpg (ajustar posición según ancho de página)
    const logoDer = fs.readFileSync(path.join(process.cwd(), 'gobiernonacional.jpg'))
    const posicionDerecho = anchoPagina === 210 ? 150 : 170 // A4: más hacia el centro
    doc.addImage(logoDer, 'JPG', posicionDerecho, 10, 40, 20, undefined, undefined, 0)
  } catch (error) {
    console.error('Error cargando logos:', error)
  }

  // Encabezado
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(
    'DIRECCIÓN CONTRA HECHOS PUNIBLES ECONÓMICOS Y FINANCIEROS',
    108,
    35,
    { align: 'center' }
  )

  doc.setFontSize(12)
  doc.text('SALA DE DENUNCIAS', 108, 41, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Dirección: ${datosOficina.direccion}`, 108, 48, { align: 'center' })
  doc.text(
    `Teléfono: ${datosOficina.telefono}   Fax: ${datosOficina.fax}`,
    108,
    53,
    { align: 'center' }
  )
  doc.text(`E-mail: ${datosOficina.email}`, 108, 58, { align: 'center' })

  // Línea separadora
  doc.setLineWidth(0.5)
  doc.line(30, 63, 186, 63)

  // Título del acta
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(titulo, 108, 72, { align: 'center' })
}

export async function generarPDF(
  numeroOrden: number,
  denunciante: Denunciante,
  datosDenuncia: DatosDenuncia
): Promise<Buffer> {
  // Determinar el tamaño de papel (A4: 210x297mm, Oficio: 216x330mm)
  const formatoPapel = datosDenuncia.tipo_papel === 'a4' ? [210, 297] : [216, 330]
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: formatoPapel as [number, number],
  })

  const año = datosDenuncia.fecha_denuncia.split('-')[0]
  const titulo = `ACTA DE DENUNCIA Nº ${numeroOrden}/${año}`

  const fechaDenuncia = formatDate(datosDenuncia.fecha_denuncia)
  const fechaNacimiento = formatDate(denunciante['Fecha de Nacimiento'])
  const fechaHecho = formatDate(datosDenuncia.fecha_hecho)
  const tieneRango = datosDenuncia.fecha_hecho_fin && datosDenuncia.hora_hecho_fin
  const fechaHechoFin = tieneRango && datosDenuncia.fecha_hecho_fin ? formatDate(datosDenuncia.fecha_hecho_fin) : null
  const involucrados = (datosDenuncia.involucrados || []).filter(
    (involucrado) => involucrado.rol !== 'principal'
  )
  const coDenunciantes = involucrados.filter((involucrado) => involucrado.rol === 'co-denunciante')
  const abogados = involucrados.filter((involucrado) => involucrado.rol === 'abogado')
  const abogadoConCartaPoder = abogados.find((abogado) => Boolean(abogado.conCartaPoder) === true)

  // Agregar encabezado en la primera página
  agregarEncabezado(doc, titulo, formatoPapel[0])

  // Aviso legal
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  const aviso =
    'LA PRESENTE ACTA SE REALIZA CONFORME A LOS SIGUIENTES: ARTÍCULO 284. "DENUNCIA", ARTÍCULO 285. "FORMA Y CONTENIDO", ARTÍCULO 289. "DENUNCIA ANTE LA POLICÍA" DE LA LEY 1286/98 "CODIGO PROCESAL PENAL".'
  doc.text(aviso, 30, 78, { align: 'justify', maxWidth: 156 })

  // Primer párrafo
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  
  let parrafoIntroduccion = ''
  
  // Caso especial: Abogado con carta poder (el abogado es quien concurre)
  if (abogadoConCartaPoder) {
    const { nombre, documento, matricula, telefono, correo } = obtenerDatosAbogado(abogadoConCartaPoder)
    const cartaPoderTexto = describirCartaPoder(abogadoConCartaPoder) || 'con carta poder'
    
    const partesAbogado: string[] = [`${nombre}`]
    if (documento) partesAbogado.push(`con ${documento}`)
    partesAbogado.push(`Matrícula Profesional Nº ${matricula}`)
    if (telefono) partesAbogado.push(`teléfono ${telefono}`)
    if (correo) partesAbogado.push(`correo electrónico ${correo}`)
    
    parrafoIntroduccion = `En la Sala de Denuncias de la Dirección Contra Hechos Punibles Económicos y Financieros, Oficina ${datosDenuncia.oficina.toUpperCase()}, en fecha ${fechaDenuncia} siendo las ${datosDenuncia.hora_denuncia}, ante mí ${datosDenuncia.grado_operador.toUpperCase()} ${datosDenuncia.nombre_operador.toUpperCase()}, concurre ${partesAbogado.join(', ')}, ${cartaPoderTexto}, en representación de ${denunciante['Nombres y Apellidos'].toUpperCase()}, con ${denunciante['Tipo de Documento'] || 'Cédula de Identidad Paraguaya'} número ${(denunciante['Número de Documento'] || denunciante['Cédula de Identidad']).toUpperCase()}, de nacionalidad ${denunciante['Nacionalidad'].toUpperCase()}, estado civil ${denunciante['Estado Civil'].toUpperCase()}, ${denunciante['Edad']} años de edad, fecha de nacimiento ${fechaNacimiento}, en ${denunciante['Lugar de Nacimiento'].toUpperCase()}${denunciante['Domicilio'] ? `, domiciliado en ${denunciante['Domicilio']}` : ''}`
    
    if (coDenunciantes.length > 0) {
      const listadoCo = coDenunciantes.map(describirCoDenuncianteIntro).join('; ')
      parrafoIntroduccion += ` y de ${coDenunciantes.length > 1 ? 'los co-denunciantes' : 'el co-denunciante'} ${listadoCo}`
    }
    
    parrafoIntroduccion += ', y expone cuanto sigue:'
  } else {
    // Caso normal: Denunciante presente (con o sin abogado acompañante)
    const telefonoPrincipal =
      denunciante['Número de Teléfono'] && denunciante['Número de Teléfono'].trim() !== ''
        ? denunciante['Número de Teléfono'].toUpperCase()
        : null
    const correoPrincipal =
      denunciante['Correo Electrónico'] && denunciante['Correo Electrónico'].trim() !== ''
        ? denunciante['Correo Electrónico']
        : null

    const partesDenunciante: string[] = [
      `${denunciante['Nombres y Apellidos'].toUpperCase()}, con ${denunciante['Tipo de Documento'] || 'Cédula de Identidad Paraguaya'} número ${(denunciante['Número de Documento'] || denunciante['Cédula de Identidad']).toUpperCase()}, de nacionalidad ${denunciante['Nacionalidad'].toUpperCase()}, estado civil ${denunciante['Estado Civil'].toUpperCase()}, ${denunciante['Edad']} años de edad, fecha de nacimiento ${fechaNacimiento}, en ${denunciante['Lugar de Nacimiento'].toUpperCase()}${denunciante['Domicilio'] ? `, domiciliado en ${denunciante['Domicilio']}` : ''}`
    ]
    if (telefonoPrincipal) {
      partesDenunciante.push(`teléfono ${telefonoPrincipal}`)
    }
    if (correoPrincipal) {
      partesDenunciante.push(`correo electrónico ${correoPrincipal}`)
    }
    
    parrafoIntroduccion = `En la Sala de Denuncias de la Dirección Contra Hechos Punibles Económicos y Financieros, Oficina ${datosDenuncia.oficina.toUpperCase()}, en fecha ${fechaDenuncia} siendo las ${datosDenuncia.hora_denuncia}, ante mí ${datosDenuncia.grado_operador.toUpperCase()} ${datosDenuncia.nombre_operador.toUpperCase()}, concurre ${partesDenunciante.join(', ')}`

    if (coDenunciantes.length > 0) {
      const listadoCo = coDenunciantes.map(describirCoDenuncianteIntro).join('; ')
      const acompanado =
        coDenunciantes.length > 1 ? 'acompañados por' : 'acompañado por'
      parrafoIntroduccion += `, ${acompanado} ${listadoCo}`
    }

    if (abogados.length > 0) {
      const listadoAbogados = abogados.map(describirAbogadoIntro).join('; ')
      const sujetoAsistido = coDenunciantes.length > 0 ? 'asistidos' : 'asistido'
      const posesivo = abogados.length > 1 ? 'sus representantes legales' : 'su representante legal'
      const relativo = abogados.length > 1 ? 'quienes' : 'quien'
      const pronombre = coDenunciantes.length > 0 ? 'los' : 'lo'
      parrafoIntroduccion += `, ${sujetoAsistido} por ${posesivo} ${listadoAbogados}, ${relativo} ${pronombre} patrocina en el presente acto`
    }

    parrafoIntroduccion += coDenunciantes.length > 0 ? ', y exponen cuanto sigue:' : ', y expone cuanto sigue:'
  }

  const alturaLinea = 5
  let yActualIntroduccion = 90
  const parrafosIntro = [parrafoIntroduccion]
  parrafosIntro.forEach((parrafo, index) => {
    if (index > 0) {
      yActualIntroduccion += alturaLinea
    }
    // Sanitizar caracteres especiales antes de procesar
    const parrafoSanitizado = sanitizarTextoParaPDF(parrafo)
    const lineas = doc.splitTextToSize(parrafoSanitizado, 156)
    doc.text(lineas, 30, yActualIntroduccion, { align: 'justify', maxWidth: 156 })
    yActualIntroduccion += lineas.length * alturaLinea
  })

  // Segundo párrafo
  const hayCoDenunciantes = coDenunciantes.length > 0
  const tipoDenunciaUpper = datosDenuncia.tipo_denuncia.toUpperCase()
  const esExtravio = tipoDenunciaUpper === 'EXTRAVÍO DE OBJETOS Y/O DOCUMENTOS'
  const textoSupuesto = esExtravio ? '' : 'un supuesto '
  let parrafo2 = `Que por la presente ${hayCoDenunciantes ? 'vienen' : 'viene'} a realizar una denuncia sobre ${textoSupuesto}${tipoDenunciaUpper}`
  if (
    tipoDenunciaUpper === 'OTRO' &&
    datosDenuncia.otro_tipo
  ) {
    parrafo2 = parrafo2.replace(
      'OTRO',
      `OTRO (${datosDenuncia.otro_tipo.toUpperCase()})`
    )
  }
  // Formatear fecha/hora del hecho (única o rango)
  if (tieneRango && fechaHechoFin) {
    if (datosDenuncia.lugar_hecho && datosDenuncia.lugar_hecho.trim() !== '') {
      parrafo2 += `, ocurrido entre las ${datosDenuncia.hora_hecho} horas del ${fechaHecho} y las ${datosDenuncia.hora_hecho_fin} horas del ${fechaHechoFin}, en la dirección ${datosDenuncia.lugar_hecho.toUpperCase()}`
    } else {
      parrafo2 += `, ocurrido entre las ${datosDenuncia.hora_hecho} horas del ${fechaHecho} y las ${datosDenuncia.hora_hecho_fin} horas del ${fechaHechoFin}`
    }
  } else {
    if (datosDenuncia.lugar_hecho && datosDenuncia.lugar_hecho.trim() !== '') {
      parrafo2 += `, ocurrido en fecha ${fechaHecho} siendo las ${datosDenuncia.hora_hecho} aproximadamente, en la dirección ${datosDenuncia.lugar_hecho.toUpperCase()}`
    } else {
      parrafo2 += `, ocurrido en fecha ${fechaHecho} siendo las ${datosDenuncia.hora_hecho} aproximadamente`
    }
  }

  if (datosDenuncia.nombre_autor) {
    const detallesAutor = []
    if (datosDenuncia.cedula_autor)
      detallesAutor.push(
        `con número de documento ${datosDenuncia.cedula_autor.toUpperCase()}`
      )
    if (datosDenuncia.domicilio_autor)
      detallesAutor.push(
        `con domicilio en ${datosDenuncia.domicilio_autor.toUpperCase()}`
      )
    if (datosDenuncia.nacionalidad_autor)
      detallesAutor.push(
        `de nacionalidad ${datosDenuncia.nacionalidad_autor.toUpperCase()}`
      )
    if (datosDenuncia.estado_civil_autor)
      detallesAutor.push(
        `estado civil ${datosDenuncia.estado_civil_autor.toUpperCase()}`
      )
    if (datosDenuncia.edad_autor)
      detallesAutor.push(`edad ${datosDenuncia.edad_autor} años`)
    if (datosDenuncia.fecha_nacimiento_autor)
      detallesAutor.push(
        `nacido en fecha ${formatDate(datosDenuncia.fecha_nacimiento_autor)}`
      )
    if (datosDenuncia.lugar_nacimiento_autor)
      detallesAutor.push(
        `en ${datosDenuncia.lugar_nacimiento_autor.toUpperCase()}`
      )
    if (datosDenuncia.telefono_autor)
      detallesAutor.push(
        `número de teléfono ${datosDenuncia.telefono_autor.toUpperCase()}`
      )
    if (datosDenuncia.profesion_autor)
      detallesAutor.push(
        `de profesión ${datosDenuncia.profesion_autor.toUpperCase()}`
      )

    parrafo2 += `, sindicando como supuesto autor a ${datosDenuncia.nombre_autor.toUpperCase()}`
    if (detallesAutor.length > 0) {
      parrafo2 += ', ' + detallesAutor.join(', ') + '.'
    } else {
      parrafo2 += '.'
    }
  } else if (datosDenuncia.descripcion_fisica && datosDenuncia.descripcion_fisica.trim() !== '') {
    // Autor desconocido con descripción física
    parrafo2 += ', siendo el supuesto autor una persona DESCONOCIDA por la persona denunciante'
    try {
      // Intentar parsear como JSON
      const descFisicaObj = JSON.parse(datosDenuncia.descripcion_fisica)
      const textoDesc = generarTextoDescripcionFisica(descFisicaObj)
      if (textoDesc.trim() !== '') {
        parrafo2 += `, a quien describe físicamente de la siguiente manera: ${textoDesc}`
      } else {
        parrafo2 += '.'
      }
    } catch {
      // Si no es JSON, usar como texto plano (legacy)
      parrafo2 += `, a quien describe físicamente de la siguiente manera: ${datosDenuncia.descripcion_fisica.toUpperCase()}.`
    }
  }
  // Si no hay nombre_autor ni descripcion_fisica, no agregamos nada sobre el autor (caso "No aplica")

  const yParrafo2 = yActualIntroduccion
  // Sanitizar caracteres especiales antes de procesar
  const parrafo2Sanitizado = sanitizarTextoParaPDF(parrafo2)
  const splitParrafo2 = doc.splitTextToSize(parrafo2Sanitizado, 156)
  doc.text(splitParrafo2, 30, yParrafo2, { align: 'justify', maxWidth: 156 })

  // Relato
  const yRelato = yParrafo2 + splitParrafo2.length * alturaLinea
  doc.setFont('helvetica', 'normal')
  doc.text('De acuerdo a los hechos que se describen a continuación:', 30, yRelato)
  
  // Determinar quién firma: si hay abogado con carta poder, firma el abogado
  const hayAbogadoConCartaPoder = Boolean(abogadoConCartaPoder)
  let textoFirmas: string
  if (hayAbogadoConCartaPoder) {
    // Cuando hay abogado con carta poder, solo firma el abogado (y el interviniente)
    textoFirmas = 'FIRMANDO AL PIE EL REPRESENTANTE LEGAL Y EL INTERVINIENTE'
  } else {
    textoFirmas = coDenunciantes.length > 0
      ? 'FIRMANDO AL PIE LOS DENUNCIANTES Y EL INTERVINIENTE'
      : 'FIRMANDO AL PIE EL DENUNCIANTE Y EL INTERVINIENTE'
  }
  const textoPersonas = coDenunciantes.length > 0
    ? 'LAS PERSONAS RECURRENTES SON INFORMADAS'
    : 'LA PERSONA RECURRENTE ES INFORMADA'
  const relato = `${datosDenuncia.relato}\nNO HABIENDO NADA MÁS QUE AGREGAR SE DA POR TERMINADA EL ACTA, PREVIA LECTURA Y RATIFICACIÓN DE SU CONTENIDO, ${textoFirmas}, EN 3 (TRES) COPIAS DEL MISMO TENOR Y EFECTO. ${textoPersonas} SOBRE: ARTÍCULO 289.- "DENUNCIA FALSA"; ARTÍCULO 242.- "TESTIMONIO FALSO"; ARTÍCULO 243.- "DECLARACIÓN FALSA".`
  doc.setFont('helvetica', 'italic')
  // Sanitizar caracteres especiales antes de procesar
  const relatoSanitizado = sanitizarTextoParaPDF(relato)
  const splitRelato = doc.splitTextToSize(relatoSanitizado, 156)
  
  // Escribir el texto del relato con manejo de páginas
  let yActual = yRelato + 5
  let textoRestante = splitRelato
  const alturaLineaRelato = 6
  // Altura máxima para páginas intermedias (usar casi todo el espacio, solo 5mm de margen)
  const alturaMaximaIntermedia = formatoPapel[1] - 5
  // Altura máxima para la última página (dejar espacio suficiente para firmas)
  // Las firmas necesitan: línea (yFirmas) + nombre (+7) + documento (+12) + etiqueta (+17) + margen inferior (5mm)
  // Total real: ~22mm, pero reservamos 28mm para mayor seguridad
  const espacioReservadoFirmas = 28 // Mismo valor para A4 y Oficio
  const alturaMaximaUltima = formatoPapel[1] - espacioReservadoFirmas

  while (textoRestante.length > 0) {
    // Calcular cuántas líneas caben en la última página desde el inicio de página nueva
    const espacioParaUltimaDesdeInicio = alturaMaximaUltima - 80
    const lineasQueCabenUltimaDesdeInicio = Math.floor(espacioParaUltimaDesdeInicio / alturaLineaRelato)
    
    // Determinar si esta será la última página
    const seraUltimaPagina = textoRestante.length <= lineasQueCabenUltimaDesdeInicio
    
    // Usar la altura correspondiente
    const alturaMaxima = seraUltimaPagina ? alturaMaximaUltima : alturaMaximaIntermedia
    const espacioRestante = alturaMaxima - yActual

    // Calcular cuántas líneas caben
    const lineasDisponibles = Math.floor(espacioRestante / alturaLineaRelato)

    if (lineasDisponibles <= 0) {
      // No cabe ni una línea, crear nueva página y continuar bucle
      doc.addPage()
      agregarEncabezado(doc, titulo, formatoPapel[0])
      doc.setFontSize(12)
      doc.setFont('helvetica', 'italic')
      yActual = 80
      continue // Reiniciar el bucle con la nueva página
    } else {
      // Escribir las líneas que caben
      const lineasAEscribir = Math.min(lineasDisponibles, textoRestante.length)
      const lineasPagina = textoRestante.slice(0, lineasAEscribir)
      textoRestante = textoRestante.slice(lineasAEscribir)

      doc.text(lineasPagina, 30, yActual, { align: 'left', maxWidth: 156 })
      
      // Calcular nueva posición Y
      yActual += lineasPagina.length * alturaLineaRelato

      // Si quedan líneas, crear nueva página y continuar bucle
      if (textoRestante.length > 0) {
        doc.addPage()
        agregarEncabezado(doc, titulo, formatoPapel[0])
        doc.setFontSize(12)
        doc.setFont('helvetica', 'italic')
        yActual = 80
      }
    }
  }

  // Verificar si hay espacio suficiente para las firmas en la página actual
  // Las firmas realmente necesitan: línea (yFirmas) + nombre (yFirmas + 7) + documento (yFirmas + 12) + etiqueta (yFirmas + 17) + margen final
  // Total: aproximadamente 17mm para el contenido + 5mm de margen inferior = ~22mm, pero calculamos con más precisión
  const alturaPagina = formatoPapel[1]
  const espacioParaFirmas = yActual + 1 // Espacio mínimo (1mm) antes de la línea de firma
  const alturaFirmas = 17 // Desde la línea hasta la etiqueta (yFirmas + 17)
  const margenInferior = 5 // Margen inferior mínimo
  const alturaNecesariaTotal = alturaFirmas + margenInferior // ~22mm total
  const yFirmasNecesaria = espacioParaFirmas + alturaFirmas
  const espacioDisponible = alturaPagina - yActual
  
  // Si no hay suficiente espacio para las firmas completas (incluyendo margen), crear una nueva página
  if (yFirmasNecesaria + margenInferior > alturaPagina) {
    doc.addPage()
    agregarEncabezado(doc, titulo, formatoPapel[0])
    yActual = 80
  }

  // Agregar firmas en la última página
  // Calcular la posición máxima para las firmas (asegurando que quepan completas)
  const yFirmasMaxima = alturaPagina - alturaFirmas - margenInferior
  const yFirmas = Math.min(yActual + 1, yFirmasMaxima) // Mínimo espacio posible (1mm) para acercar las firmas al máximo
  
  doc.setFont('helvetica', 'normal')

  // Firma izquierda - Interviniente o Operador Autorizado
  doc.setLineWidth(0.5)
  doc.line(30, yFirmas, 66, yFirmas)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  // Determinar qué información mostrar
  let nombreMostrar = datosDenuncia.nombre_operador
  let gradoMostrar = datosDenuncia.grado_operador
  let etiquetaMostrar = 'INTERVINIENTE'
  
  if (datosDenuncia.es_operador_autorizado && datosDenuncia.operador_autorizado) {
    nombreMostrar = `${datosDenuncia.operador_autorizado.nombre}`
    gradoMostrar = datosDenuncia.operador_autorizado.grado
    etiquetaMostrar = 'OPERADOR AUTORIZADO'
  }
  
  doc.text(nombreMostrar.toUpperCase(), 48, yFirmas + 7, {
    align: 'center',
  })
  doc.text(gradoMostrar.toUpperCase(), 48, yFirmas + 12, {
    align: 'center',
  })
  doc.setFont('helvetica', 'bold')
  doc.text(etiquetaMostrar, 48, yFirmas + 17, { align: 'center' })

  // Centro - QR y Hash
  try {
    // Generar código QR con la URL de verificación
    const urlVerificacion = `${URL_BASE_VERIFICACION}/verificar/${datosDenuncia.hash}`
    const qrDataUrl = await QRCode.toDataURL(urlVerificacion, {
      width: 80,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    
    // Agregar QR centrado encima del hash (22x22mm)
    const qrSize = 22
    const qrX = 108 - (qrSize / 2) // Centrado en x=108
    const qrY = yFirmas - 7 // Encima de la línea de firma
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
  } catch (qrError) {
    console.error('Error generando QR:', qrError)
  }
  
  // Hash debajo del QR (con espacio suficiente para no solaparse)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(datosDenuncia.hash, 108, yFirmas + 18, { align: 'center' })

  // Firma derecha - Denunciante o Abogado (si hay carta poder)
  let nombreFirma: string
  let docFirma: string
  let etiquetaFirma: string
  
  if (hayAbogadoConCartaPoder && abogadoConCartaPoder) {
    // Cuando hay abogado con carta poder, firma el abogado
    const { nombre, matricula } = obtenerDatosAbogado(abogadoConCartaPoder)
    nombreFirma = nombre
    docFirma = `MATRÍCULA PROF. Nº ${matricula}`
    etiquetaFirma = 'REPRESENTANTE LEGAL'
  } else {
    // Caso normal: firma el denunciante
    nombreFirma = denunciante['Nombres y Apellidos'].toUpperCase()
    docFirma = `NUMERO DE DOC.: ${denunciante['Número de Documento'] || denunciante['Cédula de Identidad']}`
    etiquetaFirma = 'DENUNCIANTE'
  }
  
  doc.line(150, yFirmas, 186, yFirmas)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(nombreFirma, 168, yFirmas + 7, {
    align: 'center',
  })
  doc.text(docFirma, 168, yFirmas + 12, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.text(etiquetaFirma, 168, yFirmas + 17, { align: 'center' })

  return Buffer.from(doc.output('arraybuffer'))
}

// Función para generar PDF de ampliación de denuncia
export async function generarPDFAmpliacion(
  numeroOrden: number,
  numeroAmpliacion: number,
  denunciante: Denunciante,
  datosDenuncia: DatosDenuncia,
  relatoAmpliacion: string,
  fechaAmpliacion: string,
  horaAmpliacion: string,
  operadorAmpliacion: { grado: string; nombre: string; apellido: string }
): Promise<Buffer> {
  // Determinar el tamaño de papel (A4: 210x297mm, Oficio: 216x330mm)
  const formatoPapel = datosDenuncia.tipo_papel === 'a4' ? [210, 297] : [216, 330]
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: formatoPapel as [number, number],
  })

  // Función helper para convertir cualquier tipo de fecha a string
  const toDateString = (date: any): string => {
    if (!date) return ''
    if (date instanceof Date) {
      return date.toISOString().split('T')[0]
    }
    if (typeof date === 'string') {
      return date
    }
    return String(date)
  }

  // Convertir fecha_denuncia a string si es necesario
  const fechaDenunciaStr = toDateString(datosDenuncia.fecha_denuncia)
  const año = fechaDenunciaStr.split('-')[0]
  const titulo = `AMPLIACIÓN Nº ${numeroAmpliacion} DE LA DENUNCIA Nº ${numeroOrden}/${año}`

  // Convertir fechas a string si vienen como Date
  const fechaDenunciaParaFormat = toDateString(datosDenuncia.fecha_denuncia)
  const fechaNacimientoParaFormat = toDateString(denunciante['Fecha de Nacimiento'])
  const fechaHechoParaFormat = toDateString(datosDenuncia.fecha_hecho)
  
  const fechaDenuncia = formatDate(fechaDenunciaParaFormat)
  const fechaNacimiento = formatDate(fechaNacimientoParaFormat)
  const fechaHecho = formatDate(fechaHechoParaFormat)
  
  const tieneRango = datosDenuncia.fecha_hecho_fin && datosDenuncia.hora_hecho_fin
  const fechaHechoFinParaFormat = tieneRango && datosDenuncia.fecha_hecho_fin
    ? toDateString(datosDenuncia.fecha_hecho_fin)
    : null
  const fechaHechoFin = fechaHechoFinParaFormat ? formatDate(fechaHechoFinParaFormat) : null
  const involucrados = (datosDenuncia.involucrados || []).filter(
    (involucrado) => involucrado.rol !== 'principal'
  )
  const coDenunciantes = involucrados.filter((involucrado) => involucrado.rol === 'co-denunciante')
  const abogados = involucrados.filter((involucrado) => involucrado.rol === 'abogado')
  const abogadoConCartaPoder = abogados.find((abogado) => Boolean(abogado.conCartaPoder) === true)

  // Agregar encabezado en la primera página
  agregarEncabezado(doc, titulo, formatoPapel[0])

  // Aviso legal
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  const aviso =
    'LA PRESENTE ACTA SE REALIZA CONFORME A LOS SIGUIENTES: ARTÍCULO 284. "DENUNCIA", ARTÍCULO 285. "FORMA Y CONTENIDO", ARTÍCULO 289. "DENUNCIA ANTE LA POLICÍA" DE LA LEY 1286/98 "CODIGO PROCESAL PENAL".'
  doc.text(aviso, 30, 78, { align: 'justify', maxWidth: 156 })

  // Primer párrafo (igual que en denuncia original)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  
  let parrafoIntroduccion = ''
  
  // Caso especial: Abogado con carta poder (el abogado es quien concurre)
  if (abogadoConCartaPoder) {
    const { nombre, documento, matricula, telefono, correo } = obtenerDatosAbogado(abogadoConCartaPoder)
    const cartaPoderTexto = describirCartaPoder(abogadoConCartaPoder) || 'con carta poder'
    
    const partesAbogado: string[] = [`${nombre}`]
    if (documento) partesAbogado.push(`con ${documento}`)
    partesAbogado.push(`Matrícula Profesional Nº ${matricula}`)
    if (telefono) partesAbogado.push(`teléfono ${telefono}`)
    if (correo) partesAbogado.push(`correo electrónico ${correo}`)
    
    parrafoIntroduccion = `En la Sala de Denuncias de la Dirección Contra Hechos Punibles Económicos y Financieros, Oficina ${datosDenuncia.oficina.toUpperCase()}, en fecha ${formatDate(fechaAmpliacion)} siendo las ${horaAmpliacion}, ante mí ${operadorAmpliacion.grado.toUpperCase()} ${operadorAmpliacion.nombre.toUpperCase()} ${operadorAmpliacion.apellido.toUpperCase()}, concurre ${partesAbogado.join(', ')}, ${cartaPoderTexto}, en representación de ${denunciante['Nombres y Apellidos'].toUpperCase()}, con ${denunciante['Tipo de Documento'] || 'Cédula de Identidad Paraguaya'} número ${(denunciante['Número de Documento'] || denunciante['Cédula de Identidad']).toUpperCase()}, de nacionalidad ${denunciante['Nacionalidad'].toUpperCase()}, estado civil ${denunciante['Estado Civil'].toUpperCase()}, ${denunciante['Edad']} años de edad, fecha de nacimiento ${fechaNacimiento}, en ${denunciante['Lugar de Nacimiento'].toUpperCase()}${denunciante['Domicilio'] ? `, domiciliado en ${denunciante['Domicilio']}` : ''}`
    
    if (coDenunciantes.length > 0) {
      const listadoCo = coDenunciantes.map(describirCoDenuncianteIntro).join('; ')
      parrafoIntroduccion += ` y de ${coDenunciantes.length > 1 ? 'los co-denunciantes' : 'el co-denunciante'} ${listadoCo}`
    }
    
    parrafoIntroduccion += ', y expone cuanto sigue:'
  } else {
    // Caso normal: Denunciante presente (con o sin abogado acompañante)
    const telefonoPrincipal =
      denunciante['Número de Teléfono'] && denunciante['Número de Teléfono'].trim() !== ''
        ? denunciante['Número de Teléfono'].toUpperCase()
        : null
    const correoPrincipal =
      denunciante['Correo Electrónico'] && denunciante['Correo Electrónico'].trim() !== ''
        ? denunciante['Correo Electrónico']
        : null

    const partesDenunciante: string[] = [
      `${denunciante['Nombres y Apellidos'].toUpperCase()}, con ${denunciante['Tipo de Documento'] || 'Cédula de Identidad Paraguaya'} número ${(denunciante['Número de Documento'] || denunciante['Cédula de Identidad']).toUpperCase()}, de nacionalidad ${denunciante['Nacionalidad'].toUpperCase()}, estado civil ${denunciante['Estado Civil'].toUpperCase()}, ${denunciante['Edad']} años de edad, fecha de nacimiento ${fechaNacimiento}, en ${denunciante['Lugar de Nacimiento'].toUpperCase()}${denunciante['Domicilio'] ? `, domiciliado en ${denunciante['Domicilio']}` : ''}`
    ]
    if (telefonoPrincipal) {
      partesDenunciante.push(`teléfono ${telefonoPrincipal}`)
    }
    if (correoPrincipal) {
      partesDenunciante.push(`correo electrónico ${correoPrincipal}`)
    }
    
    parrafoIntroduccion = `En la Sala de Denuncias de la Dirección Contra Hechos Punibles Económicos y Financieros, Oficina ${datosDenuncia.oficina.toUpperCase()}, en fecha ${formatDate(fechaAmpliacion)} siendo las ${horaAmpliacion}, ante mí ${operadorAmpliacion.grado.toUpperCase()} ${operadorAmpliacion.nombre.toUpperCase()} ${operadorAmpliacion.apellido.toUpperCase()}, concurre ${partesDenunciante.join(', ')}`

    if (coDenunciantes.length > 0) {
      const listadoCo = coDenunciantes.map(describirCoDenuncianteIntro).join('; ')
      const acompanado =
        coDenunciantes.length > 1 ? 'acompañados por' : 'acompañado por'
      parrafoIntroduccion += `, ${acompanado} ${listadoCo}`
    }

    if (abogados.length > 0) {
      const listadoAbogados = abogados.map(describirAbogadoIntro).join('; ')
      const sujetoAsistido = coDenunciantes.length > 0 ? 'asistidos' : 'asistido'
      const posesivo = abogados.length > 1 ? 'sus representantes legales' : 'su representante legal'
      const relativo = abogados.length > 1 ? 'quienes' : 'quien'
      const pronombre = coDenunciantes.length > 0 ? 'los' : 'lo'
      parrafoIntroduccion += `, ${sujetoAsistido} por ${posesivo} ${listadoAbogados}, ${relativo} ${pronombre} patrocina en el presente acto`
    }

    parrafoIntroduccion += coDenunciantes.length > 0 ? ', y exponen cuanto sigue:' : ', y expone cuanto sigue:'
  }

  const alturaLinea = 5
  let yActualIntroduccion = 90
  const parrafosIntro = [parrafoIntroduccion]
  parrafosIntro.forEach((parrafo, index) => {
    if (index > 0) {
      yActualIntroduccion += alturaLinea
    }
    // Sanitizar caracteres especiales antes de procesar
    const parrafoSanitizado = sanitizarTextoParaPDF(parrafo)
    const lineas = doc.splitTextToSize(parrafoSanitizado, 156)
    doc.text(lineas, 30, yActualIntroduccion, { align: 'justify', maxWidth: 156 })
    yActualIntroduccion += lineas.length * alturaLinea
  })

  // Segundo párrafo - MODIFICADO para ampliación
  const hayCoDenunciantes = coDenunciantes.length > 0
  const tipoDenunciaUpper = datosDenuncia.tipo_denuncia.toUpperCase()
  const esExtravio = tipoDenunciaUpper === 'EXTRAVÍO DE OBJETOS Y/O DOCUMENTOS'
  const textoSupuesto = esExtravio ? 'el ' : 'el supuesto '
  let parrafo2 = `Que por la presente ${hayCoDenunciantes ? 'vienen' : 'viene'} a realizar una ampliación de denuncia sobre ${textoSupuesto}${tipoDenunciaUpper}`
  if (
    tipoDenunciaUpper === 'OTRO' &&
    datosDenuncia.otro_tipo
  ) {
    parrafo2 = parrafo2.replace(
      'OTRO',
      `OTRO (${datosDenuncia.otro_tipo.toUpperCase()})`
    )
  }
  // Formatear fecha/hora del hecho (única o rango) - MODIFICADO para decir "denunciado"
  if (tieneRango && fechaHechoFin) {
    if (datosDenuncia.lugar_hecho && datosDenuncia.lugar_hecho.trim() !== '') {
      parrafo2 += `, denunciado entre las ${datosDenuncia.hora_hecho} horas del ${fechaHecho} y las ${datosDenuncia.hora_hecho_fin} horas del ${fechaHechoFin}, en la dirección ${datosDenuncia.lugar_hecho.toUpperCase()}`
    } else {
      parrafo2 += `, denunciado entre las ${datosDenuncia.hora_hecho} horas del ${fechaHecho} y las ${datosDenuncia.hora_hecho_fin} horas del ${fechaHechoFin}`
    }
  } else {
    if (datosDenuncia.lugar_hecho && datosDenuncia.lugar_hecho.trim() !== '') {
      parrafo2 += `, denunciado en fecha ${fechaHecho} siendo las ${datosDenuncia.hora_hecho} aproximadamente, en la dirección ${datosDenuncia.lugar_hecho.toUpperCase()}`
    } else {
      parrafo2 += `, denunciado en fecha ${fechaHecho} siendo las ${datosDenuncia.hora_hecho} aproximadamente`
    }
  }

  // En ampliaciones, solo hacer referencia al supuesto autor sin repetir toda la información
  if (datosDenuncia.nombre_autor) {
    // Caso 3: Autor conocido - mencionar que su identidad ya fue mencionada
    parrafo2 += `, siendo el supuesto autor ${datosDenuncia.nombre_autor.toUpperCase()}, cuya identidad ya ha sido mencionada anteriormente.`
  } else if (datosDenuncia.descripcion_fisica && datosDenuncia.descripcion_fisica.trim() !== '') {
    // Caso 2: Desconocido con descripción física - mencionar que ya fue descrita
    parrafo2 += ', siendo el supuesto autor una persona DESCONOCIDA por la persona denunciante, cuya descripción física ya ha sido mencionada anteriormente.'
  }
  // Si no hay nombre_autor ni descripcion_fisica, no agregamos nada sobre el autor (caso "No aplica")

  const yParrafo2 = yActualIntroduccion
  // Sanitizar caracteres especiales antes de procesar
  const parrafo2Sanitizado = sanitizarTextoParaPDF(parrafo2)
  const splitParrafo2 = doc.splitTextToSize(parrafo2Sanitizado, 156)
  doc.text(splitParrafo2, 30, yParrafo2, { align: 'justify', maxWidth: 156 })

  // Relato de la ampliación
  const yRelato = yParrafo2 + splitParrafo2.length * alturaLinea
  doc.setFont('helvetica', 'normal')
  doc.text('De acuerdo a los hechos que se describen a continuación:', 30, yRelato)
  
  // Determinar quién firma: si hay abogado con carta poder, firma el abogado
  const hayAbogadoConCartaPoder = Boolean(abogadoConCartaPoder)
  let textoFirmas: string
  if (hayAbogadoConCartaPoder) {
    // Cuando hay abogado con carta poder, solo firma el abogado (y el interviniente)
    textoFirmas = 'FIRMANDO AL PIE EL REPRESENTANTE LEGAL Y EL INTERVINIENTE'
  } else {
    textoFirmas = coDenunciantes.length > 0
      ? 'FIRMANDO AL PIE LOS DENUNCIANTES Y EL INTERVINIENTE'
      : 'FIRMANDO AL PIE EL DENUNCIANTE Y EL INTERVINIENTE'
  }
  const textoPersonas = coDenunciantes.length > 0
    ? 'LAS PERSONAS RECURRENTES SON INFORMADAS'
    : 'LA PERSONA RECURRENTE ES INFORMADA'
  const relato = `${relatoAmpliacion}\nNO HABIENDO NADA MÁS QUE AGREGAR SE DA POR TERMINADA EL ACTA, PREVIA LECTURA Y RATIFICACIÓN DE SU CONTENIDO, ${textoFirmas}, EN 3 (TRES) COPIAS DEL MISMO TENOR Y EFECTO. ${textoPersonas} SOBRE: ARTÍCULO 289.- "DENUNCIA FALSA"; ARTÍCULO 242.- "TESTIMONIO FALSO"; ARTÍCULO 243.- "DECLARACIÓN FALSA".`
  doc.setFont('helvetica', 'italic')
  // Sanitizar caracteres especiales antes de procesar
  const relatoSanitizado = sanitizarTextoParaPDF(relato)
  const splitRelato = doc.splitTextToSize(relatoSanitizado, 156)
  
  // Escribir el texto del relato con manejo de páginas
  let yActual = yRelato + 5
  let textoRestante = splitRelato
  const alturaLineaRelato = 6
  // Altura máxima para páginas intermedias (usar casi todo el espacio, solo 5mm de margen)
  const alturaMaximaIntermedia = formatoPapel[1] - 5
  // Altura máxima para la última página (dejar espacio suficiente para firmas)
  const espacioReservadoFirmas = 28 // Mismo valor para A4 y Oficio
  const alturaMaximaUltima = formatoPapel[1] - espacioReservadoFirmas

  while (textoRestante.length > 0) {
    // Calcular cuántas líneas caben en la última página desde el inicio de página nueva
    const espacioParaUltimaDesdeInicio = alturaMaximaUltima - 80
    const lineasQueCabenUltimaDesdeInicio = Math.floor(espacioParaUltimaDesdeInicio / alturaLineaRelato)
    
    // Determinar si esta será la última página
    const seraUltimaPagina = textoRestante.length <= lineasQueCabenUltimaDesdeInicio
    
    // Usar la altura correspondiente
    const alturaMaxima = seraUltimaPagina ? alturaMaximaUltima : alturaMaximaIntermedia
    const espacioRestante = alturaMaxima - yActual

    // Calcular cuántas líneas caben
    const lineasDisponibles = Math.floor(espacioRestante / alturaLineaRelato)

    if (lineasDisponibles <= 0) {
      // No cabe ni una línea, crear nueva página y continuar bucle
      doc.addPage()
      agregarEncabezado(doc, titulo, formatoPapel[0])
      doc.setFontSize(12)
      doc.setFont('helvetica', 'italic')
      yActual = 80
      continue // Reiniciar el bucle con la nueva página
    } else {
      // Escribir las líneas que caben
      const lineasAEscribir = Math.min(lineasDisponibles, textoRestante.length)
      const lineasPagina = textoRestante.slice(0, lineasAEscribir)
      textoRestante = textoRestante.slice(lineasAEscribir)

      doc.text(lineasPagina, 30, yActual, { align: 'left', maxWidth: 156 })
      
      // Calcular nueva posición Y
      yActual += lineasPagina.length * alturaLineaRelato

      // Si quedan líneas, crear nueva página y continuar bucle
      if (textoRestante.length > 0) {
        doc.addPage()
        agregarEncabezado(doc, titulo, formatoPapel[0])
        doc.setFontSize(12)
        doc.setFont('helvetica', 'italic')
        yActual = 80
      }
    }
  }

  // Verificar si hay espacio suficiente para las firmas en la página actual
  const alturaPagina = formatoPapel[1]
  const espacioParaFirmas = yActual + 1 // Espacio mínimo (1mm) antes de la línea de firma
  const alturaFirmas = 17 // Desde la línea hasta la etiqueta (yFirmas + 17)
  const margenInferior = 5 // Margen inferior mínimo
  const alturaNecesariaTotal = alturaFirmas + margenInferior // ~22mm total
  const yFirmasNecesaria = espacioParaFirmas + alturaFirmas
  const espacioDisponible = alturaPagina - yActual
  
  // Si no hay suficiente espacio para las firmas completas (incluyendo margen), crear una nueva página
  if (yFirmasNecesaria + margenInferior > alturaPagina) {
    doc.addPage()
    agregarEncabezado(doc, titulo, formatoPapel[0])
    yActual = 80
  }

  // Agregar firmas en la última página
  const yFirmasMaxima = alturaPagina - alturaFirmas - margenInferior
  const yFirmas = Math.min(yActual + 1, yFirmasMaxima)
  
  doc.setFont('helvetica', 'normal')

  // Firma izquierda - Interviniente
  doc.setLineWidth(0.5)
  doc.line(30, yFirmas, 66, yFirmas)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  doc.text(operadorAmpliacion.nombre.toUpperCase(), 48, yFirmas + 7, {
    align: 'center',
  })
  doc.text(operadorAmpliacion.grado.toUpperCase(), 48, yFirmas + 12, {
    align: 'center',
  })
  doc.setFont('helvetica', 'bold')
  doc.text('INTERVINIENTE', 48, yFirmas + 17, { align: 'center' })

  // Centro - QR y Hash (usar el hash de la denuncia original)
  try {
    // Generar código QR con la URL de verificación
    const urlVerificacion = `${URL_BASE_VERIFICACION}/verificar/${datosDenuncia.hash}`
    const qrDataUrl = await QRCode.toDataURL(urlVerificacion, {
      width: 80,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    
    // Agregar QR centrado encima del hash (22x22mm)
    const qrSize = 22
    const qrX = 108 - (qrSize / 2) // Centrado en x=108
    const qrY = yFirmas - 7 // Encima de la línea de firma
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
  } catch (qrError) {
    console.error('Error generando QR:', qrError)
  }
  
  // Hash debajo del QR (con espacio suficiente para no solaparse)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(datosDenuncia.hash, 108, yFirmas + 18, { align: 'center' })

  // Firma derecha - Denunciante o Abogado (si hay carta poder)
  let nombreFirma: string
  let docFirma: string
  let etiquetaFirma: string
  
  if (hayAbogadoConCartaPoder && abogadoConCartaPoder) {
    // Cuando hay abogado con carta poder, firma el abogado
    const { nombre, matricula } = obtenerDatosAbogado(abogadoConCartaPoder)
    nombreFirma = nombre
    docFirma = `MATRÍCULA PROF. Nº ${matricula}`
    etiquetaFirma = 'REPRESENTANTE LEGAL'
  } else {
    // Caso normal: firma el denunciante
    nombreFirma = denunciante['Nombres y Apellidos'].toUpperCase()
    docFirma = `NUMERO DE DOC.: ${denunciante['Número de Documento'] || denunciante['Cédula de Identidad']}`
    etiquetaFirma = 'DENUNCIANTE'
  }
  
  doc.line(150, yFirmas, 186, yFirmas)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(nombreFirma, 168, yFirmas + 7, {
    align: 'center',
  })
  doc.text(docFirma, 168, yFirmas + 12, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.text(etiquetaFirma, 168, yFirmas + 17, { align: 'center' })

  return Buffer.from(doc.output('arraybuffer'))
}

// Función para generar solo el texto del PDF (sin crear el documento)
// Útil para mostrar una vista previa antes de finalizar la denuncia
export function generarTextoPDF(
  numeroOrden: number,
  denunciante: Denunciante,
  datosDenuncia: DatosDenuncia
): string {
  // Extraer el año de forma robusta desde fecha_denuncia
  // fecha_denuncia siempre es un string según la interfaz DatosDenuncia
  let año: string
  const fechaDenunciaStr = datosDenuncia.fecha_denuncia
  
  if (fechaDenunciaStr.includes('-')) {
    año = fechaDenunciaStr.split('-')[0]
  } else if (fechaDenunciaStr.includes('/')) {
    const parts = fechaDenunciaStr.split('/')
    año = parts.length === 3 && parts[2].length === 4 ? parts[2] : parts[0]
  } else {
    // Fallback: intentar parsear como fecha o usar año actual
    const fechaParsed = new Date(fechaDenunciaStr)
    año = !isNaN(fechaParsed.getTime()) ? fechaParsed.getFullYear().toString() : new Date().getFullYear().toString()
  }
  const titulo = `ACTA DE DENUNCIA Nº ${numeroOrden}/${año}`

  const fechaDenuncia = formatDate(datosDenuncia.fecha_denuncia)
  const fechaNacimiento = formatDate(denunciante['Fecha de Nacimiento'])
  const fechaHecho = formatDate(datosDenuncia.fecha_hecho)
  const tieneRango = datosDenuncia.fecha_hecho_fin && datosDenuncia.hora_hecho_fin
  const fechaHechoFin = tieneRango && datosDenuncia.fecha_hecho_fin ? formatDate(datosDenuncia.fecha_hecho_fin) : null
  const involucrados = (datosDenuncia.involucrados || []).filter(
    (involucrado) => involucrado.rol !== 'principal'
  )
  const coDenunciantes = involucrados.filter((involucrado) => involucrado.rol === 'co-denunciante')
  const abogados = involucrados.filter((involucrado) => involucrado.rol === 'abogado')
  const abogadoConCartaPoder = abogados.find((abogado) => Boolean(abogado.conCartaPoder) === true)

  // Función helper para escapar HTML
  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  // Función helper para poner en negrita
  const bold = (text: string): string => `<strong>${text}</strong>`

  let texto = `\n${bold(titulo)}\n\n`
  
  // Aviso legal
  texto += `LA PRESENTE ACTA SE REALIZA CONFORME A LOS SIGUIENTES: ARTÍCULO 284. "DENUNCIA", ARTÍCULO 285. "FORMA Y CONTENIDO", ARTÍCULO 289. "DENUNCIA ANTE LA POLICÍA" DE LA LEY 1286/98 "CODIGO PROCESAL PENAL".\n\n`

  // Primer párrafo
  let parrafoIntroduccion = ''
  
  // Caso especial: Abogado con carta poder (el abogado es quien concurre)
  if (abogadoConCartaPoder) {
    const { nombre, documento, matricula, telefono, correo } = obtenerDatosAbogado(abogadoConCartaPoder)
    const cartaPoderTexto = describirCartaPoder(abogadoConCartaPoder) || 'con carta poder'
    
    const partesAbogado: string[] = [bold(nombre)]
    if (documento) partesAbogado.push(`con ${bold(documento)}`)
    partesAbogado.push(`Matrícula Profesional Nº ${bold(matricula)}`)
    if (telefono) partesAbogado.push(`teléfono ${bold(telefono)}`)
    if (correo) partesAbogado.push(`correo electrónico ${bold(correo)}`)
    
    parrafoIntroduccion = `En la Sala de Denuncias de la Dirección Contra Hechos Punibles Económicos y Financieros, Oficina ${bold(datosDenuncia.oficina.toUpperCase())}, en fecha ${bold(fechaDenuncia)} siendo las ${bold(datosDenuncia.hora_denuncia)}, ante mí ${bold(datosDenuncia.grado_operador.toUpperCase())} ${bold(datosDenuncia.nombre_operador.toUpperCase())}, concurre ${partesAbogado.join(', ')}, ${cartaPoderTexto}, en representación de ${bold(denunciante['Nombres y Apellidos'].toUpperCase())}, con ${bold(denunciante['Tipo de Documento'] || 'Cédula de Identidad Paraguaya')} número ${bold((denunciante['Número de Documento'] || denunciante['Cédula de Identidad']).toUpperCase())}, de nacionalidad ${bold(denunciante['Nacionalidad'].toUpperCase())}, estado civil ${bold(denunciante['Estado Civil'].toUpperCase())}, ${bold(denunciante['Edad'])} años de edad, fecha de nacimiento ${bold(fechaNacimiento)}, en ${bold(denunciante['Lugar de Nacimiento'].toUpperCase())}${denunciante['Domicilio'] ? `, domiciliado en ${bold(denunciante['Domicilio'])}` : ''}`
    
    if (coDenunciantes.length > 0) {
      const listadoCo = coDenunciantes.map(item => {
        const desc = describirCoDenuncianteIntro(item)
        // Aplicar negrita a los detalles importantes del co-denunciante
        return desc.replace(/(\d+ años|[\d\/]+|teléfono [\d\s]+|correo electrónico [^\s,;]+)/gi, (match) => bold(match))
      }).join('; ')
      parrafoIntroduccion += ` y de ${coDenunciantes.length > 1 ? 'los co-denunciantes' : 'el co-denunciante'} ${listadoCo}`
    }
    
    parrafoIntroduccion += ', y expone cuanto sigue:'
  } else {
    // Caso normal: Denunciante presente (con o sin abogado acompañante)
    const telefonoPrincipal =
      denunciante['Número de Teléfono'] && denunciante['Número de Teléfono'].trim() !== ''
        ? denunciante['Número de Teléfono'].toUpperCase()
        : null
    const correoPrincipal =
      denunciante['Correo Electrónico'] && denunciante['Correo Electrónico'].trim() !== ''
        ? denunciante['Correo Electrónico']
        : null

    const partesDenunciante: string[] = [
      `${bold(denunciante['Nombres y Apellidos'].toUpperCase())}, con ${bold(denunciante['Tipo de Documento'] || 'Cédula de Identidad Paraguaya')} número ${bold((denunciante['Número de Documento'] || denunciante['Cédula de Identidad']).toUpperCase())}, de nacionalidad ${bold(denunciante['Nacionalidad'].toUpperCase())}, estado civil ${bold(denunciante['Estado Civil'].toUpperCase())}, ${bold(denunciante['Edad'])} años de edad, fecha de nacimiento ${bold(fechaNacimiento)}, en ${bold(denunciante['Lugar de Nacimiento'].toUpperCase())}${denunciante['Domicilio'] ? `, domiciliado en ${bold(denunciante['Domicilio'])}` : ''}`
    ]
    if (telefonoPrincipal) {
      partesDenunciante.push(`teléfono ${bold(telefonoPrincipal)}`)
    }
    if (correoPrincipal) {
      partesDenunciante.push(`correo electrónico ${bold(correoPrincipal)}`)
    }
    
    parrafoIntroduccion = `En la Sala de Denuncias de la Dirección Contra Hechos Punibles Económicos y Financieros, Oficina ${bold(datosDenuncia.oficina.toUpperCase())}, en fecha ${bold(fechaDenuncia)} siendo las ${bold(datosDenuncia.hora_denuncia)}, ante mí ${bold(datosDenuncia.grado_operador.toUpperCase())} ${bold(datosDenuncia.nombre_operador.toUpperCase())}, concurre ${partesDenunciante.join(', ')}`

    if (coDenunciantes.length > 0) {
      const listadoCo = coDenunciantes.map(item => {
        const desc = describirCoDenuncianteIntro(item)
        // Aplicar negrita a los detalles importantes del co-denunciante
        return desc.replace(/(\d+ años|[\d\/]+|teléfono [\d\s]+|correo electrónico [^\s,;]+)/gi, (match) => bold(match))
      }).join('; ')
      const acompanado =
        coDenunciantes.length > 1 ? 'acompañados por' : 'acompañado por'
      parrafoIntroduccion += `, ${acompanado} ${listadoCo}`
    }

    if (abogados.length > 0) {
      const listadoAbogados = abogados.map(item => {
        const desc = describirAbogadoIntro(item)
        // Aplicar negrita a los detalles importantes del abogado
        return desc.replace(/(Matrícula Profesional Nº [\d\w]+|teléfono [\d\s]+|correo electrónico [^\s,;]+)/gi, (match) => bold(match))
      }).join('; ')
      const sujetoAsistido = coDenunciantes.length > 0 ? 'asistidos' : 'asistido'
      const posesivo = abogados.length > 1 ? 'sus representantes legales' : 'su representante legal'
      const relativo = abogados.length > 1 ? 'quienes' : 'quien'
      const pronombre = coDenunciantes.length > 0 ? 'los' : 'lo'
      parrafoIntroduccion += `, ${sujetoAsistido} por ${posesivo} ${listadoAbogados}, ${relativo} ${pronombre} patrocina en el presente acto`
    }

    parrafoIntroduccion += coDenunciantes.length > 0 ? ', y exponen cuanto sigue:' : ', y expone cuanto sigue:'
  }

  texto += `${parrafoIntroduccion}\n\n`

  // Segundo párrafo
  const hayCoDenunciantes = coDenunciantes.length > 0
  const tipoDenunciaUpper = datosDenuncia.tipo_denuncia.toUpperCase()
  const esExtravio = tipoDenunciaUpper === 'EXTRAVÍO DE OBJETOS Y/O DOCUMENTOS'
  const textoSupuesto = esExtravio ? '' : 'un supuesto '
  let parrafo2 = `Que por la presente ${hayCoDenunciantes ? 'vienen' : 'viene'} a realizar una denuncia sobre ${textoSupuesto}${bold(tipoDenunciaUpper)}`
  if (
    tipoDenunciaUpper === 'OTRO' &&
    datosDenuncia.otro_tipo
  ) {
    parrafo2 = parrafo2.replace(
      bold('OTRO'),
      `${bold('OTRO')} (${bold(datosDenuncia.otro_tipo.toUpperCase())})`
    )
  }
  // Formatear fecha/hora del hecho (única o rango)
  if (tieneRango && fechaHechoFin) {
    if (datosDenuncia.lugar_hecho && datosDenuncia.lugar_hecho.trim() !== '') {
      parrafo2 += `, ocurrido entre las ${bold(datosDenuncia.hora_hecho)} horas del ${bold(fechaHecho)} y las ${bold(datosDenuncia.hora_hecho_fin || '')} horas del ${bold(fechaHechoFin)}, en la dirección ${bold(datosDenuncia.lugar_hecho.toUpperCase())}`
    } else {
      parrafo2 += `, ocurrido entre las ${bold(datosDenuncia.hora_hecho)} horas del ${bold(fechaHecho)} y las ${bold(datosDenuncia.hora_hecho_fin || '')} horas del ${bold(fechaHechoFin)}`
    }
  } else {
    if (datosDenuncia.lugar_hecho && datosDenuncia.lugar_hecho.trim() !== '') {
      parrafo2 += `, ocurrido en fecha ${bold(fechaHecho)} siendo las ${bold(datosDenuncia.hora_hecho)} aproximadamente, en la dirección ${bold(datosDenuncia.lugar_hecho.toUpperCase())}`
    } else {
      parrafo2 += `, ocurrido en fecha ${bold(fechaHecho)} siendo las ${bold(datosDenuncia.hora_hecho)} aproximadamente`
    }
  }

  if (datosDenuncia.nombre_autor) {
    const detallesAutor = []
    if (datosDenuncia.cedula_autor)
      detallesAutor.push(
        `con número de documento ${bold(datosDenuncia.cedula_autor.toUpperCase())}`
      )
    if (datosDenuncia.domicilio_autor)
      detallesAutor.push(
        `con domicilio en ${bold(datosDenuncia.domicilio_autor.toUpperCase())}`
      )
    if (datosDenuncia.nacionalidad_autor)
      detallesAutor.push(
        `de nacionalidad ${bold(datosDenuncia.nacionalidad_autor.toUpperCase())}`
      )
    if (datosDenuncia.estado_civil_autor)
      detallesAutor.push(
        `estado civil ${bold(datosDenuncia.estado_civil_autor.toUpperCase())}`
      )
    if (datosDenuncia.edad_autor)
      detallesAutor.push(`edad ${bold(datosDenuncia.edad_autor)} años`)
    if (datosDenuncia.fecha_nacimiento_autor)
      detallesAutor.push(
        `nacido en fecha ${bold(formatDate(datosDenuncia.fecha_nacimiento_autor))}`
      )
    if (datosDenuncia.lugar_nacimiento_autor)
      detallesAutor.push(
        `en ${bold(datosDenuncia.lugar_nacimiento_autor.toUpperCase())}`
      )
    if (datosDenuncia.telefono_autor)
      detallesAutor.push(
        `número de teléfono ${bold(datosDenuncia.telefono_autor.toUpperCase())}`
      )
    if (datosDenuncia.profesion_autor)
      detallesAutor.push(
        `de profesión ${bold(datosDenuncia.profesion_autor.toUpperCase())}`
      )

    parrafo2 += `, sindicando como supuesto autor a ${bold(datosDenuncia.nombre_autor.toUpperCase())}`
    if (detallesAutor.length > 0) {
      parrafo2 += ', ' + detallesAutor.join(', ') + '.'
    } else {
      parrafo2 += '.'
    }
  } else if (datosDenuncia.descripcion_fisica && datosDenuncia.descripcion_fisica.trim() !== '') {
    // Autor desconocido con descripción física
    parrafo2 += ', siendo el supuesto autor una persona DESCONOCIDA por la persona denunciante'
    try {
      // Intentar parsear como JSON
      const descFisicaObj = JSON.parse(datosDenuncia.descripcion_fisica)
      const textoDesc = generarTextoDescripcionFisica(descFisicaObj)
      if (textoDesc.trim() !== '') {
        // Aplicar negrita a valores en mayúsculas (opciones seleccionadas)
        const textoConNegrita = textoDesc.replace(/([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ0-9\s\/\-\(\)]+)/g, (match) => bold(match))
        parrafo2 += `, a quien describe físicamente de la siguiente manera: ${textoConNegrita}`
      } else {
        parrafo2 += '.'
      }
    } catch {
      // Si no es JSON, usar como texto plano (legacy)
      parrafo2 += `, a quien describe físicamente de la siguiente manera: ${bold(datosDenuncia.descripcion_fisica.toUpperCase())}.`
    }
  }
  // Si no hay nombre_autor ni descripcion_fisica, no agregamos nada sobre el autor (caso "No aplica")

  texto += `${parrafo2}\n\n`

  // Relato
  texto += `De acuerdo a los hechos que se describen a continuación:\n\n`
  
  // Determinar quién firma: si hay abogado con carta poder, firma el abogado
  const hayAbogadoConCartaPoder = Boolean(abogadoConCartaPoder)
  let textoFirmas: string
  if (hayAbogadoConCartaPoder) {
    // Cuando hay abogado con carta poder, solo firma el abogado (y el interviniente)
    textoFirmas = 'FIRMANDO AL PIE EL REPRESENTANTE LEGAL Y EL INTERVINIENTE'
  } else {
    textoFirmas = coDenunciantes.length > 0
      ? 'FIRMANDO AL PIE LOS DENUNCIANTES Y EL INTERVINIENTE'
      : 'FIRMANDO AL PIE EL DENUNCIANTE Y EL INTERVINIENTE'
  }
  const textoPersonas = coDenunciantes.length > 0
    ? 'LAS PERSONAS RECURRENTES SON INFORMADAS'
    : 'LA PERSONA RECURRENTE ES INFORMADA'
  const relato = `${datosDenuncia.relato}\n\nNO HABIENDO NADA MÁS QUE AGREGAR SE DA POR TERMINADA EL ACTA, PREVIA LECTURA Y RATIFICACIÓN DE SU CONTENIDO, ${bold(textoFirmas)}, EN 3 (TRES) COPIAS DEL MISMO TENOR Y EFECTO. ${bold(textoPersonas)} SOBRE: ARTÍCULO 289.- "DENUNCIA FALSA"; ARTÍCULO 242.- "TESTIMONIO FALSO"; ARTÍCULO 243.- "DECLARACIÓN FALSA".`

  texto += relato

  return texto
}

export async function generarPDFFormato2(
  numeroOrden: number,
  denunciante: Denunciante,
  datosDenuncia: DatosDenuncia
): Promise<Buffer> {
  // Determinar el tamaño de papel (A4: 210x297mm, Oficio: 216x330mm)
  const formatoPapel = datosDenuncia.tipo_papel === 'a4' ? [210, 297] : [216, 330]
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: formatoPapel as [number, number],
  })

  const año = datosDenuncia.fecha_denuncia.split('-')[0]
  const titulo = `ACTA DE DENUNCIA Nº ${numeroOrden}/${año}`

  const fechaDenuncia = formatDate(datosDenuncia.fecha_denuncia)
  const fechaNacimiento = formatDate(denunciante['Fecha de Nacimiento'])
  const fechaHecho = formatDate(datosDenuncia.fecha_hecho)
  const tieneRango = datosDenuncia.fecha_hecho_fin && datosDenuncia.hora_hecho_fin
  const fechaHechoFin = tieneRango && datosDenuncia.fecha_hecho_fin ? formatDate(datosDenuncia.fecha_hecho_fin) : null

  // Agregar encabezado en la primera página
  agregarEncabezado(doc, titulo, formatoPapel[0])

  // Aviso legal
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  const aviso =
    'LA PRESENTE ACTA SE REALIZA CONFORME A LOS SIGUIENTES: ARTÍCULO 284. "DENUNCIA", ARTÍCULO 285. "FORMA Y CONTENIDO", ARTÍCULO 289. "DENUNCIA ANTE LA POLICÍA" DE LA LEY 1286/98 "CODIGO PROCESAL PENAL".'
  doc.text(aviso, 30, 78, { align: 'justify', maxWidth: 156 })

  // Iniciar contenido después del aviso legal
  let yPos = 88
  
  // Función auxiliar para dibujar una tabla
  const dibujarTabla = (titulo: string, filas: Array<{label: string, valor: string}>, yPosInicial: number): number => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(titulo, 30, yPosInicial)
    
    let yActual = yPosInicial + 8
    
    // Dibujar línea superior debajo del título
    doc.setLineWidth(0.5)
    doc.line(30, yActual, 186, yActual)
    yActual += 5
    
    doc.setFontSize(9)
    
    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i]
      
      // Verificar si necesitamos nueva página
      if (yActual > formatoPapel[1] - 50) {
        doc.addPage()
        agregarEncabezado(doc, titulo, formatoPapel[0])
        yActual = 80
        doc.setFontSize(9)
      }
      
      // Dibujar label y valor en la misma línea
      doc.setFont('helvetica', 'bold')
      const textoCompleto = `${fila.label} ${fila.valor}`
      const anchoTotal = formatoPapel[0] - 60
      const splitTexto = doc.splitTextToSize(textoCompleto, anchoTotal)
      
      // Dibujar primero el label (para que quede en negrita), luego el valor
      let xPos = 30
      
      // Dibujar label en negrita
      doc.setFont('helvetica', 'bold')
      const labelAncho = doc.getTextWidth(fila.label)
      const maxAnchoFila = anchoTotal
      
      // Si el label cabe en una línea, lo dibujamos directamente
      if (labelAncho <= maxAnchoFila) {
        doc.text(fila.label, xPos, yActual)
        xPos += labelAncho + 2
      } else {
        // Si el label es muy largo, lo dividimos
        const labelSplit = doc.splitTextToSize(fila.label, maxAnchoFila)
        doc.text(labelSplit, xPos, yActual, { maxWidth: maxAnchoFila })
        const alturaLabel = labelSplit.length * 5
        yActual += alturaLabel
        xPos = 30
      }
      
      // Dibujar valor en texto normal
      doc.setFont('helvetica', 'normal')
      const anchoDisponible = maxAnchoFila - (xPos - 30)
      const valorSplit = doc.splitTextToSize(fila.valor, anchoDisponible)
      const alturaValor = valorSplit.length * 5
      
      // Si el valor tiene múltiples líneas, ajustar la posición Y
      if (valorSplit.length > 1) {
        doc.text(valorSplit, xPos, yActual, { maxWidth: anchoDisponible })
        yActual += alturaValor
      } else {
        doc.text(valorSplit[0], xPos, yActual)
        yActual += 5
      }
      
      // Dibujar línea separadora horizontal debajo de cada fila
      doc.setLineWidth(0.3)
      doc.line(30, yActual, 186, yActual)
      yActual += 3
    }
    
    yActual += 5
    
    return yActual
  }

  // PRIMERA SECCIÓN: Datos de la denuncia
  const datosDenunciaFilas = [
    { label: 'Fecha:', valor: fechaDenuncia },
    { label: 'Hora:', valor: datosDenuncia.hora_denuncia },
    { label: 'Personal encargado de recibir la denuncia:', valor: `${datosDenuncia.grado_operador.toUpperCase()} ${datosDenuncia.nombre_operador.toUpperCase()}` }
  ]
  yPos = dibujarTabla('DATOS DE LA DENUNCIA', datosDenunciaFilas, yPos)

  // Verificar si necesitamos nueva página
  if (yPos > formatoPapel[1] - 50) {
    doc.addPage()
    agregarEncabezado(doc, titulo, formatoPapel[0])
    yPos = 80
  }

  // SEGUNDA SECCIÓN: Datos del denunciante
  const datosDenuncianteFilas = [
    { label: 'Nombres y Apellidos:', valor: denunciante['Nombres y Apellidos'].toUpperCase() },
    ...(denunciante['Tipo de Documento'] ? [{ label: 'Tipo de Documento:', valor: denunciante['Tipo de Documento'] }] : []),
    { label: denunciante['Tipo de Documento'] ? 'Número de Documento:' : 'Cédula de Identidad N°.:', valor: (denunciante['Número de Documento'] || denunciante['Cédula de Identidad']).toUpperCase() },
    { label: 'Nacionalidad:', valor: denunciante['Nacionalidad'].toUpperCase() },
    { label: 'Estado civil:', valor: denunciante['Estado Civil'].toUpperCase() },
    { label: 'Edad:', valor: `${denunciante['Edad']} años` },
    { label: 'Fecha de Nacimiento:', valor: fechaNacimiento },
    { label: 'Lugar de nacimiento:', valor: denunciante['Lugar de Nacimiento'].toUpperCase() },
    ...(denunciante['Domicilio'] ? [{ label: 'Domicilio:', valor: denunciante['Domicilio']!.toUpperCase() }] : []),
    ...(denunciante['Profesión'] ? [{ label: 'Profesión:', valor: denunciante['Profesión'].toUpperCase() }] : []),
    { label: 'Número de Teléfono:', valor: denunciante['Número de Teléfono'].toUpperCase() },
    ...(denunciante['Correo Electrónico'] ? [{ label: 'Correo electrónico:', valor: denunciante['Correo Electrónico']! }] : []),
  ]
  yPos = dibujarTabla('DATOS DEL DENUNCIANTE', datosDenuncianteFilas, yPos)

  // Verificar si necesitamos nueva página
  if (yPos > formatoPapel[1] - 50) {
    doc.addPage()
    agregarEncabezado(doc, titulo, formatoPapel[0])
    yPos = 80
  }

  const involucradosDatos = (datosDenuncia.involucrados || []).filter(
    (involucrado) => involucrado.rol !== 'principal'
  )
  const coDenunciantes = involucradosDatos.filter((involucrado) => involucrado.rol === 'co-denunciante')
  const abogados = involucradosDatos.filter((involucrado) => involucrado.rol === 'abogado')

  if (coDenunciantes.length > 0) {
    const coFilas = coDenunciantes.map((item, index) => ({
      label:
        coDenunciantes.length > 1
          ? `Co-denunciante ${index + 1}:`
          : 'Co-denunciante:',
      valor: describirCoDenunciante(item),
    }))
    yPos = dibujarTabla('CO-DENUNCIANTES', coFilas, yPos)

    if (yPos > formatoPapel[1] - 50) {
      doc.addPage()
      agregarEncabezado(doc, titulo, formatoPapel[0])
      yPos = 80
    }
  }

  if (abogados.length > 0) {
    const abogadosFilas = abogados.map((item, index) => ({
      label: abogados.length > 1 ? `Abogado/a ${index + 1}:` : 'Abogado/a:',
      valor: describirAbogado(item),
    }))
    yPos = dibujarTabla('REPRESENTANTES LEGALES', abogadosFilas, yPos)

    if (yPos > formatoPapel[1] - 50) {
      doc.addPage()
      agregarEncabezado(doc, titulo, formatoPapel[0])
      yPos = 80
    }
  }

  // TERCERA SECCIÓN: Datos del supuesto autor
  let datosAutorFilas: Array<{label: string, valor: string}> = []
  
  if (datosDenuncia.nombre_autor) {
    datosAutorFilas = [
      { label: 'Nombre:', valor: datosDenuncia.nombre_autor.toUpperCase() },
      ...(datosDenuncia.cedula_autor ? [{ label: 'Cédula de Identidad N°.:', valor: datosDenuncia.cedula_autor.toUpperCase() }] : []),
      ...(datosDenuncia.domicilio_autor ? [{ label: 'Domicilio Particular:', valor: datosDenuncia.domicilio_autor.toUpperCase() }] : []),
      ...(datosDenuncia.nacionalidad_autor ? [{ label: 'Nacionalidad:', valor: datosDenuncia.nacionalidad_autor.toUpperCase() }] : []),
      ...(datosDenuncia.estado_civil_autor ? [{ label: 'Estado civil:', valor: datosDenuncia.estado_civil_autor.toUpperCase() }] : []),
      ...(datosDenuncia.edad_autor ? [{ label: 'Edad:', valor: `${datosDenuncia.edad_autor} años` }] : []),
      ...(datosDenuncia.fecha_nacimiento_autor ? [{ label: 'Fecha de Nacimiento:', valor: formatDate(datosDenuncia.fecha_nacimiento_autor) }] : []),
      ...(datosDenuncia.lugar_nacimiento_autor ? [{ label: 'Lugar de nacimiento:', valor: datosDenuncia.lugar_nacimiento_autor.toUpperCase() }] : []),
      ...(datosDenuncia.telefono_autor ? [{ label: 'Número de Teléfono:', valor: datosDenuncia.telefono_autor.toUpperCase() }] : []),
      ...(datosDenuncia.profesion_autor ? [{ label: 'Profesión:', valor: datosDenuncia.profesion_autor.toUpperCase() }] : [])
    ]
  } else {
    datosAutorFilas = [
      { label: '', valor: 'SUPUESTO AUTOR DESCONOCIDO' }
    ]
  }
  
  yPos = dibujarTabla('DATOS DEL SUPUESTO AUTOR', datosAutorFilas, yPos)

  // Verificar si necesitamos nueva página
  if (yPos > formatoPapel[1] - 50) {
    doc.addPage()
    agregarEncabezado(doc, titulo, formatoPapel[0])
    yPos = 80
  }

  // CUARTA SECCIÓN: Tiempo y lugar donde ocurrió el supuesto hecho
  let tiempoLugarFilas: Array<{label: string, valor: string}> = [
    { 
      label: 'Fecha del hecho:', 
      valor: tieneRango && fechaHechoFin 
        ? `Entre ${fechaHecho} y ${fechaHechoFin}`
        : fechaHecho 
    },
    { 
      label: 'Hora del hecho:', 
      valor: tieneRango && datosDenuncia.hora_hecho_fin
        ? `Entre ${datosDenuncia.hora_hecho} y ${datosDenuncia.hora_hecho_fin}`
        : datosDenuncia.hora_hecho 
    },
    { label: 'Lugar del hecho:', valor: datosDenuncia.lugar_hecho.toUpperCase() }
  ]
  
  if (datosDenuncia.latitud && datosDenuncia.longitud) {
    const lat = typeof datosDenuncia.latitud === 'number' ? datosDenuncia.latitud : parseFloat(String(datosDenuncia.latitud))
    const lng = typeof datosDenuncia.longitud === 'number' ? datosDenuncia.longitud : parseFloat(String(datosDenuncia.longitud))
    tiempoLugarFilas.push({ label: 'Coordenadas GPS:', valor: `${lat.toFixed(6)}, ${lng.toFixed(6)}` })
  }
  
  yPos = dibujarTabla('TIEMPO Y LUGAR DONDE OCURRIÓ EL SUPUESTO HECHO', tiempoLugarFilas, yPos)

  // Verificar si necesitamos nueva página
  if (yPos > formatoPapel[1] - 50) {
    doc.addPage()
    agregarEncabezado(doc, titulo, formatoPapel[0])
    yPos = 80
  }

  // QUINTA SECCIÓN: Relato del hecho
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('RELATO DEL HECHO', 30, yPos)
  yPos += 8
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const splitRelato = doc.splitTextToSize(datosDenuncia.relato, 156)
  
  // Escribir el relato con manejo de páginas
  let textoRelato = splitRelato
  let yActual = yPos
  const alturaLinea = 5
  const alturaMaximaIntermedia = formatoPapel[1] - 5
  const alturaMaximaUltima = formatoPapel[1] - 50

  while (textoRelato.length > 0) {
    const espacioParaUltimaDesdeInicio = alturaMaximaUltima - 80
    const lineasQueCabenUltimaDesdeInicio = Math.floor(espacioParaUltimaDesdeInicio / alturaLinea)
    
    const seraUltimaPagina = textoRelato.length <= lineasQueCabenUltimaDesdeInicio
    
    const alturaMaxima = seraUltimaPagina ? alturaMaximaUltima : alturaMaximaIntermedia
    const espacioRestante = alturaMaxima - yActual

    const lineasDisponibles = Math.floor(espacioRestante / alturaLinea)

    if (lineasDisponibles <= 0) {
      doc.addPage()
      agregarEncabezado(doc, titulo, formatoPapel[0])
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      yActual = 80
      continue
    } else {
      const lineasAEscribir = Math.min(lineasDisponibles, textoRelato.length)
      const lineasPagina = textoRelato.slice(0, lineasAEscribir)
      textoRelato = textoRelato.slice(lineasAEscribir)

      doc.text(lineasPagina, 30, yActual, { align: 'left', maxWidth: 156 })
      
      yActual += lineasPagina.length * alturaLinea

      if (textoRelato.length > 0) {
        doc.addPage()
        agregarEncabezado(doc, titulo, formatoPapel[0])
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        yActual = 80
      }
    }
  }

  // SEXTA SECCIÓN: Cierre de la denuncia y firmas
  const yFirmas = yActual + 15
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('CIERRE DE LA DENUNCIA Y FIRMAS', 30, yFirmas)
  
  // Texto de cierre
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const cierreTexto = 'NO HABIENDO NADA MÁS QUE AGREGAR SE DA POR TERMINADA EL ACTA, PREVIA LECTURA Y RATIFICACIÓN DE SU CONTENIDO, FIRMANDO AL PIE EL DENUNCIANTE Y EL INTERVINIENTE, EN 3 (TRES) COPIAS DEL MISMO TENOR Y EFECTO. LA PERSONA RECURRENTE ES INFORMADA SOBRE: ARTÍCULO 289.- "DENUNCIA FALSA"; ARTÍCULO 242.- "TESTIMONIO FALSO"; ARTÍCULO 243.- "DECLARACIÓN FALSA".'
  const splitCierre = doc.splitTextToSize(cierreTexto, 156)
  doc.text(splitCierre, 30, yFirmas + 10, { align: 'justify', maxWidth: 156 })
  
  const yFirmasFinal = yFirmas + 10 + splitCierre.length * 5 + 15

  // Agregar firmas en la última página
  doc.setFont('helvetica', 'normal')
  doc.setLineWidth(0.5)
  doc.line(30, yFirmasFinal, 66, yFirmasFinal)
  doc.setFontSize(10)
  
  // Determinar qué información mostrar
  let nombreMostrar = datosDenuncia.nombre_operador
  let gradoMostrar = datosDenuncia.grado_operador
  let etiquetaMostrar = 'INTERVINIENTE'
  
  if (datosDenuncia.es_operador_autorizado && datosDenuncia.operador_autorizado) {
    nombreMostrar = `${datosDenuncia.operador_autorizado.nombre}`
    gradoMostrar = datosDenuncia.operador_autorizado.grado
    etiquetaMostrar = 'OPERADOR AUTORIZADO'
  }
  
  doc.text(nombreMostrar.toUpperCase(), 48, yFirmasFinal + 7, {
    align: 'center',
  })
  doc.text(gradoMostrar.toUpperCase(), 48, yFirmasFinal + 12, {
    align: 'center',
  })
  doc.setFont('helvetica', 'bold')
  doc.text(etiquetaMostrar, 48, yFirmasFinal + 17, { align: 'center' })

  // Centro - QR y Hash
  try {
    // Generar código QR con la URL de verificación
    const urlVerificacion = `${URL_BASE_VERIFICACION}/verificar/${datosDenuncia.hash}`
    const qrDataUrl = await QRCode.toDataURL(urlVerificacion, {
      width: 80,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    
    // Agregar QR centrado encima del hash (22x22mm)
    const qrSize = 22
    const qrX = 108 - (qrSize / 2) // Centrado en x=108
    const qrY = yFirmasFinal - 7 // Encima de la línea de firma
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
  } catch (qrError) {
    console.error('Error generando QR:', qrError)
  }
  
  // Hash debajo del QR (con espacio suficiente para no solaparse)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(datosDenuncia.hash, 108, yFirmasFinal + 18, { align: 'center' })

  // Firma derecha - Denunciante
  const docDenunciante = `NUMERO DE DOC.: ${denunciante['Número de Documento'] || denunciante['Cédula de Identidad']}`
  doc.line(150, yFirmasFinal, 186, yFirmasFinal)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(denunciante['Nombres y Apellidos'].toUpperCase(), 168, yFirmasFinal + 7, {
    align: 'center',
  })
  doc.text(docDenunciante, 168, yFirmasFinal + 12, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.text('DENUNCIANTE', 168, yFirmasFinal + 17, { align: 'center' })

  return Buffer.from(doc.output('arraybuffer'))
}

import { jsPDF } from 'jspdf'
import fs from 'fs'
import path from 'path'

const datosOficina = {
  direccion: "E. V. Haedo 725 casi O'Leary",
  telefono: '(021) 443-159',
  fax: '(021) 443-126 (021) 441-111',
  email: 'ayudantia@delitoseconomicos.gov.py',
}

function formatDate(dateStr: string): string {
  try {
    const [año, mes, dia] = dateStr.split('-')
    return `${dia}/${mes}/${año}`
  } catch {
    return dateStr
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
  'Profesión': string | null
}

export interface DatosDenuncia {
  fecha_denuncia: string
  hora_denuncia: string
  fecha_hecho: string
  hora_hecho: string
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
  // Para firma dinámica
  operador_autorizado?: {
    grado: string
    nombre: string
  }
  es_operador_autorizado?: boolean
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

export function generarPDF(
  numeroOrden: number,
  denunciante: Denunciante,
  datosDenuncia: DatosDenuncia
): Buffer {
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
  const parrafo1 = `En la Sala de Denuncias de la Dirección Contra Hechos Punibles Económicos y Financieros, Oficina ${datosDenuncia.oficina.toUpperCase()}, en fecha ${fechaDenuncia} siendo las ${datosDenuncia.hora_denuncia}, ante mí ${datosDenuncia.grado_operador.toUpperCase()} ${datosDenuncia.nombre_operador.toUpperCase()}, concurre ${denunciante['Nombres y Apellidos'].toUpperCase()}, con ${denunciante['Tipo de Documento'] || 'Cédula de Identidad Paraguaya'} número ${(denunciante['Número de Documento'] || denunciante['Cédula de Identidad']).toUpperCase()}, de nacionalidad ${denunciante['Nacionalidad'].toUpperCase()}, estado civil ${denunciante['Estado Civil'].toUpperCase()}, ${denunciante['Edad']} años de edad, fecha de nacimiento ${fechaNacimiento}, en ${denunciante['Lugar de Nacimiento'].toUpperCase()}, número de teléfono ${denunciante['Número de Teléfono'].toUpperCase()}${denunciante['Profesión'] ? `, de profesión ${denunciante['Profesión'].toUpperCase()}` : ''}, y expone cuanto sigue:`
  
  const splitParrafo1 = doc.splitTextToSize(parrafo1, 156)
  doc.text(splitParrafo1, 30, 90, { align: 'justify', maxWidth: 156 })

  // Segundo párrafo
  let parrafo2 = `Que por la presente viene a realizar una denuncia sobre un supuesto hecho de ${datosDenuncia.tipo_denuncia.toUpperCase()}`
  if (
    datosDenuncia.tipo_denuncia.toUpperCase() === 'OTRO' &&
    datosDenuncia.otro_tipo
  ) {
    parrafo2 = parrafo2.replace(
      'OTRO',
      `OTRO (${datosDenuncia.otro_tipo.toUpperCase()})`
    )
  }
  parrafo2 += `, ocurrido en fecha ${fechaHecho} siendo las ${datosDenuncia.hora_hecho} aproximadamente, en la dirección ${datosDenuncia.lugar_hecho.toUpperCase()}`

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
  } else {
    parrafo2 +=
      ', siendo el supuesto autor una persona DESCONOCIDA por la persona denunciante.'
  }

  const yParrafo2 = 90 + splitParrafo1.length * 5
  const splitParrafo2 = doc.splitTextToSize(parrafo2, 156)
  doc.text(splitParrafo2, 30, yParrafo2, { align: 'justify', maxWidth: 156 })

  // Relato
  const yRelato = yParrafo2 + splitParrafo2.length * 5
  doc.setFont('helvetica', 'normal')
  doc.text('De acuerdo a los hechos que se describen a continuación:', 30, yRelato)
  
  const relato = `${datosDenuncia.relato}\nNO HABIENDO NADA MÁS QUE AGREGAR SE DA POR TERMINADA EL ACTA, PREVIA LECTURA Y RATIFICACIÓN DE SU CONTENIDO, FIRMANDO AL PIE EL DENUNCIANTE Y EL INTERVINIENTE, EN 3 (TRES) COPIAS DEL MISMO TENOR Y EFECTO. LA PERSONA RECURRENTE ES INFORMADA SOBRE: ARTÍCULO 289.- "DENUNCIA FALSA"; ARTÍCULO 242.- "TESTIMONIO FALSO"; ARTÍCULO 243.- "DECLARACIÓN FALSA".`
  doc.setFont('helvetica', 'italic')
  const splitRelato = doc.splitTextToSize(relato, 156)
  
  // Escribir el texto del relato con manejo de páginas
  let yActual = yRelato + 5
  let textoRestante = splitRelato
  const alturaLinea = 6
  // Altura máxima para páginas intermedias (usar casi todo el espacio, solo 5mm de margen)
  const alturaMaximaIntermedia = formatoPapel[1] - 5
  // Altura máxima para la última página (dejar 50mm para firmas)
  const alturaMaximaUltima = formatoPapel[1] - 50

  while (textoRestante.length > 0) {
    // Calcular cuántas líneas caben en la última página desde el inicio de página nueva
    const espacioParaUltimaDesdeInicio = alturaMaximaUltima - 80
    const lineasQueCabenUltimaDesdeInicio = Math.floor(espacioParaUltimaDesdeInicio / alturaLinea)
    
    // Determinar si esta será la última página
    const seraUltimaPagina = textoRestante.length <= lineasQueCabenUltimaDesdeInicio
    
    // Usar la altura correspondiente
    const alturaMaxima = seraUltimaPagina ? alturaMaximaUltima : alturaMaximaIntermedia
    const espacioRestante = alturaMaxima - yActual

    // Calcular cuántas líneas caben
    const lineasDisponibles = Math.floor(espacioRestante / alturaLinea)

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

      doc.text(lineasPagina, 30, yActual, { align: 'justify', maxWidth: 156 })
      
      // Calcular nueva posición Y
      yActual += lineasPagina.length * alturaLinea

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

  // Agregar firmas en la última página
  const yFirmas = yActual + 20
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

  // Centro - Hash
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(datosDenuncia.hash, 108, yFirmas + 7, { align: 'center' })

  // Firma derecha - Denunciante
  const docDenunciante = `NUMERO DE DOC.: ${denunciante['Número de Documento'] || denunciante['Cédula de Identidad']}`
  doc.line(150, yFirmas, 186, yFirmas)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(denunciante['Nombres y Apellidos'].toUpperCase(), 168, yFirmas + 7, {
    align: 'center',
  })
  doc.text(docDenunciante, 168, yFirmas + 12, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.text('DENUNCIANTE', 168, yFirmas + 17, { align: 'center' })

  return Buffer.from(doc.output('arraybuffer'))
}

export function generarPDFFormato2(
  numeroOrden: number,
  denunciante: Denunciante,
  datosDenuncia: DatosDenuncia
): Buffer {
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
    ...(denunciante['Profesión'] ? [{ label: 'Profesión:', valor: denunciante['Profesión'].toUpperCase() }] : []),
    { label: 'Número de Teléfono:', valor: denunciante['Número de Teléfono'].toUpperCase() }
  ]
  yPos = dibujarTabla('DATOS DEL DENUNCIANTE', datosDenuncianteFilas, yPos)

  // Verificar si necesitamos nueva página
  if (yPos > formatoPapel[1] - 50) {
    doc.addPage()
    agregarEncabezado(doc, titulo, formatoPapel[0])
    yPos = 80
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
    { label: 'Fecha del hecho:', valor: fechaHecho },
    { label: 'Hora del hecho:', valor: datosDenuncia.hora_hecho },
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

      doc.text(lineasPagina, 30, yActual, { align: 'justify', maxWidth: 156 })
      
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

  // Centro - Hash
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(datosDenuncia.hash, 108, yFirmasFinal + 7, { align: 'center' })

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

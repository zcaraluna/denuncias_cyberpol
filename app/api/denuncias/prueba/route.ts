import { NextRequest, NextResponse } from 'next/server'
import { generarPDF, Denunciante, DatosDenuncia } from '@/lib/utils/pdf'
import pool from '@/lib/db'
import { obtenerCapitulo } from '@/lib/data/hechos-punibles'

// Función auxiliar para convertir fechas
const formatDate = (date: any): string => {
  if (!date) return ''
  if (date instanceof Date) {
    const { dateToParaguayString } = require('@/lib/utils/timezone')
    return dateToParaguayString(date)
  }
  return String(date)
}

function generarHash(): string {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let hash = ''
  for (let i = 0; i < 8; i++) {
    hash += caracteres.charAt(Math.floor(Math.random() * caracteres.length))
  }
  return hash
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validar que el usuario sea 'garv'
    if (data.usuario !== 'garv') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Obtener el siguiente número de orden para el año actual
    const fechaDenuncia = data.denuncia.fechaDenuncia || new Date().toISOString().split('T')[0]
    const año = fechaDenuncia.split('-')[0]
    
    const ordenResult = await pool.query(
      `SELECT COALESCE(MAX(orden), 0) + 1 as orden
       FROM denuncias
       WHERE EXTRACT(YEAR FROM fecha_denuncia) = $1 AND orden >= 1`,
      [año]
    )
    const numeroOrden = ordenResult.rows[0].orden

    const fechaDenunciaFormatted = formatDate(data.denuncia.fechaDenuncia)
    const fechaNacimiento = formatDate(data.denunciante.fechaNacimiento)
    const fechaHecho = formatDate(data.denuncia.fechaHecho)
    const fechaHechoFin = data.denuncia.fechaHechoFin ? formatDate(data.denuncia.fechaHechoFin) : null

    const denunciante: Denunciante = {
      'Nombres y Apellidos': data.denunciante.nombres || '',
      'Tipo de Documento': data.denunciante.tipoDocumento || '',
      'Cédula de Identidad': data.denunciante.numeroDocumento || '',
      'Número de Documento': data.denunciante.numeroDocumento || '',
      'Nacionalidad': data.denunciante.nacionalidad || '',
      'Estado Civil': data.denunciante.estadoCivil || '',
      'Edad': data.denunciante.edad || '',
      'Fecha de Nacimiento': fechaNacimiento,
      'Lugar de Nacimiento': data.denunciante.lugarNacimiento || '',
      'Número de Teléfono': data.denunciante.telefono || '',
      'Domicilio': data.denunciante.domicilio || '',
      'Correo Electrónico': data.denunciante.correo || null,
      'Profesión': data.denunciante.profesion || null,
    }

    const involucrados =
      data.denunciantes && Array.isArray(data.denunciantes)
        ? data.denunciantes
            .filter((den: any) => den.rol !== 'principal')
            .map((item: any) => ({
              rol: item.rol,
              nombres: item.datos.nombres || '',
              tipoDocumento: item.datos.tipoDocumento || null,
              numeroDocumento: item.datos.numeroDocumento || item.datos.cedula || null,
              telefono: item.datos.telefono || null,
              correo: item.datos.correo || null,
              profesion: item.datos.profesion || null,
              matricula: item.datos.matricula || null,
              representaA: item.representaA || null,
              domicilio: item.datos.domicilio || null,
              nacionalidad: item.datos.nacionalidad || null,
              estadoCivil: item.datos.estadoCivil || null,
              edad: item.datos.edad || null,
              fechaNacimiento: item.datos.fechaNacimiento ? formatDate(item.datos.fechaNacimiento) : null,
              lugarNacimiento: item.datos.lugarNacimiento || null,
              conCartaPoder: item.conCartaPoder || false,
              cartaPoderFecha: item.cartaPoderFecha ? formatDate(item.cartaPoderFecha) : null,
              cartaPoderNumero: item.cartaPoderNumero || null,
              cartaPoderNotario: item.cartaPoderNotario || null,
            }))
        : []

    // Convertir hecho punible específico al capítulo correspondiente para el PDF
    // Pero mantener "OTRO" y "EXTRAVÍO DE OBJETOS Y/O DOCUMENTOS" tal cual
    let tipoDenunciaParaPDF = data.denuncia.tipoDenuncia || ''
    if (tipoDenunciaParaPDF && tipoDenunciaParaPDF !== 'OTRO' && tipoDenunciaParaPDF !== 'EXTRAVÍO DE OBJETOS Y/O DOCUMENTOS') {
      const capitulo = obtenerCapitulo(tipoDenunciaParaPDF)
      if (capitulo) {
        tipoDenunciaParaPDF = capitulo
      }
    }

    const datosDenuncia: DatosDenuncia = {
      fecha_denuncia: fechaDenunciaFormatted,
      hora_denuncia: data.denuncia.horaDenuncia || '',
      fecha_hecho: fechaHecho,
      hora_hecho: data.denuncia.horaHecho || '',
      fecha_hecho_fin: fechaHechoFin,
      hora_hecho_fin: data.denuncia.horaHechoFin || null,
      tipo_denuncia: tipoDenunciaParaPDF,
      otro_tipo: data.denuncia.otroTipo || null,
      lugar_hecho: data.denuncia.lugarHecho || '',
      relato: data.denuncia.relato || '',
      orden: numeroOrden,
      hash: generarHash(),
      oficina: data.operador.oficina || '',
      grado_operador: data.operador.grado || '',
      nombre_operador: `${data.operador.nombre} ${data.operador.apellido}`,
      tipo_papel: 'oficio',
      latitud: data.denuncia.latitud || null,
      longitud: data.denuncia.longitud || null,
      monto_dano: data.denuncia.montoDano || null,
      moneda: data.denuncia.moneda || null,
      nombre_autor: data.autor.conocido === 'Conocido' ? data.autor.nombre : null,
      cedula_autor: data.autor.conocido === 'Conocido' ? data.autor.cedula : null,
      domicilio_autor: data.autor.conocido === 'Conocido' ? data.autor.domicilio : null,
      nacionalidad_autor: data.autor.conocido === 'Conocido' ? data.autor.nacionalidad : null,
      estado_civil_autor: data.autor.conocido === 'Conocido' ? data.autor.estadoCivil : null,
      edad_autor: data.autor.conocido === 'Conocido' ? data.autor.edad : null,
      fecha_nacimiento_autor: data.autor.conocido === 'Conocido' && data.autor.fechaNacimiento ? formatDate(data.autor.fechaNacimiento) : null,
      lugar_nacimiento_autor: data.autor.conocido === 'Conocido' ? data.autor.lugarNacimiento : null,
      telefono_autor: data.autor.conocido === 'Conocido' ? data.autor.telefono : null,
      profesion_autor: data.autor.conocido === 'Conocido' ? data.autor.profesion : null,
      descripcion_fisica: data.autor.conocido === 'Desconocido' && data.descripcionFisica 
        ? (typeof data.descripcionFisica === 'string' 
            ? data.descripcionFisica 
            : JSON.stringify(data.descripcionFisica)) 
        : null,
      involucrados,
    }

    // Generar PDF con el número de orden real (pero sin guardar en BD)
    const pdfBuffer = await generarPDF(numeroOrden, denunciante, datosDenuncia)

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="denuncia_prueba_${numeroOrden}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generando PDF de prueba:', error)
    return NextResponse.json(
      { error: 'Error al generar el PDF de prueba' },
      { status: 500 }
    )
  }
}


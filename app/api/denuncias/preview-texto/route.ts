import { NextRequest, NextResponse } from 'next/server'
import { generarTextoPDF, Denunciante, DatosDenuncia } from '@/lib/utils/pdf'

// Función auxiliar para convertir fechas
const formatDate = (date: any): string => {
  if (!date) return ''
  if (date instanceof Date) {
    // Usar zona horaria de Paraguay
    const { dateToParaguayString } = require('@/lib/utils/timezone')
    return dateToParaguayString(date)
  }
  return String(date)
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const denunciante: Denunciante = {
      'Nombres y Apellidos': data.denunciante.nombres,
      'Tipo de Documento': data.denunciante.tipoDocumento,
      'Cédula de Identidad': data.denunciante.numeroDocumento,
      'Número de Documento': data.denunciante.numeroDocumento,
      'Nacionalidad': data.denunciante.nacionalidad,
      'Estado Civil': data.denunciante.estadoCivil,
      'Edad': data.denunciante.edad,
      'Fecha de Nacimiento': formatDate(data.denunciante.fechaNacimiento),
      'Lugar de Nacimiento': data.denunciante.lugarNacimiento,
      'Número de Teléfono': data.denunciante.telefono,
      'Domicilio': data.denunciante.domicilio || '',
      'Correo Electrónico': data.denunciante.correo || '',
      'Profesión': data.denunciante.profesion,
    }

    const mapIdToNombre = new Map<string, string>()
    if (data.denunciantePrincipalId && data.denunciante?.nombres) {
      mapIdToNombre.set(String(data.denunciantePrincipalId), data.denunciante.nombres)
    }
    if (Array.isArray(data.denunciantes)) {
      data.denunciantes.forEach((item: any) => {
        if (item?.id && item?.datos?.nombres) {
          mapIdToNombre.set(String(item.id), item.datos.nombres)
        }
      })
    }

    const involucrados =
      Array.isArray(data.denunciantes) && data.denunciantePrincipalId
        ? data.denunciantes
            .filter(
              (item: any) =>
                item &&
                item.rol &&
                item.id !== data.denunciantePrincipalId &&
                item.datos
            )
            .map((item: any) => ({
              rol: item.rol,
              nombres: item.datos?.nombres || '',
              tipoDocumento: item.datos?.tipoDocumento || null,
              numeroDocumento: item.datos?.numeroDocumento || null,
              telefono: item.datos?.telefono || null,
              correo: item.datos?.correo || null,
              profesion: item.datos?.profesion || null,
              matricula: item.datos?.matricula || null,
              nacionalidad: item.datos?.nacionalidad || null,
              estadoCivil: item.datos?.estadoCivil || null,
              edad: item.datos?.edad || null,
              fechaNacimiento: item.datos?.fechaNacimiento || null,
              lugarNacimiento: item.datos?.lugarNacimiento || null,
              domicilio: item.datos?.domicilio || null,
              representaA: item.representaA ? mapIdToNombre.get(String(item.representaA)) || null : null,
              conCartaPoder: Boolean(item.conCartaPoder),
              cartaPoderFecha: item.cartaPoderFecha || null,
              cartaPoderNotario: item.cartaPoderNotario || null,
            }))
        : []

    const { getFechaHoraParaguay } = await import('@/lib/utils/timezone')
    const { fecha: fechaDenuncia, hora: horaDenuncia } = getFechaHoraParaguay()

    const datosDenuncia: DatosDenuncia = {
      fecha_denuncia: formatDate(data.denuncia.fechaDenuncia) || fechaDenuncia,
      hora_denuncia: data.denuncia.horaDenuncia || horaDenuncia,
      fecha_hecho: formatDate(data.denuncia.fechaHecho),
      hora_hecho: data.denuncia.horaHecho,
      fecha_hecho_fin: data.denuncia.fechaHechoFin ? formatDate(data.denuncia.fechaHechoFin) : null,
      hora_hecho_fin: data.denuncia.horaHechoFin || null,
      tipo_denuncia: data.denuncia.tipoDenuncia,
      otro_tipo: data.denuncia.otroTipo,
      lugar_hecho: data.denuncia.lugarHecho,
      relato: data.denuncia.relato,
      orden: 0, // Número temporal para vista previa (se mostrará como "#")
      hash: 'XXXXX',
      oficina: data.operador.oficina,
      grado_operador: data.operador.grado,
      nombre_operador: `${data.operador.nombre} ${data.operador.apellido}`,
      tipo_papel: 'oficio',
      latitud: data.denuncia.latitud,
      longitud: data.denuncia.longitud,
      monto_dano: data.denuncia.montoDano,
      moneda: data.denuncia.moneda,
      nombre_autor: data.autor.conocido === 'Conocido' ? data.autor.nombre : null,
      cedula_autor: data.autor.conocido === 'Conocido' ? data.autor.cedula : null,
      domicilio_autor: data.autor.conocido === 'Conocido' ? data.autor.domicilio : null,
      nacionalidad_autor: data.autor.conocido === 'Conocido' ? data.autor.nacionalidad : null,
      estado_civil_autor: data.autor.conocido === 'Conocido' ? data.autor.estadoCivil : null,
      edad_autor: data.autor.conocido === 'Conocido' ? data.autor.edad : null,
      fecha_nacimiento_autor: data.autor.conocido === 'Conocido' ? formatDate(data.autor.fechaNacimiento) : null,
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

    // Generar solo el texto del PDF
    // Usar 0 para vista previa, que se mostrará como "#/AAAA"
    const textoPDF = generarTextoPDF(0, denunciante, datosDenuncia)

    return NextResponse.json({ texto: textoPDF })
  } catch (error) {
    console.error('Error generando texto de vista previa:', error)
    return NextResponse.json(
      { error: 'Error al generar la vista previa del texto' },
      { status: 500 }
    )
  }
}


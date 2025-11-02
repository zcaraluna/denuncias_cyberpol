import { NextRequest, NextResponse } from 'next/server'
import { generarPDF, generarPDFFormato2, Denunciante, DatosDenuncia } from '@/lib/utils/pdf'

// Función auxiliar para convertir fechas
const formatDate = (date: any): string => {
  if (!date) return ''
  if (date instanceof Date) {
    return date.toISOString().split('T')[0]
  }
  return String(date)
}

function generarHash(): string {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let hash = ''
  for (let i = 0; i < 5; i++) {
    hash += caracteres.charAt(Math.floor(Math.random() * caracteres.length))
  }
  return hash
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const formato = data.formato ? parseInt(data.formato) : 1 // Por defecto formato 1

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
      'Profesión': data.denunciante.profesion,
    }

    const datosDenuncia: DatosDenuncia = {
      fecha_denuncia: formatDate(data.denuncia.fechaDenuncia),
      hora_denuncia: data.denuncia.horaDenuncia,
      fecha_hecho: formatDate(data.denuncia.fechaHecho),
      hora_hecho: data.denuncia.horaHecho,
      tipo_denuncia: data.denuncia.tipoDenuncia,
      otro_tipo: data.denuncia.otroTipo,
      lugar_hecho: data.denuncia.lugarHecho,
      relato: data.denuncia.relato,
      orden: 999, // Número temporal para vista previa
      hash: generarHash(),
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
    }

    // Generar PDF según el formato seleccionado
    const pdfBuffer = formato === 2 
      ? generarPDFFormato2(999, denunciante, datosDenuncia)
      : generarPDF(999, denunciante, datosDenuncia)

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="vista_previa.pdf"',
      },
    })
  } catch (error) {
    console.error('Error generando vista previa:', error)
    return NextResponse.json(
      { error: 'Error al generar la vista previa' },
      { status: 500 }
    )
  }
}


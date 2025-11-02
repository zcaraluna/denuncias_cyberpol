import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { generarPDF, generarPDFFormato2, Denunciante, DatosDenuncia } from '@/lib/utils/pdf'

// Función auxiliar para convertir fechas
const formatDate = (date: any): string => {
  if (!date) return ''
  if (date instanceof Date) {
    return date.toISOString().split('T')[0]
  }
  return String(date)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    // Obtener parámetros
    const searchParams = request.nextUrl.searchParams
    const tipoPapel = (searchParams.get('tipo') === 'a4' ? 'a4' : 'oficio') as 'oficio' | 'a4'
    const usuarioIdActual = searchParams.get('usuario_id')
    const formato = parseInt(searchParams.get('formato') || '1') // Por defecto formato 1

    // Obtener datos de la denuncia
    const denunciaResult = await pool.query(
      `SELECT d.*, den.nombres as nombres_denunciante, den.cedula, den.tipo_documento, den.nacionalidad, 
              den.estado_civil, den.edad, den.fecha_nacimiento, den.lugar_nacimiento, 
              den.telefono, den.profesion,
              sa.autor_conocido, sa.nombre_autor, sa.cedula_autor, sa.domicilio_autor,
              sa.nacionalidad_autor, sa.estado_civil_autor, sa.edad_autor, 
              sa.fecha_nacimiento_autor, sa.lugar_nacimiento_autor, sa.telefono_autor, 
              sa.profesion_autor
       FROM denuncias d
       JOIN denunciantes den ON d.denunciante_id = den.id
       LEFT JOIN supuestos_autores sa ON d.id = sa.denuncia_id
       WHERE d.id = $1`,
      [id]
    )

    if (denunciaResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Denuncia no encontrada' },
        { status: 404 }
      )
    }

    const row = denunciaResult.rows[0]
    const fechaDenuncia = formatDate(row.fecha_denuncia)
    const año = fechaDenuncia.split('-')[0]

    // Preparar datos para el PDF
    const denunciante: Denunciante = {
      'Nombres y Apellidos': row.nombres_denunciante,
      'Tipo de Documento': row.tipo_documento || 'Cédula de Identidad Paraguaya',
      'Cédula de Identidad': row.cedula,
      'Número de Documento': row.cedula,
      'Nacionalidad': row.nacionalidad,
      'Estado Civil': row.estado_civil,
      'Edad': row.edad.toString(),
      'Fecha de Nacimiento': formatDate(row.fecha_nacimiento),
      'Lugar de Nacimiento': row.lugar_nacimiento,
      'Número de Teléfono': row.telefono,
      'Profesión': row.profesion,
    }

    // Verificar si el usuario que descarga es diferente del que tomó la denuncia
    const esOperadorAutorizado = usuarioIdActual && row.usuario_id && usuarioIdActual !== row.usuario_id.toString()
    
    // Si es un operador autorizado diferente, obtener sus datos
    let operadorAutorizado = null
    if (esOperadorAutorizado && usuarioIdActual) {
      const usuarioResult = await pool.query(
        'SELECT nombre, apellido, grado FROM usuarios WHERE id = $1',
        [usuarioIdActual]
      )
      if (usuarioResult.rows.length > 0) {
        const usuario = usuarioResult.rows[0]
        operadorAutorizado = {
          grado: usuario.grado,
          nombre: `${usuario.nombre} ${usuario.apellido}`
        }
      }
    }

    const datosDenuncia: DatosDenuncia = {
      fecha_denuncia: fechaDenuncia,
      hora_denuncia: row.hora_denuncia,
      fecha_hecho: formatDate(row.fecha_hecho),
      hora_hecho: row.hora_hecho,
      tipo_denuncia: row.tipo_denuncia,
      otro_tipo: row.otro_tipo,
      lugar_hecho: row.lugar_hecho,
      relato: row.relato,
      orden: row.orden,
      hash: row.hash,
      oficina: row.oficina,
      grado_operador: row.operador_grado,
      nombre_operador: `${row.operador_nombre} ${row.operador_apellido}`,
      tipo_papel: tipoPapel,
      latitud: row.latitud,
      longitud: row.longitud,
      monto_dano: row.monto_dano,
      moneda: row.moneda,
      nombre_autor: row.nombre_autor,
      cedula_autor: row.cedula_autor,
      domicilio_autor: row.domicilio_autor,
      nacionalidad_autor: row.nacionalidad_autor,
      estado_civil_autor: row.estado_civil_autor,
      edad_autor: row.edad_autor,
      fecha_nacimiento_autor: formatDate(row.fecha_nacimiento_autor),
      lugar_nacimiento_autor: row.lugar_nacimiento_autor,
      telefono_autor: row.telefono_autor,
      profesion_autor: row.profesion_autor,
      operador_autorizado: operadorAutorizado || undefined,
      es_operador_autorizado: esOperadorAutorizado
    }

    // Generar PDF según el formato seleccionado
    const pdfBuffer = formato === 2 
      ? generarPDFFormato2(row.orden, denunciante, datosDenuncia)
      : generarPDF(row.orden, denunciante, datosDenuncia)

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="denuncia_${row.orden}_${año}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generando PDF:', error)
    return NextResponse.json(
      { error: 'Error al generar el PDF' },
      { status: 500 }
    )
  }
}

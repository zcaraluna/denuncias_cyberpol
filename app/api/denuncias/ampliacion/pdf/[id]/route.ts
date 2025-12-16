import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { generarPDFAmpliacion } from '@/lib/utils/pdf'
import type { Denunciante, DatosDenuncia } from '@/lib/utils/pdf'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    const [año, mes, dia] = dateStr.split('-')
    return `${dia}/${mes}/${año}`
  } catch {
    return dateStr
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const ampliacionId = parseInt(idStr)

    // Obtener parámetros de consulta
    const searchParams = request.nextUrl.searchParams
    const tipoPapel = (searchParams.get('tipo') || 'oficio') as 'oficio' | 'a4'

    // Obtener la ampliación
    const ampliacionResult = await pool.query(
      `SELECT * FROM ampliaciones_denuncia WHERE id = $1`,
      [ampliacionId]
    )

    if (ampliacionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Ampliación no encontrada' },
        { status: 404 }
      )
    }

    const ampliacion = ampliacionResult.rows[0]

    // Obtener datos de la denuncia
    const denunciaResult = await pool.query(
      `SELECT 
        d.*,
        den.nombres as nombres_denunciante,
        den.cedula,
        den.tipo_documento,
        den.nacionalidad,
        den.estado_civil,
        den.edad,
        den.fecha_nacimiento,
        den.lugar_nacimiento,
        den.domicilio,
        den.telefono,
        den.correo,
        den.profesion,
        den.matricula
      FROM denuncias d
      INNER JOIN denunciantes den ON d.denunciante_id = den.id
      WHERE d.id = $1`,
      [ampliacion.denuncia_id]
    )

    if (denunciaResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Denuncia no encontrada' },
        { status: 404 }
      )
    }

    const row = denunciaResult.rows[0]

    // Obtener supuesto autor
    const autorResult = await pool.query(
      `SELECT * FROM supuestos_autores WHERE denuncia_id = $1 LIMIT 1`,
      [ampliacion.denuncia_id]
    )
    const autor = autorResult.rows[0] || null

    // Obtener involucrados
    const involucradosResult = await pool.query(
      `SELECT 
        di.id,
        di.rol,
        di.representa_denunciante_id,
        di.con_carta_poder,
        di.carta_poder_fecha,
        di.carta_poder_numero,
        di.carta_poder_notario,
        den.id as denunciante_id,
        den.nombres,
        den.cedula,
        den.tipo_documento,
        den.nacionalidad,
        den.estado_civil,
        den.edad,
        den.fecha_nacimiento,
        den.lugar_nacimiento,
        den.domicilio,
        den.telefono,
        den.correo,
        den.profesion,
        den.matricula
      FROM denuncias_involucrados di
      INNER JOIN denunciantes den ON den.id = di.denunciante_id
      WHERE di.denuncia_id = $1
      ORDER BY 
        CASE WHEN di.rol = 'principal' THEN 0 ELSE 1 END,
        di.id`,
      [ampliacion.denuncia_id]
    )

    const involucrados = involucradosResult.rows.map((involucrado) => ({
      rol: involucrado.rol as 'principal' | 'co-denunciante' | 'abogado',
      nombres: involucrado.nombres,
      tipoDocumento: involucrado.tipo_documento || null,
      numeroDocumento: involucrado.cedula || null,
      telefono: involucrado.telefono || null,
      correo: involucrado.correo || null,
      profesion: involucrado.profesion || null,
      matricula: involucrado.matricula || null,
      representaA: involucrado.representa_denunciante_id ? null : null,
      domicilio: involucrado.domicilio || null,
      nacionalidad: involucrado.nacionalidad || null,
      estadoCivil: involucrado.estado_civil || null,
      edad: involucrado.edad ? String(involucrado.edad) : null,
      fechaNacimiento: involucrado.fecha_nacimiento || null,
      lugarNacimiento: involucrado.lugar_nacimiento || null,
      conCartaPoder: involucrado.con_carta_poder || false,
      cartaPoderFecha: involucrado.carta_poder_fecha || null,
      cartaPoderNumero: involucrado.carta_poder_numero || null,
      cartaPoderNotario: involucrado.carta_poder_notario || null,
    }))

    // Construir objeto Denunciante
    const denunciante: Denunciante = {
      'Nombres y Apellidos': row.nombres_denunciante,
      'Tipo de Documento': row.tipo_documento || undefined,
      'Cédula de Identidad': row.cedula,
      'Número de Documento': row.tipo_documento ? row.cedula : undefined,
      'Nacionalidad': row.nacionalidad,
      'Estado Civil': row.estado_civil,
      'Edad': String(row.edad),
      'Fecha de Nacimiento': row.fecha_nacimiento,
      'Lugar de Nacimiento': row.lugar_nacimiento,
      'Número de Teléfono': row.telefono,
      'Domicilio': row.domicilio,
      'Correo Electrónico': row.correo,
      'Profesión': row.profesion,
    }

    // Construir objeto DatosDenuncia
    const fechaDenuncia = row.fecha_denuncia
    const datosDenuncia: DatosDenuncia = {
      fecha_denuncia: fechaDenuncia,
      hora_denuncia: row.hora_denuncia,
      fecha_hecho: row.fecha_hecho,
      hora_hecho: row.hora_hecho,
      fecha_hecho_fin: row.fecha_hecho_fin || null,
      hora_hecho_fin: row.hora_hecho_fin || null,
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
      nombre_autor: autor?.nombre_autor || null,
      cedula_autor: autor?.cedula_autor || null,
      domicilio_autor: autor?.domicilio_autor || null,
      nacionalidad_autor: autor?.nacionalidad_autor || null,
      estado_civil_autor: autor?.estado_civil_autor || null,
      edad_autor: autor?.edad_autor ? String(autor.edad_autor) : null,
      fecha_nacimiento_autor: autor?.fecha_nacimiento_autor || null,
      lugar_nacimiento_autor: autor?.lugar_nacimiento_autor || null,
      telefono_autor: autor?.telefono_autor || null,
      profesion_autor: autor?.profesion_autor || null,
      descripcion_fisica: autor?.descripcion_fisica || null,
      involucrados,
    }

    // Generar PDF de ampliación
    const año = fechaDenuncia.split('-')[0]
    const pdfBuffer = await generarPDFAmpliacion(
      row.orden,
      ampliacion.numero_ampliacion,
      denunciante,
      datosDenuncia,
      ampliacion.relato,
      ampliacion.fecha_ampliacion,
      ampliacion.hora_ampliacion,
      {
        grado: ampliacion.operador_grado,
        nombre: ampliacion.operador_nombre,
        apellido: ampliacion.operador_apellido
      }
    )

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ampliacion_${ampliacion.numero_ampliacion}_denuncia_${row.orden}_${año}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generando PDF de ampliación:', error)
    return NextResponse.json(
      { error: 'Error al generar el PDF' },
      { status: 500 }
    )
  }
}


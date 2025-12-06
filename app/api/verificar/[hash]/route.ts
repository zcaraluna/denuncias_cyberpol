import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// API pública para verificar denuncias - NO requiere autenticación
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params

    if (!hash || hash.length < 5) {
      return NextResponse.json(
        { error: 'Hash de verificación inválido' },
        { status: 400 }
      )
    }

    // Buscar la denuncia por su hash
    const result = await pool.query(
      `SELECT 
        d.id,
        d.hash,
        d.orden,
        d.fecha_denuncia,
        d.hora_denuncia,
        d.fecha_hecho,
        d.hora_hecho,
        d.fecha_hecho_fin,
        d.hora_hecho_fin,
        d.tipo_denuncia,
        d.otro_tipo,
        d.lugar_hecho,
        d.oficina,
        d.operador_grado,
        d.operador_nombre,
        d.operador_apellido,
        d.estado,
        d.creado_en,
        den.nombres as denunciante_nombres,
        den.cedula as denunciante_cedula,
        den.tipo_documento as denunciante_tipo_documento
      FROM denuncias d
      LEFT JOIN denunciantes den ON d.denunciante_id = den.id
      WHERE d.hash = $1 AND d.estado != 'borrador'`,
      [hash.toUpperCase()]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Denuncia no encontrada', encontrada: false },
        { status: 404 }
      )
    }

    const denuncia = result.rows[0]

    // Formatear fecha para mostrar
    const formatearFecha = (fecha: any) => {
      if (!fecha) return null
      const d = new Date(fecha)
      return d.toLocaleDateString('es-PY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }

    // Obtener año de la denuncia para el número de orden
    const año = denuncia.fecha_denuncia 
      ? new Date(denuncia.fecha_denuncia).getFullYear() 
      : new Date(denuncia.creado_en).getFullYear()

    // Devolver datos públicos (sin información sensible completa)
    return NextResponse.json({
      encontrada: true,
      verificacion: {
        hash: denuncia.hash,
        numeroActa: `${denuncia.orden}/${año}`,
        fechaDenuncia: formatearFecha(denuncia.fecha_denuncia),
        horaDenuncia: denuncia.hora_denuncia,
        tipoDenuncia: denuncia.tipo_denuncia + (denuncia.otro_tipo ? ` (${denuncia.otro_tipo})` : ''),
        fechaHecho: formatearFecha(denuncia.fecha_hecho),
        horaHecho: denuncia.hora_hecho,
        fechaHechoFin: formatearFecha(denuncia.fecha_hecho_fin),
        horaHechoFin: denuncia.hora_hecho_fin,
        lugarHecho: denuncia.lugar_hecho,
        oficina: denuncia.oficina,
        operador: `${denuncia.operador_grado} ${denuncia.operador_nombre} ${denuncia.operador_apellido}`,
        estado: denuncia.estado || 'finalizada',
        // Datos del denunciante (parcialmente ocultos por privacidad)
        denunciante: {
          nombres: ocultarNombreParcial(denuncia.denunciante_nombres),
          documento: ocultarDocumentoParcial(denuncia.denunciante_tipo_documento, denuncia.denunciante_cedula)
        }
      }
    })
  } catch (error) {
    console.error('Error verificando denuncia:', error)
    return NextResponse.json(
      { error: 'Error al verificar la denuncia' },
      { status: 500 }
    )
  }
}

// Función para ocultar parcialmente el nombre (ej: "JUAN PEREZ" -> "J*** P***")
function ocultarNombreParcial(nombre: string | null): string {
  if (!nombre) return 'No especificado'
  
  const partes = nombre.split(' ')
  return partes.map(parte => {
    if (parte.length <= 2) return parte
    return parte[0] + '*'.repeat(Math.min(parte.length - 1, 3))
  }).join(' ')
}

// Función para ocultar parcialmente el documento (ej: "CI 1234567" -> "CI ****567")
function ocultarDocumentoParcial(tipo: string | null, numero: string | null): string {
  if (!numero) return 'No especificado'
  
  const tipoDoc = tipo || 'DOC'
  const numLimpio = numero.replace(/\D/g, '')
  
  if (numLimpio.length <= 3) {
    return `${tipoDoc} ***`
  }
  
  const ultimos3 = numLimpio.slice(-3)
  return `${tipoDoc} ${'*'.repeat(numLimpio.length - 3)}${ultimos3}`
}





import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    // Obtener datos de la denuncia con denunciante
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
        den.telefono,
        den.profesion
      FROM denuncias d
      INNER JOIN denunciantes den ON d.denunciante_id = den.id
      WHERE d.id = $1`,
      [id]
    )

    if (denunciaResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Denuncia no encontrada' },
        { status: 404 }
      )
    }

    const denuncia = denunciaResult.rows[0]

    // Obtener supuestos autores
    const autoresResult = await pool.query(
      `SELECT * FROM supuestos_autores WHERE denuncia_id = $1`,
      [id]
    )

    // Construir el objeto de respuesta
    const response = {
      id: denuncia.id,
      nombres_denunciante: denuncia.nombres_denunciante,
      cedula: denuncia.cedula,
      tipo_documento: denuncia.tipo_documento,
      nacionalidad: denuncia.nacionalidad,
      estado_civil: denuncia.estado_civil,
      edad: denuncia.edad,
      fecha_nacimiento: denuncia.fecha_nacimiento,
      lugar_nacimiento: denuncia.lugar_nacimiento,
      telefono: denuncia.telefono,
      profesion: denuncia.profesion,
      fecha_denuncia: denuncia.fecha_denuncia,
      hora_denuncia: denuncia.hora_denuncia,
      fecha_hecho: denuncia.fecha_hecho,
      hora_hecho: denuncia.hora_hecho,
      tipo_denuncia: denuncia.tipo_denuncia,
      otro_tipo: denuncia.otro_tipo,
      relato: denuncia.relato,
      lugar_hecho: denuncia.lugar_hecho,
      latitud: denuncia.latitud,
      longitud: denuncia.longitud,
      orden: denuncia.orden,
      operador_grado: denuncia.operador_grado,
      operador_nombre: denuncia.operador_nombre,
      operador_apellido: denuncia.operador_apellido,
      monto_dano: denuncia.monto_dano,
      moneda: denuncia.moneda,
      hash: denuncia.hash,
      estado: denuncia.estado,
      supuestos_autores: autoresResult.rows
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error obteniendo denuncia:', error)
    return NextResponse.json(
      { error: 'Error al obtener denuncia' },
      { status: 500 }
    )
  }
}


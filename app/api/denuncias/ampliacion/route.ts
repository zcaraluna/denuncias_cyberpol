import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getFechaHoraParaguay } from '@/lib/utils/timezone'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { denuncia_id, relato, usuario_id, operador_grado, operador_nombre, operador_apellido } = body

    // Validar campos requeridos
    if (!denuncia_id || !relato || !operador_grado || !operador_nombre || !operador_apellido) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la denuncia existe y está completada
    const denunciaResult = await pool.query(
      'SELECT id, estado FROM denuncias WHERE id = $1',
      [denuncia_id]
    )

    if (denunciaResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Denuncia no encontrada' },
        { status: 404 }
      )
    }

    if (denunciaResult.rows[0].estado !== 'completada') {
      return NextResponse.json(
        { error: 'Solo se pueden crear ampliaciones para denuncias completadas' },
        { status: 400 }
      )
    }

    // Obtener el número de ampliación siguiente
    const ampliacionesResult = await pool.query(
      'SELECT COALESCE(MAX(numero_ampliacion), 0) + 1 as siguiente_numero FROM ampliaciones_denuncia WHERE denuncia_id = $1',
      [denuncia_id]
    )
    const numero_ampliacion = ampliacionesResult.rows[0].siguiente_numero

    // Obtener fecha y hora actual en zona horaria de Paraguay
    const { fecha: fecha_ampliacion, hora: hora_ampliacion } = getFechaHoraParaguay()

    // Insertar la ampliación
    const result = await pool.query(
      `INSERT INTO ampliaciones_denuncia 
       (denuncia_id, numero_ampliacion, relato, fecha_ampliacion, hora_ampliacion, usuario_id, operador_grado, operador_nombre, operador_apellido)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        denuncia_id,
        numero_ampliacion,
        relato,
        fecha_ampliacion,
        hora_ampliacion,
        usuario_id || null,
        operador_grado,
        operador_nombre,
        operador_apellido
      ]
    )

    return NextResponse.json({
      success: true,
      ampliacion: result.rows[0]
    })
  } catch (error) {
    console.error('Error creando ampliación:', error)
    return NextResponse.json(
      { error: 'Error al crear ampliación' },
      { status: 500 }
    )
  }
}


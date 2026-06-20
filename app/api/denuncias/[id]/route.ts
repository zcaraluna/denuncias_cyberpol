import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    const result = await pool.query(
      `SELECT d.*, den.nombres as denunciante_nombres
       FROM denuncias d
       JOIN denunciantes den ON d.denunciante_id = den.id
       WHERE d.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Denuncia no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error obteniendo denuncia:', error)
    return NextResponse.json(
      { error: 'Error al obtener la denuncia' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioSesionCookie = request.cookies.get('usuario_sesion')?.value
    if (usuarioSesionCookie) {
      try {
        const usr = JSON.parse(decodeURIComponent(usuarioSesionCookie))
        if (usr.rol === 'visor') {
          return NextResponse.json(
            { error: 'Acción no autorizada para el rol de visor' },
            { status: 403 }
          )
        }
      } catch (e) {
        console.error('[PATCH Remitir] Error parseando sesión:', e)
      }
    }

    const { id: idStr } = await params
    const id = parseInt(idStr)
    const body = await request.json()
    const { dependencia_remitida, remitido_por } = body

    // 1. Verificar si es editable (dentro de las 24 horas)
    const result = await pool.query(
      `SELECT creado_en, (creado_en >= NOW() - INTERVAL '24 hours') as es_editable 
       FROM denuncias 
       WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Denuncia no encontrada' },
        { status: 404 }
      )
    }

    const { es_editable } = result.rows[0]

    if (!es_editable) {
      return NextResponse.json(
        { error: 'No se puede editar la remisión después de transcurridas 24 horas desde el registro de la denuncia.' },
        { status: 400 }
      )
    }

    // 2. Identificar al operador actual
    let operadorNombre = remitido_por
    if (!operadorNombre) {
      const usuarioSesionCookie = request.cookies.get('usuario_sesion')?.value
      if (usuarioSesionCookie) {
        try {
          const usr = JSON.parse(decodeURIComponent(usuarioSesionCookie))
          operadorNombre = `${usr.grado || ''} ${usr.nombre || ''} ${usr.apellido || ''}`.trim()
        } catch (e) {
          console.error('[PATCH Remitir] Error parseando sesión:', e)
        }
      }
    }

    if (!operadorNombre) {
      return NextResponse.json(
        { error: 'No se pudo identificar al operador que realiza la selección.' },
        { status: 401 }
      )
    }

    // 3. Actualizar la sugerencia de remisión
    const updateResult = await pool.query(
      `UPDATE denuncias 
       SET dependencia_remitida = $1, 
           remitido_por = $2, 
           remitido_en = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [dependencia_remitida || null, operadorNombre, id]
    )

    return NextResponse.json({
      success: true,
      denuncia: updateResult.rows[0]
    })
  } catch (error) {
    console.error('Error actualizando remisión:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la sugerencia de remisión' },
      { status: 500 }
    )
  }
}


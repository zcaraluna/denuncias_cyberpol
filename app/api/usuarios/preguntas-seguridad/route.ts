import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

// Normalizar texto: minúsculas, sin acentos y sin espacios en blanco
function normalizarRespuesta(texto: string): string {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .trim()
    .replace(/\s+/g, ''); // Quitar espacios en blanco
}

// GET: Verificar si el usuario logueado ya configuró sus 5 preguntas
export async function GET(request: NextRequest) {
  try {
    const usuarioCookie = request.cookies.get('usuario_sesion')?.value
    if (!usuarioCookie) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    let usuario: { id: number; rol: string }
    try {
      usuario = JSON.parse(decodeURIComponent(usuarioCookie))
    } catch (e) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    if (usuario.rol === 'visor') {
      return NextResponse.json({ error: 'Acción no autorizada para el rol de visor' }, { status: 403 })
    }

    const result = await pool.query(
      'SELECT COUNT(*) FROM preguntas_seguridad_usuarios WHERE usuario_id = $1',
      [usuario.id]
    )

    const count = parseInt(result.rows[0].count)
    return NextResponse.json({ configuradas: count >= 5 })

  } catch (error) {
    console.error('Error verificando preguntas configuradas:', error)
    return NextResponse.json(
      { error: 'Error del servidor al verificar configuración' },
      { status: 500 }
    )
  }
}

// POST: Guardar las 5 preguntas y respuestas de seguridad
export async function POST(request: NextRequest) {
  try {
    const usuarioCookie = request.cookies.get('usuario_sesion')?.value
    if (!usuarioCookie) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    let usuario: { id: number; rol: string }
    try {
      usuario = JSON.parse(decodeURIComponent(usuarioCookie))
    } catch (e) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    if (usuario.rol === 'visor') {
      return NextResponse.json({ error: 'Acción no autorizada para el rol de visor' }, { status: 403 })
    }

    const body = await request.json()
    const { preguntas } = body // Espera array de { pregunta, respuesta }

    if (!preguntas || !Array.isArray(preguntas) || preguntas.length !== 5) {
      return NextResponse.json(
        { error: 'Debes configurar exactamente 5 preguntas de seguridad' },
        { status: 400 }
      )
    }

    // Validar preguntas únicas y respuestas no vacías
    const preguntasTextoSet = new Set<string>()
    for (const p of preguntas) {
      if (!p.pregunta || p.pregunta.trim().length < 5) {
        return NextResponse.json({ error: 'Pregunta de seguridad inválida o demasiado corta' }, { status: 400 })
      }
      if (!p.respuesta || p.respuesta.trim().length < 1) {
        return NextResponse.json({ error: 'Todas las respuestas son requeridas' }, { status: 400 })
      }
      preguntasTextoSet.add(p.pregunta.trim())
    }

    if (preguntasTextoSet.size !== 5) {
      return NextResponse.json({ error: 'No se permiten preguntas duplicadas' }, { status: 400 })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 1. Eliminar cualquier configuración previa de preguntas del usuario
      await client.query(
        'DELETE FROM preguntas_seguridad_usuarios WHERE usuario_id = $1',
        [usuario.id]
      )

      // 2. Insertar las nuevas preguntas con respuestas hasheadas
      for (const p of preguntas) {
        const respuestaNormalizada = normalizarRespuesta(p.respuesta)
        const hash = await bcrypt.hash(respuestaNormalizada, 10)

        await client.query(
          `INSERT INTO preguntas_seguridad_usuarios (usuario_id, pregunta, respuesta_hash)
           VALUES ($1, $2, $3)`,
          [usuario.id, p.pregunta.trim(), hash]
        )
      }

      await client.query('COMMIT')
    } catch (dbErr) {
      await client.query('ROLLBACK')
      throw dbErr
    } finally {
      client.release()
    }

    return NextResponse.json({ success: true, mensaje: 'Preguntas de seguridad configuradas exitosamente' })

  } catch (error) {
    console.error('Error al guardar preguntas de seguridad:', error)
    return NextResponse.json(
      { error: 'Error del servidor al guardar preguntas' },
      { status: 500 }
    )
  }
}

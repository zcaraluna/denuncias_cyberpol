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

// POST: Verificar las 5 respuestas y restablecer la contraseña
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { usuario, respuestas, nueva_contraseña } = body // respuestas: array de { pregunta, respuesta }

    if (!usuario || !respuestas || !Array.isArray(respuestas) || respuestas.length !== 5 || !nueva_contraseña) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    if (nueva_contraseña.length < 6) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const normalizedUser = usuario.trim().toLowerCase()

    // 1. Obtener las respuestas almacenadas y el ID del usuario
    const result = await pool.query(
      `SELECT p.pregunta, p.respuesta_hash, u.id, u.nombre, u.apellido, u.grado, u.oficina
       FROM preguntas_seguridad_usuarios p
       JOIN usuarios u ON p.usuario_id = u.id
       WHERE LOWER(u.usuario) = $1 AND u.activo = TRUE`,
      [normalizedUser]
    )

    if (result.rows.length < 5) {
      return NextResponse.json(
        { error: 'El usuario no tiene configuradas preguntas de seguridad o no está activo.' },
        { status: 404 }
      )
    }

    const dbRows = result.rows
    const userId = dbRows[0].id
    const userNombreCompleto = `${dbRows[0].grado} ${dbRows[0].nombre} ${dbRows[0].apellido} (${dbRows[0].oficina})`

    // 2. Verificar cada respuesta
    for (const r of respuestas) {
      // Buscar la pregunta en los registros de la BD
      const match = dbRows.find(
        (dbRow: any) => dbRow.pregunta.trim().toLowerCase() === r.pregunta.trim().toLowerCase()
      )

      if (!match) {
        return NextResponse.json(
          { error: 'Una de las preguntas respondidas no coincide con las configuradas.' },
          { status: 400 }
        )
      }

      const respuestaNormalizada = normalizarRespuesta(r.respuesta)
      const esCorrecta = await bcrypt.compare(respuestaNormalizada, match.respuesta_hash)

      if (!esCorrecta) {
        return NextResponse.json(
          { error: 'Una o más respuestas a las preguntas de seguridad son incorrectas.' },
          { status: 401 }
        )
      }
    }

    // 3. Si todas las respuestas son correctas, hashear y actualizar la contraseña en la BD
    const hashedPassword = await bcrypt.hash(nueva_contraseña, 10)

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Actualizar contraseña y quitar bloqueo de forzar cambio
      await client.query(
        'UPDATE usuarios SET contraseña = $1, debe_cambiar_contraseña = FALSE WHERE id = $2',
        [hashedPassword, userId]
      )

      // Registrar en la auditoría de usuarios
      const detalle = `Restablecimiento autónomo de contraseña realizado exitosamente por el usuario ${userNombreCompleto} mediante preguntas de seguridad.`
      await client.query(
        `INSERT INTO registro_auditoria_usuarios (usuario_realizador_id, usuario_afectado_id, accion, detalle)
         VALUES ($1, $2, $3, $4)`,
        [userId, userId, 'recuperacion_contraseña_preguntas', detalle]
      )

      await client.query('COMMIT')
    } catch (dbErr) {
      await client.query('ROLLBACK')
      throw dbErr
    } finally {
      client.release()
    }

    return NextResponse.json({ success: true, mensaje: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.' })

  } catch (error) {
    console.error('Error restableciendo contraseña por preguntas:', error)
    return NextResponse.json(
      { error: 'Error del servidor al restablecer la contraseña' },
      { status: 500 }
    )
  }
}

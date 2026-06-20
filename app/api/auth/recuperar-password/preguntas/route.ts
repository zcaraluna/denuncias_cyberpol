import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// GET: Obtener las preguntas de seguridad de un usuario, ordenadas aleatoriamente
export async function GET(request: NextRequest) {
  try {
    const usuarioStr = request.nextUrl.searchParams.get('usuario')

    if (!usuarioStr || usuarioStr.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre de usuario es requerido' }, { status: 400 })
    }

    const normalizedUser = usuarioStr.trim().toLowerCase()

    // Consultar las preguntas del usuario
    const result = await pool.query(
      `SELECT p.pregunta, u.rol 
       FROM preguntas_seguridad_usuarios p
       JOIN usuarios u ON p.usuario_id = u.id
       WHERE LOWER(u.usuario) = $1 AND u.activo = TRUE`,
      [normalizedUser]
    )

    // Por seguridad, si el usuario no existe o no tiene las 5 preguntas configuradas,
    // o es del rol 'visor', se devuelve un mensaje de error genérico idéntico en todos los casos.
    if (result.rows.length < 5 || result.rows[0].rol === 'visor') {
      return NextResponse.json(
        { error: 'El usuario no cuenta con preguntas de seguridad configuradas o no está activo.' },
        { status: 404 }
      )
    }

    const preguntas = result.rows.map((row: any) => row.pregunta)

    // Mezclar el orden de las preguntas de forma aleatoria (Algoritmo Fisher-Yates)
    const preguntasMezcladas = [...preguntas]
    for (let i = preguntasMezcladas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [preguntasMezcladas[i], preguntasMezcladas[j]] = [preguntasMezcladas[j], preguntasMezcladas[i]]
    }

    return NextResponse.json({ preguntas: preguntasMezcladas })

  } catch (error) {
    console.error('Error obteniendo preguntas de recuperación:', error)
    return NextResponse.json(
      { error: 'Error del servidor al obtener preguntas de seguridad' },
      { status: 500 }
    )
  }
}

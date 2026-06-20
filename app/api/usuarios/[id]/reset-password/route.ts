import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

const ROLE_WEIGHTS: Record<string, number> = {
  developer: 5,
  superadmin: 4,
  admin: 3,
  supervisor: 2,
  operador: 1,
  visor: 1
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const targetId = parseInt((await params).id)
    if (isNaN(targetId)) {
      return NextResponse.json({ error: 'ID de usuario inválido' }, { status: 400 })
    }

    // 1. Obtener la sesión del usuario realizador (desde la cookie)
    const usuarioCookie = request.cookies.get('usuario_sesion')?.value
    if (!usuarioCookie) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    let realizador: { id: number; rol: string; oficina: string; usuario: string; grado: string; nombre: string; apellido: string }
    try {
      realizador = JSON.parse(decodeURIComponent(usuarioCookie))
    } catch (e) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    const realizadorRol = realizador.rol
    const realizadorOficina = realizador.oficina
    const realizadorId = realizador.id

    // Operadores no pueden resetear ninguna contraseña
    if (realizadorRol === 'operador' || !ROLE_WEIGHTS[realizadorRol]) {
      return NextResponse.json({ error: 'Acción no autorizada' }, { status: 403 })
    }

    // 2. Obtener el usuario objetivo de la base de datos
    const targetResult = await pool.query(
      'SELECT id, usuario, nombre, apellido, grado, oficina, rol FROM usuarios WHERE id = $1',
      [targetId]
    )

    if (targetResult.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario objetivo no encontrado' }, { status: 404 })
    }

    const targetUser = targetResult.rows[0]

    // 3. Validar jerarquía: realizador debe tener jerarquía igual o mayor al objetivo
    const realizadorPeso = ROLE_WEIGHTS[realizadorRol] || 0
    const targetPeso = ROLE_WEIGHTS[targetUser.rol] || 0

    if (realizadorPeso < targetPeso) {
      return NextResponse.json({
        error: `No tienes permisos para restablecer la contraseña de un usuario con rol ${targetUser.rol}`
      }, { status: 403 })
    }

    // 4. Si el realizador es supervisor, debe pertenecer a la misma oficina
    if (realizadorRol === 'supervisor') {
      if (targetUser.oficina !== realizadorOficina) {
        return NextResponse.json({
          error: 'Solo puedes restablecer contraseñas de usuarios pertenecientes a tu misma oficina regional'
        }, { status: 403 })
      }
    }

    // 5. Obtener la nueva contraseña del body
    const body = await request.json()
    const { contraseña } = body

    if (!contraseña || contraseña.trim().length < 4) {
      return NextResponse.json({
        error: 'La nueva contraseña debe tener al menos 4 caracteres'
      }, { status: 400 })
    }

    // 6. Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(contraseña, 10)

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Actualizar contraseña y forzar cambio al iniciar sesión
      await client.query(
        'UPDATE usuarios SET contraseña = $1, debe_cambiar_contraseña = TRUE WHERE id = $2',
        [hashedPassword, targetId]
      )

      // Registrar la acción de auditoría
      const detalle = `Restauración de contraseña para ${targetUser.grado} ${targetUser.nombre} ${targetUser.apellido} (Usuario: ${targetUser.usuario}) efectuada por ${realizador.grado} ${realizador.nombre} ${realizador.apellido}.`
      await client.query(
        `INSERT INTO registro_auditoria_usuarios (usuario_realizador_id, usuario_afectado_id, accion, detalle)
         VALUES ($1, $2, $3, $4)`,
        [realizadorId, targetId, 'restauracion_contraseña', detalle]
      )

      await client.query('COMMIT')
    } catch (dbErr) {
      await client.query('ROLLBACK')
      throw dbErr
    } finally {
      client.release()
    }

    return NextResponse.json({
      success: true,
      mensaje: 'Contraseña restablecida exitosamente. El usuario deberá cambiarla en su próximo inicio de sesión.'
    })

  } catch (error) {
    console.error('Error restaurando contraseña:', error)
    return NextResponse.json(
      { error: 'Error del servidor al restablecer contraseña' },
      { status: 500 }
    )
  }
}

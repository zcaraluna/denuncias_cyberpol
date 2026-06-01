import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    const id = parseInt((await params).id)

    // 1. Obtener información de la denuncia para validar (incluyendo el hash)
    const denunciaResult = await client.query(
      `SELECT id, estado, hash, denunciante_id FROM denuncias WHERE id = $1`,
      [id]
    )

    if (denunciaResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return NextResponse.json(
        { error: 'Denuncia no encontrada' },
        { status: 404 }
      )
    }

    const denuncia = denunciaResult.rows[0]

    // Obtener el usuario autenticado desde la cookie de sesión
    const usuarioCookie = request.cookies.get('usuario_sesion')?.value
    let usuarioLogueado = null
    if (usuarioCookie) {
      try {
        usuarioLogueado = JSON.parse(decodeURIComponent(usuarioCookie))
      } catch (e) {
        console.error('Error al decodificar cookie de sesion:', e)
      }
    }

    // Solo permitir eliminar borradores, a menos que el usuario sea "garv"
    if (denuncia.estado !== 'borrador') {
      if (!usuarioLogueado || usuarioLogueado.usuario !== 'garv') {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: 'Acceso denegado. Solo el administrador "garv" puede eliminar denuncias completadas.' },
          { status: 403 }
        )
      }
    }

    // Si el usuario es "garv", eliminamos también el historial de la denuncia (ya que no tiene FK de cascada)
    if (usuarioLogueado && usuarioLogueado.usuario === 'garv' && denuncia.hash) {
      await client.query(
        'DELETE FROM historial_denuncias WHERE hash_denuncia = $1',
        [denuncia.hash]
      )
    }

    // 2. Eliminar supuestos autores relacionados
    await client.query(
      'DELETE FROM supuestos_autores WHERE denuncia_id = $1',
      [id]
    )

    // 3. Eliminar la denuncia
    await client.query(
      'DELETE FROM denuncias WHERE id = $1',
      [id]
    )

    // 4. Verificar si el denunciante tiene otras denuncias
    const otrasDenuncias = await client.query(
      'SELECT id FROM denuncias WHERE denunciante_id = $1',
      [denuncia.denunciante_id]
    )

    // Si no tiene otras denuncias, eliminar también el denunciante
    if (otrasDenuncias.rows.length === 0) {
      await client.query(
        'DELETE FROM denunciantes WHERE id = $1',
        [denuncia.denunciante_id]
      )
    }

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      message: 'Borrador eliminado correctamente'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error eliminando borrador:', error)
    return NextResponse.json(
      { error: 'Error al eliminar borrador' },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}


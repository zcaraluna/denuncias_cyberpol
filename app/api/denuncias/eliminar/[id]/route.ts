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

    // 1. Obtener información de la denuncia para validar
    const denunciaResult = await client.query(
      `SELECT id, estado, denunciante_id FROM denuncias WHERE id = $1`,
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

    // Solo permitir eliminar borradores
    if (denuncia.estado !== 'borrador') {
      await client.query('ROLLBACK')
      return NextResponse.json(
        { error: 'Solo se pueden eliminar borradores' },
        { status: 400 }
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


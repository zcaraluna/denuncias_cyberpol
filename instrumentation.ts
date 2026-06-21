export async function register() {
  // Solo ejecutar en el runtime de Node.js (no en Edge runtime ni en el cliente)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = await import('node-cron')
    const pool = (await import('@/lib/db')).default

    // Ejecutar cada hora para garantizar que ningún borrador
    // sobreviva más de ~25 horas desde su creación
    cron.schedule('0 * * * *', async () => {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        // Seleccionar borradores expirados (más de 24 horas desde su creación)
        // IMPORTANTE: solo toca registros con estado = 'borrador', jamás 'completada'
        // Adicionalmente se verifica que la orden sea negativa o nula (nunca mayor a 0)
        // para garantizar que no se borren denuncias que alguna vez fueron completadas
        const expiradosResult = await client.query(
          `SELECT id, denunciante_id
           FROM denuncias
           WHERE estado = 'borrador'
             AND (orden IS NULL OR orden < 1)
             AND creado_en < NOW() - INTERVAL '24 hours'`
        )

        let eliminados = 0

        for (const row of expiradosResult.rows) {
          // Eliminar supuestos autores (también lo elimina CASCADE, pero explícito por seguridad)
          await client.query(
            'DELETE FROM supuestos_autores WHERE denuncia_id = $1',
            [row.id]
          )

          // Eliminar la denuncia (denuncias_involucrados se elimina por CASCADE)
          await client.query(
            'DELETE FROM denuncias WHERE id = $1 AND estado = $2',
            [row.id, 'borrador']  // doble check: solo borradores
          )

          // Limpiar denunciante huérfano si ya no tiene ninguna denuncia asociada
          const otrasDenuncias = await client.query(
            'SELECT id FROM denuncias WHERE denunciante_id = $1 LIMIT 1',
            [row.denunciante_id]
          )
          if (otrasDenuncias.rows.length === 0) {
            await client.query(
              'DELETE FROM denunciantes WHERE id = $1',
              [row.denunciante_id]
            )
          }

          eliminados++
        }

        await client.query('COMMIT')

        if (eliminados > 0) {
          console.warn(`[Cron] Borradores con más de 24hs eliminados: ${eliminados}`)
        }
      } catch (error) {
        await client.query('ROLLBACK')
        console.error('[Cron] Error al limpiar borradores expirados:', error)
      } finally {
        client.release()
      }
    })

    console.warn('[Cron] Limpieza de borradores expirados programada (cada hora)')
  }
}

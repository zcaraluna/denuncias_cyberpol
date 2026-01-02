/**
 * Script para corregir el desfase de -24 horas en las fechas de denuncia
 * 
 * Este script suma 1 día a todas las fechas de denuncia completadas
 * para corregir el problema de timezone que causaba un desfase de -24 horas.
 * 
 * Uso:
 *   node scripts/corregir-fechas-denuncias.js
 * 
 * O con confirmación interactiva:
 *   node scripts/corregir-fechas-denuncias.js --interactive
 */

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Cargar variables de entorno desde .env.local o .env
const envPath = path.join(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath })
} else {
  require('dotenv').config()
}

const connectionString = process.env.DATABASE_URL || ''
const useSSL = connectionString.includes('sslmode=require') || connectionString.includes('ssl=true')

const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
})

async function corregirFechasDenuncias() {
  const isInteractive = process.argv.includes('--interactive') || process.argv.includes('-i')

  try {
    // Validar que DATABASE_URL esté configurado
    if (!process.env.DATABASE_URL) {
      console.error('❌ Error: DATABASE_URL no está configurado en .env.local')
      process.exit(1)
    }

    console.log('✅ Conectando a la base de datos...')
    
    // Probar conexión
    try {
      await pool.query('SELECT 1')
    } catch (connError) {
      console.error('❌ Error: No se pudo conectar a la base de datos')
      console.error('Verifica que PostgreSQL esté ejecutándose y que DATABASE_URL sea correcto')
      process.exit(1)
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Primero, obtener información sobre las denuncias que se van a corregir
      const result = await client.query(`
        SELECT 
          id,
          orden,
          fecha_denuncia,
          hora_denuncia,
          (fecha_denuncia + INTERVAL '1 day') as fecha_corregida,
          estado
        FROM denuncias 
        WHERE estado = 'completada'
        ORDER BY fecha_denuncia DESC, hora_denuncia DESC
        LIMIT 20
      `)

      if (result.rows.length === 0) {
        console.log('✅ No hay denuncias completadas para corregir.')
        await client.query('ROLLBACK')
        return
      }

      console.log('\n📋 Denuncias que se van a corregir (mostrando las últimas 20):\n')
      console.log('ID    | Orden | Fecha Actual      | Fecha Corregida  | Hora')
      console.log('------|-------|-------------------|------------------|-------')
      result.rows.forEach(row => {
        const fechaActual = new Date(row.fecha_denuncia).toISOString().split('T')[0]
        const fechaCorregida = new Date(row.fecha_corregida).toISOString().split('T')[0]
        console.log(
          `${String(row.id).padEnd(5)} | ${String(row.orden || 'N/A').padEnd(5)} | ${fechaActual} | ${fechaCorregida} | ${row.hora_denuncia || 'N/A'}`
        )
      })

      // Obtener el total de denuncias que se van a corregir
      const countResult = await client.query(`
        SELECT COUNT(*) as total
        FROM denuncias 
        WHERE estado = 'completada'
      `)

      const total = parseInt(countResult.rows[0].total)
      console.log(`\n📊 Total de denuncias completadas a corregir: ${total}`)

      if (isInteractive) {
        const readline = require('readline')
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        })

        const answer = await new Promise(resolve => {
          rl.question('\n⚠️  ¿Deseas continuar con la corrección? (s/n): ', resolve)
        })
        rl.close()

        if (answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'si' && answer.toLowerCase() !== 'sí' && answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
          console.log('❌ Operación cancelada.')
          await client.query('ROLLBACK')
          return
        }
      } else {
        console.log('\n⚠️  ATENCIÓN: Se van a corregir todas las fechas de denuncia completadas.')
        console.log('   Para confirmar manualmente, ejecuta con --interactive o -i\n')
      }

      // Ejecutar la corrección
      console.log('\n🔄 Corrigiendo fechas de denuncia...')
      const updateResult = await client.query(`
        UPDATE denuncias 
        SET fecha_denuncia = fecha_denuncia + INTERVAL '1 day'
        WHERE estado = 'completada'
      `)

      await client.query('COMMIT')

      console.log(`✅ ¡Corrección completada!`)
      console.log(`   Se corrigieron ${updateResult.rowCount} denuncias.`)
      console.log('\n📝 Nota: Las fechas de las denuncias ahora tienen 1 día sumado para corregir el desfase de timezone.\n')

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('❌ Error al corregir las fechas:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

corregirFechasDenuncias()

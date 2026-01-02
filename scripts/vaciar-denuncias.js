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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function vaciarDenuncias() {
  const client = await pool.connect()
  
  try {
    console.log('⚠️  ADVERTENCIA: Este script eliminará TODAS las denuncias y datos relacionados.')
    console.log('📋 Tablas que se vaciarán:')
    console.log('   - ampliaciones_denuncia')
    console.log('   - visitas_denuncias')
    console.log('   - denuncias_involucrados')
    console.log('   - supuestos_autores')
    console.log('   - historial_denuncias')
    console.log('   - denuncias')
    console.log('   - denunciantes (solo los que no tienen denuncias)')
    console.log('')
    
    await client.query('BEGIN')

    // Eliminar en orden para respetar las foreign keys
    // Las tablas con ON DELETE CASCADE se eliminarán automáticamente
    console.log('🗑️  Eliminando ampliaciones de denuncias...')
    await client.query('DELETE FROM ampliaciones_denuncia')
    
    console.log('🗑️  Eliminando visitas a denuncias...')
    await client.query('DELETE FROM visitas_denuncias')
    
    console.log('🗑️  Eliminando involucrados en denuncias...')
    await client.query('DELETE FROM denuncias_involucrados')
    
    console.log('🗑️  Eliminando supuestos autores...')
    await client.query('DELETE FROM supuestos_autores')
    
    console.log('🗑️  Eliminando historial de denuncias...')
    await client.query('DELETE FROM historial_denuncias')
    
    console.log('🗑️  Eliminando denuncias...')
    await client.query('DELETE FROM denuncias')
    
    console.log('🗑️  Eliminando denunciantes huérfanos (sin denuncias)...')
    // Eliminar denunciantes que ya no tienen denuncias asociadas
    await client.query(`
      DELETE FROM denunciantes 
      WHERE id NOT IN (
        SELECT DISTINCT denunciante_id 
        FROM denuncias 
        WHERE denunciante_id IS NOT NULL
      )
        AND id NOT IN (
          SELECT DISTINCT denunciante_id 
          FROM denuncias_involucrados 
          WHERE denunciante_id IS NOT NULL
        )
        AND id NOT IN (
          SELECT DISTINCT representa_denunciante_id 
          FROM denuncias_involucrados 
          WHERE representa_denunciante_id IS NOT NULL
        )
    `)
    
    // Resetear secuencias para que los IDs empiecen desde 1
    console.log('🔄 Reseteando secuencias...')
    await client.query('ALTER SEQUENCE IF EXISTS denuncias_id_seq RESTART WITH 1')
    await client.query('ALTER SEQUENCE IF EXISTS denunciantes_id_seq RESTART WITH 1')
    await client.query('ALTER SEQUENCE IF EXISTS supuestos_autores_id_seq RESTART WITH 1')
    await client.query('ALTER SEQUENCE IF EXISTS historial_denuncias_id_seq RESTART WITH 1')
    await client.query('ALTER SEQUENCE IF EXISTS visitas_denuncias_id_seq RESTART WITH 1')
    await client.query('ALTER SEQUENCE IF EXISTS denuncias_involucrados_id_seq RESTART WITH 1')
    await client.query('ALTER SEQUENCE IF EXISTS ampliaciones_denuncia_id_seq RESTART WITH 1')
    
    await client.query('COMMIT')
    
    // Verificar que se eliminaron todas
    const resultado = await client.query('SELECT COUNT(*) as total FROM denuncias')
    const total = resultado.rows[0].total
    
    console.log('')
    console.log('✅ ¡Proceso completado!')
    console.log(`📊 Total de denuncias restantes: ${total}`)
    
    if (total === '0') {
      console.log('✅ Base de datos vaciada correctamente. Todas las denuncias han sido eliminadas.')
    } else {
      console.log('⚠️  Advertencia: Aún quedan denuncias en la base de datos.')
    }
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Error vaciando denuncias:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Ejecutar el script
vaciarDenuncias()
  .then(() => {
    console.log('')
    console.log('👋 Script finalizado.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })


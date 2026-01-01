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

async function runMigration() {
  try {
    // Obtener el nombre del archivo de migración desde los argumentos
    const migrationFile = process.argv[2]
    
    if (!migrationFile) {
      console.error('❌ Error: Debes especificar el archivo de migración')
      console.error('Uso: node scripts/run-migration.js <nombre-archivo>')
      console.error('Ejemplo: node scripts/run-migration.js 007_add_ampliaciones_denuncia.sql')
      process.exit(1)
    }

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
    
    const migrationPath = path.join(__dirname, 'migrations', migrationFile)
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Error: No se encontró el archivo de migración: ${migrationPath}`)
      process.exit(1)
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log(`✅ Ejecutando migración: ${migrationFile}...`)
    await pool.query(migrationSQL)
    
    console.log(`\n✅ ¡Migración ${migrationFile} ejecutada exitosamente!`)
    
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error ejecutando migración:', error.message)
    if (error.code) {
      console.error('Código de error:', error.code)
    }
    if (error.detail) {
      console.error('Detalle:', error.detail)
    }
    await pool.end()
    process.exit(1)
  }
}

runMigration()








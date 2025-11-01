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

async function initDatabase() {
  try {
    // Validar que DATABASE_URL esté configurado
    if (!process.env.DATABASE_URL) {
      console.error('❌ Error: DATABASE_URL no está configurado en .env.local')
      console.error('Por favor, crea el archivo .env.local con:')
      console.error('DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@localhost:5432/cyberpol_db')
      process.exit(1)
    }

    // Validar formato básico de DATABASE_URL
    if (!process.env.DATABASE_URL.includes('@')) {
      console.error('❌ Error: DATABASE_URL tiene formato incorrecto')
      console.error('Formato esperado: postgresql://usuario:contraseña@host:puerto/base_datos')
      console.error('Tu DATABASE_URL actual:', process.env.DATABASE_URL)
      process.exit(1)
    }

    console.log('✅ Conectando a la base de datos...')
    
    // Probar conexión
    try {
      await pool.query('SELECT 1')
    } catch (connError) {
      console.error('❌ Error: No se pudo conectar a la base de datos')
      console.error('Verifica que:')
      console.error('  1. PostgreSQL esté ejecutándose')
      console.error('  2. La base de datos "cyberpol_db" exista')
      console.error('  3. La contraseña en DATABASE_URL sea correcta')
      console.error('Error:', connError.message)
      process.exit(1)
    }
    
    const schemaPath = path.join(__dirname, '../lib/db/schema.sql')
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Error: No se encontró el archivo schema.sql')
      process.exit(1)
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('✅ Ejecutando esquema de base de datos...')
    await pool.query(schema)
    
    console.log('Base de datos inicializada correctamente')
    
    // Crear usuarios de ejemplo si no existen
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const usuariosEjemplo = [
      { usuario: 'superadmin', nombre: 'Super', apellido: 'Administrador', grado: 'Superintendente', oficina: 'Asunción', rol: 'superadmin' },
      { usuario: 'admin', nombre: 'Administrador', apellido: 'Sistema', grado: 'Comisario', oficina: 'Asunción', rol: 'admin' },
      { usuario: 'operador', nombre: 'Operador', apellido: 'Test', grado: 'Inspector', oficina: 'Asunción', rol: 'operador' },
      { usuario: 'supervisor', nombre: 'Supervisor', apellido: 'Test', grado: 'Subcomisario', oficina: 'Asunción', rol: 'supervisor' }
    ]
    
    for (const userData of usuariosEjemplo) {
      try {
        await pool.query(
          `INSERT INTO usuarios (usuario, contraseña, nombre, apellido, grado, oficina, rol)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (usuario) DO NOTHING`,
          [userData.usuario, hashedPassword, userData.nombre, userData.apellido, userData.grado, userData.oficina, userData.rol]
        )
      } catch (error) {
        if (error.code !== '23505') { // 23505 es unique_violation
          console.error(`Error creando usuario ${userData.usuario}:`, error.message)
        }
      }
    }
    
    console.log('Usuarios de ejemplo creados')
    
    console.log('\n✅ ¡Base de datos inicializada exitosamente!')
    console.log('\nCredenciales de acceso (todos con contraseña: admin123):')
    console.log('   Superadmin: superadmin')
    console.log('   Admin: admin')
    console.log('   Operador: operador')
    console.log('   Supervisor: supervisor')
    console.log('\nAhora puedes ejecutar: npm run dev\n')
    
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error inicializando base de datos:', error.message)
    if (error.code) {
      console.error('Código de error:', error.code)
    }
    await pool.end()
    process.exit(1)
  }
}

initDatabase()


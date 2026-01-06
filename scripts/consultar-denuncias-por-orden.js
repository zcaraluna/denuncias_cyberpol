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

async function consultarDenunciasPorOrden(ordenes) {
  try {
    console.log('✅ Conectando a la base de datos...\n')
    
    const placeholders = ordenes.map((_, index) => `$${index + 1}`).join(', ')
    
    const query = `
      SELECT 
        d.id,
        d.orden,
        d.fecha_denuncia,
        d.hora_denuncia,
        d.tipo_denuncia,
        d.estado,
        den.nombres as nombre_denunciante,
        den.cedula as cedula_denunciante,
        den.tipo_documento,
        den.nacionalidad
      FROM denuncias d
      JOIN denunciantes den ON d.denunciante_id = den.id
      WHERE d.orden IN (${placeholders})
        AND EXTRACT(YEAR FROM d.fecha_denuncia) = 2026
      ORDER BY d.orden
    `
    
    const result = await pool.query(query, ordenes)
    
    if (result.rows.length === 0) {
      console.log('❌ No se encontraron denuncias con esos números de orden.\n')
      return
    }
    
    console.log('📋 Denuncias encontradas:\n')
    console.log('═'.repeat(100))
    console.log(
      'Orden'.padEnd(10) +
      'Fecha'.padEnd(15) +
      'Hora'.padEnd(10) +
      'Denunciante'.padEnd(35) +
      'Cédula'.padEnd(15) +
      'Tipo'
    )
    console.log('═'.repeat(100))
    
    result.rows.forEach((row) => {
      const fecha = row.fecha_denuncia 
        ? new Date(row.fecha_denuncia).toLocaleDateString('es-ES')
        : 'N/A'
      
      console.log(
        `${row.orden}/2026`.padEnd(10) +
        fecha.padEnd(15) +
        (row.hora_denuncia || 'N/A').padEnd(10) +
        (row.nombre_denunciante || 'N/A').padEnd(35) +
        `${row.cedula_denunciante || 'N/A'} (${row.tipo_documento || 'N/A'})`.padEnd(15) +
        (row.tipo_denuncia || 'N/A')
      )
    })
    
    console.log('═'.repeat(100))
    console.log(`\n📊 Total: ${result.rows.length} denuncia(s) encontrada(s)\n`)
    
    // Mostrar detalles adicionales
    console.log('\n📝 Detalles por denuncia:\n')
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. Orden ${row.orden}/2026`)
      console.log(`   - ID: ${row.id}`)
      console.log(`   - Fecha: ${row.fecha_denuncia ? new Date(row.fecha_denuncia).toLocaleDateString('es-ES') : 'N/A'} ${row.hora_denuncia || ''}`)
      console.log(`   - Denunciante: ${row.nombre_denunciante || 'N/A'}`)
      console.log(`   - Cédula: ${row.cedula_denunciante || 'N/A'} (${row.tipo_documento || 'N/A'})`)
      console.log(`   - Nacionalidad: ${row.nacionalidad || 'N/A'}`)
      console.log(`   - Tipo de denuncia: ${row.tipo_denuncia || 'N/A'}`)
      console.log(`   - Estado: ${row.estado || 'N/A'}`)
      console.log('')
    })
    
    return result.rows
  } catch (error) {
    console.error('❌ Error consultando denuncias:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Ejecutar la consulta
const ordenes = [17, 18, 29]

console.log('🔍 Consultando denuncias:')
ordenes.forEach(orden => console.log(`   - ${orden}/2026`))
console.log('')

consultarDenunciasPorOrden(ordenes)
  .then(() => {
    console.log('✅ Consulta completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })


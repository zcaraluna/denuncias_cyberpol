const { Pool } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function generarCodigoActivacion(diasExpiracion = 30) {
  try {
    // Validar que DATABASE_URL esté configurado
    if (!process.env.DATABASE_URL) {
      console.error('❌ Error: DATABASE_URL no está configurado en .env.local');
      process.exit(1);
    }

    console.log('✅ Conectando a la base de datos...');

    // Probar conexión
    try {
      await pool.query('SELECT 1');
    } catch (connError) {
      console.error('❌ Error: No se pudo conectar a la base de datos');
      console.error('Verifica que PostgreSQL esté ejecutándose y que DATABASE_URL sea correcto');
      process.exit(1);
    }

    // Generar código aleatorio seguro (32 caracteres hexadecimales)
    const codigo = crypto.randomBytes(16).toString('hex').toUpperCase();
    
    // Formatear código para mejor legibilidad al mostrarlo (ej: ABCD-1234-EFGH-5678-1234-5678-ABCD-EFGH)
    const codigoFormateado = codigo.match(/.{1,4}/g).join('-');

    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + diasExpiracion);

    // Insertar código en la base de datos (sin guiones, normalizado)
    // Esto permite que el usuario ingrese el código con o sin guiones
    await pool.query(
      'INSERT INTO codigos_activacion (codigo, expira_en) VALUES ($1, $2)',
      [codigo, fechaExpiracion]
    );

    console.log('\n✅ ¡Código de activación generado exitosamente!');
    console.log('\n📋 Detalles del código:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Código:        ${codigoFormateado}`);
    console.log(`                ${codigo} (sin guiones también válido)`);
    console.log(`Expira en:     ${fechaExpiracion.toLocaleDateString('es-PY')}`);
    console.log(`Días válido:   ${diasExpiracion}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   • Este código solo puede ser usado UNA VEZ');
    console.log('   • Guárdalo de forma segura');
    console.log('   • Compártelo solo con quien necesita autorizar un dispositivo');
    console.log('   • El usuario debe ingresarlo en: /autenticar');
    console.log('   • Puede ingresarse con o sin guiones\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error generando código de activación:', error.message);
    if (error.code) {
      console.error('Código de error:', error.code);
    }
    if (error.detail) {
      console.error('Detalle:', error.detail);
    }
    await pool.end();
    process.exit(1);
  }
}

// Obtener días de expiración desde argumentos (opcional)
const diasExpiracion = process.argv[2] ? parseInt(process.argv[2]) : 30;

if (isNaN(diasExpiracion) || diasExpiracion < 1) {
  console.error('❌ Error: Los días de expiración deben ser un número positivo');
  console.error('Uso: node scripts/generar-codigo-activacion.js [dias_expiracion]');
  console.error('Ejemplo: node scripts/generar-codigo-activacion.js 30');
  process.exit(1);
}

generarCodigoActivacion(diasExpiracion);


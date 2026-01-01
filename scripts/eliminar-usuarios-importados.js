const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Cargar variables de entorno desde .env.local o .env
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

const connectionString = process.env.DATABASE_URL || '';
const useSSL = connectionString.includes('sslmode=require') || connectionString.includes('ssl=true');

const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

// Credenciales de los usuarios importados (del output anterior)
const credencialesImportadas = [
  '54477', '55968', '59604', '55986', '57289', '57339',
  '63118', '54899', '71036', '44531', '60371', '73855',
  '73910', '58794', '64215', '41616', '44253', '57239',
  '68978', '58505', '54506', '58616', '58158', '46422',
  '56007', '57540', '58589', '62608', '63147', '58888',
  '55865', '62150', '50317', '55568', '58534'
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function pregunta(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function eliminarUsuariosImportados() {
  try {
    console.log('🔍 Buscando usuarios importados del Excel...\n');

    // Buscar usuarios por credenciales
    const placeholders = credencialesImportadas.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(
      `SELECT id, usuario, nombre, apellido, grado, oficina, rol, creado_en 
       FROM usuarios 
       WHERE usuario IN (${placeholders})
       ORDER BY id`,
      credencialesImportadas
    );

    if (result.rows.length === 0) {
      console.log('✅ No se encontraron usuarios importados para eliminar.');
      await pool.end();
      rl.close();
      process.exit(0);
    }

    console.log(`📋 Se encontraron ${result.rows.length} usuarios importados:\n`);
    console.log('='.repeat(100));
    console.log('ID  | Usuario  | Nombre                | Apellido              | Grado                | Oficina   | Rol      ');
    console.log('='.repeat(100));
    
    result.rows.forEach((user) => {
      const id = String(user.id).padEnd(4);
      const usuario = String(user.usuario).padEnd(8);
      const nombre = String(user.nombre || '').substring(0, 20).padEnd(21);
      const apellido = String(user.apellido || '').substring(0, 20).padEnd(21);
      const grado = String(user.grado || '').substring(0, 20).padEnd(21);
      const oficina = String(user.oficina || '').substring(0, 9).padEnd(10);
      const rol = String(user.rol || '').substring(0, 8).padEnd(9);
      
      console.log(`${id} | ${usuario} | ${nombre} | ${apellido} | ${grado} | ${oficina} | ${rol}`);
    });
    
    console.log('='.repeat(100));
    console.log(`\n⚠️  ADVERTENCIA: Se eliminarán ${result.rows.length} usuarios permanentemente.\n`);

    // Pedir confirmación
    const respuesta = await pregunta('¿Estás seguro de que quieres eliminar estos usuarios? (escribe "SI" para confirmar): ');
    
    if (respuesta.trim().toUpperCase() !== 'SI') {
      console.log('\n❌ Operación cancelada. No se eliminó ningún usuario.');
      await pool.end();
      rl.close();
      process.exit(0);
    }

    console.log('\n🔄 Eliminando usuarios...\n');

    // Eliminar usuarios
    const deleteResult = await pool.query(
      `DELETE FROM usuarios 
       WHERE usuario IN (${placeholders})`,
      credencialesImportadas
    );

    console.log(`✅ Se eliminaron ${deleteResult.rowCount} usuarios exitosamente.`);
    console.log('\n📝 Ahora puedes ejecutar el script de importación nuevamente con los datos correctos:');
    console.log('   npm run importar-usuarios\n');

    await pool.end();
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error eliminando usuarios:', error.message);
    if (error.code) {
      console.error('Código de error:', error.code);
    }
    if (error.detail) {
      console.error('Detalle:', error.detail);
    }
    await pool.end();
    rl.close();
    process.exit(1);
  }
}

eliminarUsuariosImportados();


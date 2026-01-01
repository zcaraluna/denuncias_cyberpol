const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const path = require('path');
const { Pool } = require('pg');
const fs = require('fs');

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

async function importarUsuariosDesdeExcel() {
  try {
    const archivoExcel = path.join(__dirname, '../Libro1.xlsx');
    console.log('📖 Leyendo archivo Excel:', archivoExcel);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(archivoExcel);

    // Obtener la primera hoja
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      console.error('❌ Error: No se encontró ninguna hoja en el archivo Excel');
      process.exit(1);
    }

    console.log(`📊 Hoja encontrada: ${worksheet.name}`);
    console.log(`📏 Total de filas: ${worksheet.rowCount}`);

    // Encontrar la columna "Credencial"
    let columnaCredencial = null;
    const primeraFila = worksheet.getRow(1);
    
    primeraFila.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const valor = cell.value?.toString().trim();
      if (valor && (valor.toLowerCase() === 'credencial' || valor.toLowerCase() === 'credential')) {
        columnaCredencial = colNumber;
        console.log(`✅ Columna "Credencial" encontrada en la columna ${colNumber}`);
      }
    });

    if (!columnaCredencial) {
      console.error('❌ Error: No se encontró la columna "Credencial" en el archivo Excel');
      console.log('Columnas encontradas en la primera fila:');
      primeraFila.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        console.log(`  Columna ${colNumber}: "${cell.value}"`);
      });
      process.exit(1);
    }

    // Leer todas las credenciales
    const credenciales = [];
    let filasProcesadas = 0;
    let filasConError = 0;

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      // Saltar la primera fila (encabezados)
      if (rowNumber === 1) return;

      const celdaCredencial = row.getCell(columnaCredencial);
      const credencial = celdaCredencial.value?.toString().trim();

      if (credencial && credencial.length > 0) {
        credenciales.push(credencial);
        filasProcesadas++;
      } else {
        filasConError++;
      }
    });

    console.log(`\n📋 Credenciales encontradas: ${credenciales.length}`);
    console.log(`✅ Filas procesadas: ${filasProcesadas}`);
    if (filasConError > 0) {
      console.log(`⚠️  Filas con error o vacías: ${filasConError}`);
    }

    if (credenciales.length === 0) {
      console.error('❌ Error: No se encontraron credenciales válidas en el archivo');
      process.exit(1);
    }

    // Mostrar algunas credenciales como ejemplo
    console.log('\n🔍 Primeras credenciales encontradas:');
    credenciales.slice(0, 5).forEach((cred, index) => {
      console.log(`  ${index + 1}. ${cred}`);
    });
    if (credenciales.length > 5) {
      console.log(`  ... y ${credenciales.length - 5} más`);
    }

    // Confirmar antes de continuar
    console.log('\n⚠️  ADVERTENCIA: Se crearán usuarios con los siguientes datos:');
    console.log('   - Usuario: (valor de Credencial)');
    console.log('   - Contraseña por defecto: "operador123"');
    console.log('   - Oficina: "Asunción"');
    console.log('   - Rol: "operador"');
    console.log('   - Nombre y Apellido: (se extraerá del valor de Credencial si es posible)');
    console.log('   - Grado: "No especificado"');
    console.log(`\n📝 Total de usuarios a crear: ${credenciales.length}`);

    // Crear usuarios en la base de datos
    console.log('\n🔄 Iniciando importación de usuarios...\n');

    const contraseñaPorDefecto = 'operador123';
    const hashedPassword = await bcrypt.hash(contraseñaPorDefecto, 10);
    const oficina = 'Asunción';
    const rol = 'operador';
    const grado = 'No especificado';

    let usuariosCreados = 0;
    let usuariosExistentes = 0;
    let errores = 0;

    for (const credencial of credenciales) {
      try {
        // Intentar extraer nombre y apellido de la credencial si tiene formato especial
        // Por ahora, usar la credencial como nombre completo
        let nombre = credencial;
        let apellido = '';

        // Si la credencial tiene espacios, usar la primera parte como nombre y el resto como apellido
        const partes = credencial.split(' ').filter(p => p.length > 0);
        if (partes.length >= 2) {
          nombre = partes[0];
          apellido = partes.slice(1).join(' ');
        } else {
          nombre = credencial;
          apellido = '';
        }

        // Insertar usuario (debe_cambiar_contraseña se establece a TRUE para usuarios nuevos)
        const result = await pool.query(
          `INSERT INTO usuarios (usuario, contraseña, nombre, apellido, grado, oficina, rol, debe_cambiar_contraseña)
           VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
           ON CONFLICT (usuario) DO NOTHING
           RETURNING id, usuario`,
          [credencial, hashedPassword, nombre, apellido || 'Usuario', grado, oficina, rol]
        );

        if (result.rows.length > 0) {
          usuariosCreados++;
          console.log(`✅ Usuario creado: ${credencial} (ID: ${result.rows[0].id})`);
        } else {
          usuariosExistentes++;
          console.log(`⏭️  Usuario ya existe: ${credencial}`);
        }
      } catch (error) {
        errores++;
        console.error(`❌ Error creando usuario "${credencial}":`, error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE IMPORTACIÓN');
    console.log('='.repeat(50));
    console.log(`✅ Usuarios creados: ${usuariosCreados}`);
    console.log(`⏭️  Usuarios ya existentes: ${usuariosExistentes}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📝 Total procesados: ${credenciales.length}`);
    console.log('\n🔑 Contraseña por defecto para todos los usuarios: operador123');
    console.log('⚠️  Los usuarios deberán cambiar su contraseña en su primer inicio de sesión.\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la importación:', error);
    await pool.end();
    process.exit(1);
  }
}

importarUsuariosDesdeExcel();


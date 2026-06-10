const ExcelJS = require('exceljs');
const path = require('path');
const { Pool } = require('pg');
const fs = require('fs');

// Cargar variables de entorno desde .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

const connectionString = process.env.DATABASE_URL || '';
const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
const isSSLDisabled = connectionString.includes('sslmode=disable');
const sslConfig = (isLocal || isSSLDisabled) ? false : { rejectUnauthorized: false };

const pool = new Pool({
  connectionString,
  ssl: sslConfig,
});

async function exportarUsuarios() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    const queryResult = await pool.query(`
      SELECT u.*, COUNT(d.id)::integer AS cantidad_denuncias
      FROM usuarios u
      LEFT JOIN denuncias d ON u.id = d.usuario_id
      GROUP BY u.id
      ORDER BY u.id ASC
    `);
    
    if (queryResult.rows.length === 0) {
      console.log('⚠️ No se encontraron usuarios en la base de datos.');
      await pool.end();
      return;
    }

    console.log(`✅ Se obtuvieron ${queryResult.rows.length} usuarios.`);
    
    // Obtener campos de la tabla dinámica
    const fields = queryResult.fields.map(f => f.name);
    console.log('📋 Columnas detectadas en la tabla:', fields);

    // Filtrar columnas sensibles (contraseña/password)
    const columnsToExport = fields.filter(col => 
      col.toLowerCase() !== 'contraseña' && 
      col.toLowerCase() !== 'contrasena' && 
      col.toLowerCase() !== 'password'
    );
    console.log('✨ Columnas a exportar (excluyendo datos sensibles):', columnsToExport);

    // Crear el libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Usuarios de SIDE');

    // Configurar columnas de la hoja con nombres amigables
    worksheet.columns = columnsToExport.map(col => {
      let headerName = col.replace(/_/g, ' ').toUpperCase();
      if (col === 'cantidad_denuncias') {
        headerName = 'CANTIDAD DE DENUNCIAS';
      }
      return {
        header: headerName,
        key: col,
        width: 20
      };
    });

    // Aplicar estilos a la cabecera
    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF002147' } // Navy Blue del sistema SIDE
      };
      cell.font = {
        name: 'Segoe UI',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF000000' } }
      };
    });

    // Agregar datos de usuarios
    queryResult.rows.forEach((row) => {
      const rowData = {};
      columnsToExport.forEach(col => {
        let val = row[col];
        // Formatear fechas para mejor visualización a dd-mm-aaaa hh:mm:ss
        if (val instanceof Date) {
          const d = String(val.getDate()).padStart(2, '0');
          const m = String(val.getMonth() + 1).padStart(2, '0');
          const y = val.getFullYear();
          const hh = String(val.getHours()).padStart(2, '0');
          const mm = String(val.getMinutes()).padStart(2, '0');
          const ss = String(val.getSeconds()).padStart(2, '0');
          val = `${d}-${m}-${y} ${hh}:${mm}:${ss}`;
        }
        // Formatear booleanos en español
        if (typeof val === 'boolean') {
          val = val ? 'SÍ' : 'NO';
        }
        rowData[col] = val;
      });
      worksheet.addRow(rowData);
    });

    // Estilizar las celdas de datos
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Saltar cabecera
      
      row.height = 20;
      
      // Alternar color de fila para legibilidad (zebra striping)
      const isEven = rowNumber % 2 === 0;
      const fill = isEven ? {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF9FAFB' }
      } : null;

      row.eachCell((cell) => {
        cell.font = {
          name: 'Segoe UI',
          size: 10
        };
        
        // Alinear números a la derecha y texto a la izquierda
        const isNum = typeof cell.value === 'number';
        cell.alignment = {
          vertical: 'middle',
          horizontal: isNum ? 'right' : 'left'
        };

        if (fill) cell.fill = fill;
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });
    });

    // Auto-ajustar el ancho de las columnas según su contenido
    worksheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const val = cell.value ? cell.value.toString() : '';
        if (val.length > maxLen) {
          maxLen = val.length;
        }
      });
      column.width = Math.max(maxLen + 4, 15);
    });

    // Guardar el archivo Excel en el directorio raíz del proyecto
    const outputPath = path.join(__dirname, '../usuarios_sistema.xlsx');
    await workbook.xlsx.writeFile(outputPath);
    console.log(`\n🎉 Archivo Excel creado con éxito en: ${outputPath}`);

    await pool.end();
  } catch (error) {
    console.error('❌ Error durante la exportación a Excel:', error);
    await pool.end();
  }
}

exportarUsuarios();

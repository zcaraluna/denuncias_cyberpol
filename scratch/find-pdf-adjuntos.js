const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function main() {
  console.log("🔍 Buscando denuncias con archivos PDF como adjuntos...");
  try {
    const query = `
      SELECT 
        d.id, 
        d.orden, 
        d.fecha_denuncia, 
        d.tipo_denuncia, 
        den.nombres as den_nombres, 
        den.cedula as den_cedula,
        d.adjuntos_urls
      FROM denuncias d
      LEFT JOIN denunciantes den ON d.denunciante_id = den.id
      WHERE d.adjuntos_urls IS NOT NULL 
        AND cardinality(d.adjuntos_urls) > 0
    `;

    const result = await pool.query(query);

    const matchDenuncias = [];

    for (const row of result.rows) {
      const pdfAdjuntos = row.adjuntos_urls.filter(url => {
        if (!url) return false;
        try {
          const urlObj = new URL(url);
          return urlObj.pathname.toLowerCase().endsWith('.pdf');
        } catch (e) {
          return url.toLowerCase().includes('.pdf');
        }
      });

      if (pdfAdjuntos.length > 0) {
        matchDenuncias.push({
          id: row.id,
          orden: row.orden,
          fecha: row.fecha_denuncia,
          tipo: row.tipo_denuncia,
          denunciante: row.den_nombres || 'Desconocido',
          cedula: row.den_cedula || 'N/A',
          pdfFiles: pdfAdjuntos
        });
      }
    }

    if (matchDenuncias.length > 0) {
      console.log(`\n✅ Se encontraron ${matchDenuncias.length} denuncias con PDFs adjuntos:\n`);
      matchDenuncias.forEach(d => {
        console.log(`- ID: ${d.id} (Orden: ${d.orden || 'N/A'})`);
        console.log(`  Fecha: ${d.fecha ? new Date(d.fecha).toLocaleDateString() : 'N/A'}`);
        console.log(`  Denunciante: ${d.denunciante} (C.I.: ${d.cedula})`);
        console.log(`  Tipo: ${d.tipo || 'N/A'}`);
        console.log(`  Archivos PDF adjuntos:`);
        d.pdfFiles.forEach(file => {
          console.log(`    * ${file}`);
        });
        console.log(`-------------------------------------------------------------------`);
      });
    } else {
      console.log('ℹ️ No se encontraron denuncias con archivos PDF como adjuntos.');
    }

  } catch (error) {
    console.error("❌ Error en la base de datos:", error.message || error);
  } finally {
    await pool.end();
  }
}

main();

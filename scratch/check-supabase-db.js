process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgres://postgres.assahvgvcepcbijzjxwj:u9i1jHQW9Xj0mo4J@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require",
  ssl: false
});

async function main() {
  console.log("🔍 Buscando denuncia de CI 5137785 en Supabase...");
  try {
    const query = `
      SELECT 
        d.id, 
        d.orden, 
        d.fecha_denuncia, 
        d.tipo_denuncia, 
        den.nombres as den_nombres, 
        den.cedula as den_cedula,
        d.archivo_denuncia_url,
        d.adjuntos_urls
      FROM denuncias d
      LEFT JOIN denunciantes den ON d.denunciante_id = den.id
      WHERE den.cedula = '5137785'
    `;

    const result = await pool.query(query);

    if (result.rows.length > 0) {
      console.log(`✅ Encontrada(s) ${result.rows.length} denuncia(s) en Supabase:`);
      result.rows.forEach(row => {
        console.log(`ID: ${row.id}`);
        console.log(`Orden: ${row.orden}`);
        console.log(`Denunciante: ${row.den_nombres}`);
        console.log(`C.I.: ${row.den_cedula}`);
        console.log(`archivo_denuncia_url: ${row.archivo_denuncia_url}`);
        console.log(`adjuntos_urls:`, row.adjuntos_urls);
        console.log(`-----------------------------------------`);
      });
    } else {
      console.log("❌ No se encontró ninguna denuncia para el CI 5137785 en Supabase.");
    }
  } catch (error) {
    console.error("❌ Error en Supabase:", error.message || error);
  } finally {
    await pool.end();
  }
}

main();

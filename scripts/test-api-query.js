const pool = require('../lib/db').default;

async function testApiQuery() {
    try {
        console.log('Testing connection from lib/db.ts...');
        const res = await pool.query('SELECT current_database(), current_user');
        console.log('Connected to:', res.rows[0]);

        console.log('Attempting to query denuncia_firmas...');
        const result = await pool.query(
            'SELECT rol, usado, fecha_uso FROM denuncia_firmas LIMIT 1'
        );
        console.log('Success! Result:', result.rows);
        await pool.end();
    } catch (err) {
        console.error('FAILED TO QUERY denuncia_firmas:');
        console.error(err);
        process.exit(1);
    }
}

testApiQuery();

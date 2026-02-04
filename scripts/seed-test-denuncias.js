const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function seed() {
    const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

    if (!connectionString) {
        console.error('Error: No se encontró POSTGRES_URL o POSTGRES_URL_NON_POOLING en el .env');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Conectado a la base de datos');

        // Obtener detalles del usuario garv
        const userRes = await client.query("SELECT id, oficina, grado, nombre, apellido FROM usuarios WHERE usuario = 'garv' LIMIT 1");
        if (userRes.rows.length === 0) {
            throw new Error('Usuario garv no encontrado');
        }
        const user = userRes.rows[0];

        // Obtener un denunciante existente
        const denuncianteRes = await client.query("SELECT id FROM denunciantes LIMIT 1");
        if (denuncianteRes.rows.length === 0) {
            throw new Error('No hay denunciantes en la tabla');
        }
        const denuncianteId = denuncianteRes.rows[0].id;

        const scenarios = [
            {
                tipo: 'HURTO AGRAVADO',
                autor: { conocido: 'Conocido', nombre: 'JUAN PÉREZ', ci: '1.234.567', dom: 'Asunción, Calle Palma 123' },
                extra: 'Autor conocido con datos completos'
            },
            {
                tipo: 'ROBO',
                autor: { conocido: 'Conocido', nombre: 'MARCO POLO' },
                extra: 'Autor conocido solo nombre'
            },
            {
                tipo: 'ESTAFA',
                autor: {
                    conocido: 'Desconocido',
                    desc: { sexo: 'Masculino', altura: '1.80m', complexion: 'Atlética', tonoPiel: 'Trigueña', colorCabello: 'Negro', colorOjos: 'Marrones' }
                },
                extra: 'Autor desconocido con descripción completa (JSON)'
            },
            {
                tipo: 'HOMICIDIO DOLOSO',
                autor: { conocido: 'Desconocido', desc: 'Sujeto de estatura media, remera roja' },
                extra: 'Autor desconocido con descripción tipo texto'
            },
            {
                tipo: 'COACCIÓN SEXUAL Y VIOLACIÓN',
                autor: { conocido: 'Desconocido', desc: '' },
                extra: 'Autor desconocido sin descripción'
            },
            {
                tipo: 'EXTRAVÍO DE OBJETOS VARIOS',
                autor: { conocido: 'No aplica' },
                extra: 'Autor No Aplica (sección omitida)'
            },
            {
                tipo: 'AMENAZA DE HECHOS PUNIBLES',
                autor: { conocido: 'Conocido', nombre: 'LUIS CASCO', ci: '2.000.000' },
                rango: true,
                extra: 'Rango de fechas + Autor conocido parcial'
            },
            {
                tipo: 'DAÑO',
                autor: { conocido: 'No aplica' },
                lugarNoAplica: true,
                extra: 'Lugar No Aplica + Autor No Aplica'
            },
            {
                tipo: 'FALSIFICACIÓN DE MONEDA',
                multipleAutores: [
                    { conocido: 'Conocido', nombre: 'AUTOR UNO', ci: '111' },
                    { conocido: 'Desconocido', desc: { sexo: 'Masculino' } }
                ],
                extra: 'Múltiples autores mixtos'
            },
            {
                tipo: 'LESION',
                autor: { conocido: 'Conocido', nombre: 'SOLO CI', ci: '999.888' },
                extra: 'Autor conocido solo CI'
            }
        ];

        for (let i = 0; i < scenarios.length; i++) {
            const sc = scenarios[i];
            const orden = 900 + i;

            console.log(`Insertando denuncia ${orden}: ${sc.extra}`);

            const resDenuncia = await client.query(
                `INSERT INTO denuncias (
                    denunciante_id, fecha_denuncia, hora_denuncia, fecha_hecho, hora_hecho, 
                    fecha_hecho_fin, hora_hecho_fin, tipo_denuncia, 
                    relato, lugar_hecho, orden, usuario_id, oficina, 
                    operador_grado, operador_nombre, operador_apellido, estado, hash
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING id`,
                [
                    denuncianteId,
                    new Date(), // fecha_denuncia
                    '10:00',    // hora_denuncia
                    new Date('2026-02-01'), // fecha_hecho
                    '08:00',    // hora_hecho
                    sc.rango ? new Date('2026-02-02') : null,
                    sc.rango ? '18:00' : null,
                    sc.tipo,
                    'Relato de prueba para la denuncia ' + orden + ': ' + sc.extra,
                    sc.lugarNoAplica ? '' : 'DIRECCIÓN DE PRUEBA ' + orden,
                    orden,
                    user.id,
                    user.oficina,
                    user.grado,
                    user.nombre,
                    user.apellido,
                    'completada',
                    'hash-' + orden
                ]
            );

            const denunciaId = resDenuncia.rows[0].id;

            if (sc.multipleAutores) {
                for (const a of sc.multipleAutores) {
                    await client.query(
                        `INSERT INTO supuestos_autores (
                            denuncia_id, autor_conocido, nombre_autor, cedula_autor, descripcion_fisica
                        ) VALUES ($1, $2, $3, $4, $5)`,
                        [denunciaId, a.conocido, a.nombre || null, a.ci || null, a.desc ? JSON.stringify(a.desc) : null]
                    );
                }
            } else if (sc.autor && sc.autor.conocido !== 'No aplica') {
                await client.query(
                    `INSERT INTO supuestos_autores (
                        denuncia_id, autor_conocido, nombre_autor, cedula_autor, domicilio_autor, descripcion_fisica
                    ) VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        denunciaId,
                        sc.autor.conocido,
                        sc.autor.nombre || null,
                        sc.autor.ci || null,
                        sc.autor.dom || null,
                        sc.autor.desc ? (typeof sc.autor.desc === 'string' ? sc.autor.desc : JSON.stringify(sc.autor.desc)) : null
                    ]
                );
            }
        }

        console.log('Finalizado con éxito');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

seed();

#!/usr/bin/env node
/**
 * Verificación de preparación para un nuevo nodo (p. ej. Ciudad del Este).
 *
 * SOLO LECTURA: este script no modifica, elimina ni escribe nada en la base de
 * datos. Ejecuta únicamente consultas SELECT para confirmar que la estructura
 * crítica está lista antes de liberar un nodo.
 *
 * Uso:  node scripts/verificar-preparacion-nodo.js
 * Requiere DATABASE_URL (o POSTGRES_URL) en el entorno / .env.
 */

require('dotenv').config()
const { Pool } = require('pg')

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
const pool = new Pool({
  connectionString: connectionString.replace('sslmode=require', 'sslmode=disable'),
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 1,
})

// Oficinas canónicas esperadas (debe coincidir con ACTIVE_OFFICES en lib/data/oficinas.ts).
const OFICINAS_CANONICAS = [
  'Asunción',
  'Ciudad del Este',
  'Encarnación',
  'Loma Pytã',
  'Pedro Juan Caballero',
]

let hayAdvertencias = false
let hayErrores = false

const ok = (msg) => console.log(`  ✓ ${msg}`)
const warn = (msg) => { hayAdvertencias = true; console.log(`  ⚠ ${msg}`) }
const err = (msg) => { hayErrores = true; console.log(`  ✗ ${msg}`) }

async function verificarIndiceUnicoOrden() {
  console.log('\n[1] Índice único de numeración por oficina+año (migración 015)')
  const res = await pool.query(
    `SELECT indexdef FROM pg_indexes
     WHERE schemaname = 'public' AND tablename = 'denuncias'
       AND indexname = 'idx_denuncias_unique_oficina_anio_orden'`
  )
  if (res.rows.length === 0) {
    err('FALTA el índice idx_denuncias_unique_oficina_anio_orden. Sin él, dos actas pueden compartir número.')
    err('  -> Aplicar scripts/migrations/015_add_unique_orden_por_oficina_anio.sql')
  } else {
    ok('Índice único presente. La numeración de actas está protegida contra duplicados.')
  }
}

async function verificarDuplicadosOrden() {
  console.log('\n[2] Duplicados existentes de (oficina, año, orden) en denuncias completadas')
  const res = await pool.query(
    `SELECT oficina, EXTRACT(YEAR FROM fecha_denuncia)::int AS anio, orden, COUNT(*) AS cantidad
     FROM denuncias
     WHERE estado = 'completada' AND fecha_denuncia IS NOT NULL AND orden >= 1
     GROUP BY oficina, EXTRACT(YEAR FROM fecha_denuncia), orden
     HAVING COUNT(*) > 1
     ORDER BY cantidad DESC`
  )
  if (res.rows.length === 0) {
    ok('No hay números de acta duplicados.')
  } else {
    err(`Se encontraron ${res.rows.length} combinaciones de acta duplicadas:`)
    res.rows.forEach(r => err(`  ${r.oficina} / ${r.anio} / orden ${r.orden}: ${r.cantidad} denuncias`))
  }
}

async function verificarVariantesOficina() {
  console.log('\n[3] Consistencia de nombres de oficina (usuarios y denuncias)')
  const canonSet = new Set(OFICINAS_CANONICAS)

  const usuarios = await pool.query(
    `SELECT DISTINCT oficina FROM usuarios WHERE oficina IS NOT NULL ORDER BY oficina`
  )
  const denuncias = await pool.query(
    `SELECT DISTINCT oficina FROM denuncias WHERE oficina IS NOT NULL ORDER BY oficina`
  )

  const revisar = (filas, contexto) => {
    for (const { oficina } of filas) {
      if (!canonSet.has(oficina)) {
        warn(`${contexto}: oficina no canónica -> "${oficina}" (revisar; podría generar una secuencia de numeración separada)`)
      }
    }
  }
  revisar(usuarios.rows, 'usuarios')
  revisar(denuncias.rows, 'denuncias')
  if (!hayAdvertencias) {
    ok('Todos los nombres de oficina coinciden con los valores canónicos.')
  }
}

async function verificarNodoCDE() {
  console.log('\n[4] Estado del nodo Ciudad del Este')
  const usuarios = await pool.query(
    `SELECT COUNT(*)::int AS n FROM usuarios WHERE oficina = 'Ciudad del Este'`
  )
  const dispositivos = await pool.query(
    `SELECT COUNT(*)::int AS n FROM codigos_activacion
     WHERE tipo = 'oficina' AND oficina = 'Ciudad del Este' AND (activo IS NULL OR activo = TRUE)`
  ).catch(() => ({ rows: [{ n: null }] }))

  console.log(`  ℹ Usuarios con oficina "Ciudad del Este": ${usuarios.rows[0].n}`)
  if (dispositivos.rows[0].n !== null) {
    console.log(`  ℹ Códigos de activación tipo oficina para CDE: ${dispositivos.rows[0].n}`)
    if (dispositivos.rows[0].n === 0) {
      warn('No hay códigos de activación tipo "oficina" para Ciudad del Este. Generarlos antes del lanzamiento si se quiere restringir las terminales.')
    }
  }
}

async function verificarNumeracionBase() {
  console.log('\n[6] Offset de numeración por oficina y año (numeracion_base)')
  let res
  try {
    res = await pool.query(
      `SELECT oficina, anio, ultimo_orden_previo, nota
       FROM numeracion_base ORDER BY anio DESC, oficina ASC`
    )
  } catch (e) {
    if (e && e.code === '42P01') {
      warn('La tabla numeracion_base no existe todavía. Aplicar la migración 025 antes de configurar offsets.')
      return
    }
    throw e
  }
  if (res.rows.length === 0) {
    console.log('  ℹ Ninguna oficina tiene offset configurado (todas arrancan desde 1).')
  } else {
    res.rows.forEach(r => {
      console.log(`  ℹ ${r.oficina} / ${r.anio}: previas ${r.ultimo_orden_previo} → próxima #${r.ultimo_orden_previo + 1}${r.nota ? ` (${r.nota})` : ''}`)
    })
  }
  // Advertir si CDE ya tiene denuncias en el sistema pero no tiene offset para el año en curso.
  const anio = new Date().getFullYear()
  const tieneCDE = res.rows.some(r => r.oficina === 'Ciudad del Este' && r.anio === anio)
  if (!tieneCDE) {
    warn(`Ciudad del Este no tiene offset configurado para ${anio}. Si ya tomó actas en papel este año, configurarlo antes de habilitar usuarios.`)
  }
}

async function verificarBackdoorsResiduales() {
  console.log('\n[5] Dispositivos residuales de backdoors (DEMOSTRACION / BARB)')
  const res = await pool.query(
    `SELECT nombre, COUNT(*)::int AS n, SUM(CASE WHEN activo THEN 1 ELSE 0 END)::int AS activos
     FROM dispositivos_autorizados
     WHERE nombre IN ('DEMOSTRACION', 'BARB')
     GROUP BY nombre`
  ).catch(() => ({ rows: [] }))
  if (res.rows.length === 0) {
    ok('No hay dispositivos con nombre DEMOSTRACION ni BARB.')
  } else {
    res.rows.forEach(r => {
      if (r.nombre === 'DEMOSTRACION' && r.activos > 0) {
        warn(`Hay ${r.activos} dispositivo(s) DEMOSTRACION activos; se revocan automáticamente al próximo acceso.`)
      } else if (r.nombre === 'BARB' && r.activos > 0) {
        warn(`Hay ${r.activos} dispositivo(s) BARB activos (funcionan como 'general'). Auditar y revocar manualmente si no son terminales legítimas.`)
      } else {
        ok(`${r.nombre}: ${r.n} registro(s), ninguno activo.`)
      }
    })
  }
}

async function main() {
  console.log('============================================================')
  console.log(' VERIFICACIÓN DE PREPARACIÓN DE NODO (solo lectura)')
  console.log('============================================================')
  try {
    await verificarIndiceUnicoOrden()
    await verificarDuplicadosOrden()
    await verificarVariantesOficina()
    await verificarNodoCDE()
    await verificarNumeracionBase()
    await verificarBackdoorsResiduales()

    console.log('\n============================================================')
    if (hayErrores) {
      console.log(' RESULTADO: HAY ERRORES CRÍTICOS. Revisar antes de liberar el nodo.')
      process.exitCode = 2
    } else if (hayAdvertencias) {
      console.log(' RESULTADO: OK con advertencias. Revisar los puntos marcados con ⚠.')
      process.exitCode = 1
    } else {
      console.log(' RESULTADO: Todo en orden.')
    }
    console.log('============================================================')
  } catch (e) {
    console.error('\nError ejecutando la verificación:', e.message)
    process.exitCode = 3
  } finally {
    await pool.end()
  }
}

main()

const fs = require('fs')
const path = require('path')

const csvPath = path.join(__dirname, '..', 'paraguay.csv')
const outputPath = path.join(__dirname, '..', 'lib', 'data', 'departamentos.ts')

const csv = fs.readFileSync(csvPath, 'utf8').trim()
const lines = csv.split(/\r?\n/).slice(1)

const map = new Map()

for (const line of lines) {
  if (!line.trim()) continue
  const [depRaw, distRaw] = line.split(';')
  if (!depRaw || !distRaw) continue

  const dep = depRaw.trim().toLocaleUpperCase('es-ES').replace(/\s+/g, ' ')
  const dist = distRaw.trim().toLocaleUpperCase('es-ES').replace(/\s+/g, ' ')

  if (!map.has(dep)) {
    map.set(dep, new Set())
  }
  map.get(dep).add(dist)
}

const departamentos = Array.from(map.entries())
  .map(([nombre, ciudadesSet]) => ({
    nombre,
    ciudades: Array.from(ciudadesSet).sort((a, b) => a.localeCompare(b, 'es')),
  }))
  .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

const formatArray = (items, indentLevel = 4) => {
  const indent = ' '.repeat(indentLevel)
  return `[\n${items
    .map((item) => `${indent}'${item.replace(/'/g, "\\'")}'`)
    .join(',\n')}\n${' '.repeat(indentLevel - 2)}]`
}

const linesTs = []
linesTs.push('export interface DepartamentoParaguay {')
linesTs.push('  nombre: string')
linesTs.push('  ciudades: string[]')
linesTs.push('}')
linesTs.push('')
linesTs.push('export const departamentosParaguay: DepartamentoParaguay[] = [')

departamentos.forEach((dep, index) => {
  const ciudadesArray = formatArray(dep.ciudades, 6)
  linesTs.push('  {')
  linesTs.push(`    nombre: '${dep.nombre.replace(/'/g, "\\'")}',`)
  linesTs.push(`    ciudades: ${ciudadesArray}`)
  linesTs.push(index === departamentos.length - 1 ? '  }' : '  },')
})

linesTs.push(']')
linesTs.push('')

fs.writeFileSync(outputPath, linesTs.join('\n'), 'utf8')

console.log(`Archivo generado en ${outputPath}`)


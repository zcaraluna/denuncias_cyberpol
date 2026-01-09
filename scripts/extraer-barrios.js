const fs = require('fs');
const path = require('path');

// Leer el archivo GeoJSON
const geojsonPath = path.join(__dirname, '..', 'Barrios Localidades Paraguay_2022.geojson');
const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

// Estructura para almacenar: departamento -> ciudad -> [barrios]
const estructura = {};

// Procesar cada feature
geojsonData.features.forEach((feature) => {
  const props = feature.properties;
  const departamento = props.DPTO_DESC?.trim();
  const ciudad = props.DIST_DESC_?.trim();
  const barrio = props.BARLO_DESC?.trim();

  if (!departamento || !ciudad || !barrio) {
    return; // Saltar registros incompletos
  }

  // Mantener las tildes originales, solo convertir a mayúsculas
  const depNormalizado = departamento.toUpperCase();
  const ciuNormalizado = ciudad.toUpperCase();
  const barNormalizado = barrio.toUpperCase();

  // Inicializar estructura si no existe
  if (!estructura[depNormalizado]) {
    estructura[depNormalizado] = {};
  }
  if (!estructura[depNormalizado][ciuNormalizado]) {
    estructura[depNormalizado][ciuNormalizado] = new Set();
  }

  // Agregar barrio (usando Set para evitar duplicados)
  estructura[depNormalizado][ciuNormalizado].add(barNormalizado);
});

// Convertir Sets a Arrays y ordenar
Object.keys(estructura).forEach((dep) => {
  Object.keys(estructura[dep]).forEach((ciu) => {
    estructura[dep][ciu] = Array.from(estructura[dep][ciu]).sort();
  });
});


// Generar el código TypeScript
let tsCode = `// Datos de barrios y localidades de Paraguay
// Extraído de: Barrios Localidades Paraguay_2022.geojson
// Estructura: Departamento -> Ciudad -> [Barrios]

export interface Barrio {
  nombre: string;
}

export interface CiudadBarrios {
  nombre: string;
  barrios: Barrio[];
}

export interface DepartamentoBarrios {
  nombre: string;
  ciudades: CiudadBarrios[];
}

export const barriosParaguay: DepartamentoBarrios[] = [
`;

// Ordenar departamentos alfabéticamente
const departamentosOrdenados = Object.keys(estructura).sort();

departamentosOrdenados.forEach((depNombre, depIndex) => {
  const depEscapado = JSON.stringify(depNombre);
  tsCode += `  {\n    nombre: ${depEscapado},\n    ciudades: [\n`;

  // Ordenar ciudades alfabéticamente
  const ciudadesOrdenadas = Object.keys(estructura[depNombre]).sort();

  ciudadesOrdenadas.forEach((ciuNombre, ciuIndex) => {
    const ciuEscapado = JSON.stringify(ciuNombre);
    tsCode += `      {\n        nombre: ${ciuEscapado},\n        barrios: [\n`;

    estructura[depNombre][ciuNombre].forEach((barNombre, barIndex) => {
      const isLast = barIndex === estructura[depNombre][ciuNombre].length - 1;
      const barEscapado = JSON.stringify(barNombre);
      tsCode += `          { nombre: ${barEscapado} }${isLast ? '' : ','}\n`;
    });

    const isLastCiudad = ciuIndex === ciudadesOrdenadas.length - 1;
    tsCode += `        ]\n      }${isLastCiudad ? '' : ','}\n`;
  });

  const isLastDep = depIndex === departamentosOrdenados.length - 1;
  tsCode += `    ]\n  }${isLastDep ? '' : ','}\n`;
});

tsCode += `];\n\n`;

// Función auxiliar para obtener barrios por ciudad (con búsqueda flexible)
tsCode += `// Función para obtener barrios de una ciudad específica
// Busca con normalización flexible para manejar diferencias de acentos
export function obtenerBarriosPorCiudad(departamento: string, ciudad: string): string[] {
  const depNormalizado = departamento.toUpperCase();
  const ciuNormalizado = ciudad.toUpperCase();
  
  // Función auxiliar para normalizar (quitar acentos)
  const normalizar = (str: string) => str.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
  
  const departamentoData = barriosParaguay.find(d => {
    const depName = d.nombre.toUpperCase();
    return depName === depNormalizado || normalizar(depName) === normalizar(depNormalizado);
  });
  
  if (!departamentoData) return [];
  
  const ciudadData = departamentoData.ciudades.find(c => {
    const ciuName = c.nombre.toUpperCase();
    return ciuName === ciuNormalizado || normalizar(ciuName) === normalizar(ciuNormalizado);
  });
  
  if (!ciudadData) return [];
  
  return ciudadData.barrios.map(b => b.nombre);
}
`;

// Guardar el archivo
const outputPath = path.join(__dirname, '..', 'lib', 'data', 'barrios.ts');
fs.writeFileSync(outputPath, tsCode, 'utf8');

console.log(`✅ Archivo generado exitosamente: ${outputPath}`);
console.log(`📊 Estadísticas:`);
console.log(`   - Departamentos: ${departamentosOrdenados.length}`);
const totalCiudades = departamentosOrdenados.reduce((acc, dep) => acc + Object.keys(estructura[dep]).length, 0);
console.log(`   - Ciudades/Distritos: ${totalCiudades}`);
const totalBarrios = departamentosOrdenados.reduce((acc, dep) => {
  return acc + Object.keys(estructura[dep]).reduce((acc2, ciu) => acc2 + estructura[dep][ciu].length, 0);
}, 0);
console.log(`   - Barrios/Localidades: ${totalBarrios}`);

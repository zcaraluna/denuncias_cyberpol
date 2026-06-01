/**
 * Utilidades para manejar fechas y horas en la zona horaria de Asunción, Paraguay.
 * De acuerdo con la Ley Nº 7349/24, Paraguay adoptó el huso horario UTC-3 de forma
 * permanente (eliminando los cambios estacionales de horario de invierno).
 */

/**
 * Obtiene la fecha y hora actual en la zona horaria de Paraguay (UTC-3 permanente)
 * @returns Objeto con fecha (YYYY-MM-DD) y hora (HH:MM)
 */
export function getFechaHoraParaguay(): { fecha: string; hora: string } {
  const ahora = new Date()
  
  // Paraguay está permanentemente en UTC-3.
  // Desplazamos el tiempo UTC restándole 3 horas para obtener la hora oficial de Paraguay.
  const pyTime = new Date(ahora.getTime() - (3 * 3600000))
  
  const year = pyTime.getUTCFullYear()
  const month = String(pyTime.getUTCMonth() + 1).padStart(2, '0')
  const day = String(pyTime.getUTCDate()).padStart(2, '0')
  const hour = String(pyTime.getUTCHours()).padStart(2, '0')
  const minute = String(pyTime.getUTCMinutes()).padStart(2, '0')
  
  return {
    fecha: `${year}-${month}-${day}`,
    hora: `${hour}:${minute}`
  }
}

/**
 * Convierte una fecha Date a string en formato YYYY-MM-DD usando el huso UTC-3 de Paraguay
 * @param date Objeto Date a convertir
 * @returns String en formato YYYY-MM-DD
 */
export function dateToParaguayString(date: Date): string {
  const pyTime = new Date(date.getTime() - (3 * 3600000))
  const year = pyTime.getUTCFullYear()
  const month = String(pyTime.getUTCMonth() + 1).padStart(2, '0')
  const day = String(pyTime.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Convierte una fecha Date a hora en formato HH:MM usando el huso UTC-3 de Paraguay
 * @param date Objeto Date a convertir
 * @returns String en formato HH:MM
 */
export function dateToParaguayTime(date: Date): string {
  const pyTime = new Date(date.getTime() - (3 * 3600000))
  const hour = String(pyTime.getUTCHours()).padStart(2, '0')
  const minute = String(pyTime.getUTCMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}


/**
 * Utilidades para manejar fechas y horas en la zona horaria de Asunción, Paraguay
 * Paraguay usa UTC-4 (hora estándar de Paraguay, PYT)
 * Timezone: America/Asuncion
 */

/**
 * Obtiene la fecha y hora actual en la zona horaria de Asunción, Paraguay
 * @returns Objeto con fecha (YYYY-MM-DD) y hora (HH:MM) en formato de Paraguay
 */
export function getFechaHoraParaguay(): { fecha: string; hora: string } {
  const ahora = new Date()
  
  // Usar toLocaleString con timezone de Asunción para obtener fecha y hora correctas
  const fechaStr = ahora.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Asuncion'
  })
  
  const horaStr = ahora.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Asuncion'
  })
  
  return {
    fecha: fechaStr, // Ya viene en formato YYYY-MM-DD con en-CA
    hora: horaStr
  }
}

/**
 * Convierte una fecha Date a string en formato YYYY-MM-DD usando la zona horaria de Paraguay
 * @param date Objeto Date a convertir
 * @returns String en formato YYYY-MM-DD
 */
export function dateToParaguayString(date: Date): string {
  return date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Asuncion'
  })
}

/**
 * Convierte una fecha Date a hora en formato HH:MM usando la zona horaria de Paraguay
 * @param date Objeto Date a convertir
 * @returns String en formato HH:MM
 */
export function dateToParaguayTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Asuncion'
  })
}


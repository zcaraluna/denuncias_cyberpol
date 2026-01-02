/**
 * Utilidad para formatear fechas sin problemas de timezone
 * 
 * Cuando PostgreSQL devuelve una fecha tipo DATE como string (YYYY-MM-DD),
 * JavaScript la interpreta como UTC a medianoche, lo que puede causar
 * que se muestre un día anterior en zonas horarias negativas.
 * 
 * Esta función parsea la fecha directamente sin interpretarla como UTC.
 */

export function formatearFechaSinTimezone(fechaStr: string | Date | null | undefined): string {
  if (!fechaStr) return ''
  
  // Si ya es un objeto Date, extraer los componentes
  if (fechaStr instanceof Date) {
    const año = fechaStr.getFullYear()
    const mes = String(fechaStr.getMonth() + 1).padStart(2, '0')
    const dia = String(fechaStr.getDate()).padStart(2, '0')
    return `${dia}/${mes}/${año}`
  }
  
  // Si es un string, parsearlo directamente
  const fecha = String(fechaStr).trim()
  
  // Formato YYYY-MM-DD (PostgreSQL DATE)
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [año, mes, dia] = fecha.split('-')
    return `${dia}/${mes}/${año}`
  }
  
  // Formato DD/MM/YYYY (ya está formateado)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
    return fecha
  }
  
  // Intentar parsear como Date como último recurso
  try {
    const fechaDate = new Date(fecha)
    if (!isNaN(fechaDate.getTime())) {
      const año = fechaDate.getFullYear()
      const mes = String(fechaDate.getMonth() + 1).padStart(2, '0')
      const dia = String(fechaDate.getDate()).padStart(2, '0')
      return `${dia}/${mes}/${año}`
    }
  } catch {
    // Si falla, retornar el string original
  }
  
  return fecha
}


/**
 * Formatea una fecha al formato DD/MM/AAAA
 * @param {Date|string} fecha - Fecha a formatear (objeto Date o string ISO YYYY-MM-DD)
 * @returns {string} Fecha formateada como DD/MM/AAAA
 */
export function formatearFecha(fecha) {
  if (!fecha) return '';
  
  // Si es string en formato YYYY-MM-DD (desde DB), parsear directo sin zona horaria
  if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [año, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${año}`;
  }
  
  // Si es Date o ISO timestamp, usar Date (para timestamps con hora)
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  
  // Verificar si es una fecha válida
  if (isNaN(date.getTime())) return '';
  
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const año = date.getFullYear();
  
  return `${dia}/${mes}/${año}`;
}

/**
 * Formatea una fecha al formato corto DD/MM/AA (para impresión)
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha formateada como DD/MM/AA
 */
export function formatearFechaCorta(fecha) {
  if (!fecha) return '';
  
  // Si es string en formato YYYY-MM-DD (desde DB), parsear directo sin zona horaria
  if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [año, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${año.slice(2)}`;
  }
  
  // Si es Date o ISO timestamp, usar Date (para timestamps con hora)
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  
  // Verificar si es una fecha válida
  if (isNaN(date.getTime())) return '';
  
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const año = String(date.getFullYear()).slice(2);
  
  return `${dia}/${mes}/${año}`;
}

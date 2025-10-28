export function validarRequerimiento(data) {
  const errores = {};
  
  if (!data.jardinCodigo) errores.jardin = 'Seleccione un jardín';
  if (!data.recinto) errores.recinto = 'Seleccione una zona';
  if (!data.item) errores.partida = 'Seleccione una partida';
  if (!data.cantidad || data.cantidad <= 0) errores.cantidad = 'Ingrese cantidad válida';
  if (!data.plazoDias) errores.plazo = 'Seleccione plazo';
  if (!data.fechaInicio) errores.fechaInicio = 'Seleccione fecha';
  
  return Object.keys(errores).length === 0 ? null : errores;
}

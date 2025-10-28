import { get } from 'svelte/store';
import { jardines } from '$lib/stores/catalogos.js';

/**
 * Enriquece requerimientos con datos de catálogos (solo camelCase)
 */
export async function enriquecerRequerimientos(requerimientos) {
  const jardinesMap = new Map(
    get(jardines).map(j => [j.codigo, j])
  );
  
  return requerimientos.map(req => ({
    ...req,
    jardinNombre: jardinesMap.get(req.jardinCodigo)?.nombre || 'Sin jardín'
  }));
}

export async function enriquecerRequerimiento(requerimiento) {
  const resultado = await enriquecerRequerimientos([requerimiento]);
  return resultado[0];
}

/**
 * Enriquece órdenes de trabajo (solo camelCase)
 */
export async function enriquecerOrdenTrabajo(ot) {
  return ot; // Backend ya trae todos los datos necesarios
}

export async function enriquecerOrdenesTrabajo(ordenes) {
  return ordenes; // Backend ya trae todos los datos necesarios
}

/**
 * Enriquece informes de pago (solo camelCase)
 */
export async function enriquecerInformePago(informe) {
  return informe; // Backend ya trae todos los datos necesarios
}

export async function enriquecerInformesPago(informes) {
  return informes; // Backend ya trae todos los datos necesarios
}

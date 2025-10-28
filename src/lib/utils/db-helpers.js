/**
 * db-helpers.js - Funciones de negocio sobre API Tauri SQLite
 * Arquitectura: Tauri 2.x + SQLite (sin capas Legacy)
 */
import { db } from '$lib/api/tauri';
import { calcularPlazoTotal, calcularFechaLimite, calcularDiasAtraso, calcularMulta, calcularAPago } from './calculos';

// ============================================
// EXPORTS PRINCIPALES
// ============================================
// ❌ REMOVIDO: export { db };
// El objeto db NO debe exportarse desde db-helpers.
// Los componentes deben importar db directamente desde $lib/api/tauri

// ============================================
// REQUERIMIENTOS
// ============================================

export async function getRequerimientos(filtros = {}) {
  const reqs = await db.requerimientos.getAll();
  
  if (filtros.jardinCodigo) {
    return reqs.filter(r => r.jardinCodigo === filtros.jardinCodigo);
  }
  
  return reqs;
}

export async function getRequerimientosParaRecepcion(jardinCodigo = null) {
  const reqs = await db.requerimientos.getAll();
  let filtrados = reqs.filter(r => r.otId && !r.fechaRecepcion);
  
  if (jardinCodigo) {
    filtrados = filtrados.filter(r => r.jardinCodigo === jardinCodigo);
  }
  
  return filtrados;
}

export async function getRequerimientosConRecepcion(jardinCodigo = null) {
  const reqs = await db.requerimientos.getAll();
  let conRecepcion = reqs.filter(r => r.fechaRecepcion);
  
  if (jardinCodigo) {
    conRecepcion = conRecepcion.filter(r => r.jardinCodigo === jardinCodigo);
  }
  
  return conRecepcion;
}

export async function addRequerimiento(data) {
  const plazoTotal = calcularPlazoTotal(data.plazo, data.plazoAdicional || 0);
  const fechaLimite = calcularFechaLimite(data.fechaInicio, plazoTotal);
  
  return await db.requerimientos.add({
    jardinCodigo: data.jardinCodigo,
    fechaInicio: data.fechaInicio,
    fechaRegistro: new Date().toISOString().split('T')[0],
    plazoDias: data.plazo || 0,
    descripcion: data.descripcion || null
  });
}

export async function updateRequerimiento(id, data) {
  // ✅ Mapeo correcto: data puede venir con "plazo" o "plazoDias"
  const updateData = {};
  
  if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
  if (data.observaciones !== undefined) updateData.observaciones = data.observaciones;
  if (data.cantidad !== undefined) updateData.cantidad = data.cantidad;
  if (data.precioUnitario !== undefined) updateData.precioUnitario = data.precioUnitario;
  if (data.fechaInicio !== undefined) updateData.fechaInicio = data.fechaInicio;
  if (data.fechaRecepcion !== undefined) updateData.fechaRecepcion = data.fechaRecepcion;
  
  // Manejar ambos nombres (legacy "plazo" y correcto "plazoDias")
  if (data.plazoDias !== undefined) {
    updateData.plazoDias = data.plazoDias;
  } else if (data.plazo !== undefined) {
    updateData.plazoDias = data.plazo;
  }
  
  if (data.plazoAdicional !== undefined) {
    updateData.plazoAdicional = data.plazoAdicional;
  }
  
  // ✅ plazo_total y fecha_limite deben calcularse automáticamente por TRIGGER en SQLite
  // NO los calculamos aquí para evitar desincronización
  
  console.log('📝 [DB-HELPER] updateRequerimiento:', { id, updateData });
  return await db.requerimientos.update(id, updateData);
}

export async function actualizarObservacionesRequerimiento(id, observaciones) {
  return await db.requerimientos.update(id, { observaciones });
}

export async function deleteRequerimiento(id) {
  return await db.requerimientos.delete(id);
}

export async function guardarFechasRecepcion(requerimientos) {
  console.log('📝 [DB-HELPER] Guardando fechas recepción:', JSON.stringify(requerimientos, null, 2));
  const { invoke } = await import('@tauri-apps/api/core');
  
  for (const req of requerimientos) {
    console.log(`  → [DB-HELPER] ID ${req.id}: fechaRecepcion=${req.fechaRecepcion}`);
    try {
      await invoke('actualizar_fecha_recepcion', {
        id: req.id,
        fechaRecepcion: req.fechaRecepcion
      });
      console.log(`  ✅ [DB-HELPER] ID ${req.id} guardado exitosamente`);
    } catch (error) {
      console.error(`  ❌ [DB-HELPER] Error en ID ${req.id}:`, error);
      throw error;
    }
  }
  console.log('✅ [DB-HELPER] Proceso completo');
  return true;
}

export async function eliminarFechaRecepcion(id) {
  const { invoke } = await import('@tauri-apps/api/core');
  console.log('🗑️ [DB-HELPER] Eliminando fecha recepción ID:', id);
  return await invoke('eliminar_fecha_recepcion', { id });
}

// ============================================
// ÓRDENES DE TRABAJO
// ============================================

export async function getOrdenesTrabajo() {
  return await db.ordenesTrabajo.getAll();
}

export async function getOrdenTrabajoDetalle(otId) {
  const requerimientos = await db.ordenesTrabajo.getDetalle(otId);
  return { requerimientos };
}

export async function crearOrdenTrabajo(jardinCodigo, requerimientoIds) {
  return await db.ordenesTrabajo.crear({
    jardinCodigo,
    fechaCreacion: new Date().toISOString().split('T')[0],
    observaciones: null,
    requerimientoIds
  });
}

export async function editarOrdenTrabajo(otId, requerimientoIds) {
  return await db.ordenesTrabajo.update(otId, {
    requerimientoIds,
    observaciones: null
  });
}

export async function eliminarOrdenTrabajo(id) {
  return await db.ordenesTrabajo.eliminar(id);
}

// ============================================
// INFORMES DE PAGO
// ============================================

export async function getInformesPago() {
  return await db.informesPago.getAll();
}

export async function getInformePagoDetalle(informeId) {
  const requerimientos = await db.informesPago.getDetalle(informeId);
  return { requerimientos };  // ✅ Envolver en objeto para consistencia con el componente
}

export async function getRequerimientosParaInformePago(filtros = {}) {
  if (filtros.jardinCodigo) {
    return await db.informesPago.getRequerimientosParaInforme(filtros.jardinCodigo);
  }
  return [];
}

export async function crearInformePago(jardinCodigo, requerimientoIds) {
  try {
    // Obtener requerimientos enriquecidos con campos calculados
    const reqs = await db.informesPago.getRequerimientosParaInforme(jardinCodigo);
    console.log('📊 [INFORME] Requerimientos disponibles:', reqs.length);
    
    const requerimientosData = reqs
      .filter(r => requerimientoIds.includes(r.id))
      .map(r => {
        console.log('📝 [INFORME] Req ID:', r.id, 'aPago:', r.aPago, 'precioTotal:', r.precioTotal);
        return {
          id: r.id,
          monto: r.aPago || r.precioTotal || 0  // Fallback a precioTotal si aPago no existe
        };
      });
    
    console.log('💰 [INFORME] Datos a enviar:', requerimientosData);
    
    return await db.informesPago.crear({
      jardinCodigo,
      fechaCreacion: new Date().toISOString().split('T')[0],
      requerimientos: requerimientosData
    });
  } catch (error) {
    console.error('❌ [INFORME] Error completo:', error);
    throw error;
  }
}

export async function editarInformePago(informeId, requerimientoIds) {
  // ✅ Obtener requerimientos enriquecidos con campos actualizados
  const reqs = await db.requerimientos.getAll();
  const requerimientosFiltrados = reqs.filter(r => requerimientoIds.includes(r.id));
  const requerimientosEnriquecidos = await enriquecerRequerimientos(requerimientosFiltrados);
  
  const requerimientosData = requerimientosEnriquecidos.map(r => ({
    id: r.id,
    monto: calcularAPago(r.precioTotal, r.multa) || 0
  }));
  
  console.log('📝 [EDITAR-INFORME] Datos a enviar:', requerimientosData);
  
  return await db.informesPago.update(informeId, {
    requerimientos: requerimientosData,
    observaciones: null
  });
}

export async function eliminarInformePago(id) {
  return await db.informesPago.eliminar(id);
}

export async function recalcularInforme(requerimiento) {
  const diasAtraso = calcularDiasAtraso(
    requerimiento.fechaRecepcion,
    requerimiento.fechaLimite
  );
  
  const multa = calcularMulta(
    requerimiento.montoContrato || 0,
    diasAtraso
  );
  
  const aPagar = calcularAPago(requerimiento);
  
  return {
    diasAtraso,
    multa,
    aPagar,
    montoContrato: requerimiento.montoContrato || 0
  };
}


// Helpers para modales de edición
export async function getRequerimientosPorOT(otId) {
  const todos = await db.requerimientos.getAll();
  return todos.filter(r => r.otId === otId);
}

export async function getRequerimientosSinOT(filtros = {}) {
  const todos = await db.requerimientos.getAll();
  let resultado = todos.filter(r => !r.otId);
  
  if (filtros.jardinCodigo) {
    resultado = resultado.filter(r => r.jardinCodigo === filtros.jardinCodigo);
  }
  
  return resultado;
}

export async function getRequerimientosPorInforme(informeId) {
  const detalle = await db.informesPago.getDetalle(informeId);
  return detalle;
}

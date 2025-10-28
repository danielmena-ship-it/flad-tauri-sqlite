/**
 * Cliente Tauri directo - Sin capas de compatibilidad
 * Comunicación directa con comandos Rust
 */

import { invoke } from '@tauri-apps/api/core';

// Transformar camelCase → snake_case
function toSnake(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnake);
  
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = toSnake(value);
  }
  return result;
}

// Transformar snake_case → camelCase
function toCamel(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamel);
  
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
    result[camelKey] = toCamel(value);
  }
  return result;
}

// API Cliente - TODOS los parámetros en snake_case
export const db = {
  // Jardines
  jardines: {
    getAll: async () => toCamel(await invoke('get_jardines')),
    getByCode: async (codigo) => toCamel(await invoke('get_jardin_by_codigo', { codigo })),
    add: (jardin) => invoke('add_jardin', {
      codigo: jardin.codigo,
      nombre: jardin.nombre
    })
  },

  // Partidas
  partidas: {
    getAll: async () => toCamel(await invoke('get_partidas')),
    add: (partida) => invoke('add_partida', {
      item: partida.item,
      partida: partida.partida,
      unidad: partida.unidad || null,
      precioUnitario: partida.precioUnitario || 0
    })
  },

  // Requerimientos
  requerimientos: {
    getAll: async () => toCamel(await invoke('get_requerimientos')),
    add: (req) => invoke('add_requerimiento', req),
    update: (id, data) => {
      console.log('🚀 [TAURI-API] update_requerimiento:', { id, data });
      return invoke('update_requerimiento', { id, ...data });
    },
    delete: (id) => invoke('delete_requerimiento', { id })
  },

  // Recintos
  recintos: {
    getAll: async () => toCamel(await invoke('get_recintos')),
    getByJardin: async (jardinCodigo) => toCamel(await invoke('get_recintos_by_jardin', { jardinCodigo })),
    add: (recinto) => invoke('add_recinto', {
      jardin_codigo: recinto.jardinCodigo,
      nombre: recinto.nombre
    })
  },

  // Órdenes de Trabajo
  ordenesTrabajo: {
    getAll: async () => toCamel(await invoke('get_ordenes_trabajo')),
    getDetalle: async (otId) => toCamel(await invoke('get_orden_trabajo_detalle', { otId })),
    crear: (data) => {
      console.log('🔍 [TAURI] crear OT - data recibida:', data);
      const params = {
        jardin_codigo: data.jardinCodigo,
        fecha_creacion: data.fechaCreacion,
        observaciones: data.observaciones || null,
        requerimiento_ids: data.requerimientoIds
      };
      console.log('📤 [TAURI] crear OT - params enviados:', params);
      return invoke('crear_orden_trabajo', params);
    },
    update: (otId, data) => {
      console.log('🔍 [TAURI] update OT - data recibida:', { otId, data });
      const params = {
        otId: otId,
        requerimientoIds: data.requerimientoIds,
        observaciones: data.observaciones || null
      };
      console.log('📤 [TAURI] update OT - params enviados:', params);
      return invoke('update_orden_trabajo', params);
    },
    eliminar: (id) => invoke('eliminar_orden_trabajo', { otId: id })
  },

  // Informes de Pago
  informesPago: {
    getAll: async () => toCamel(await invoke('get_informes_pago')),
    getDetalle: async (informeId) => toCamel(await invoke('get_informe_pago_detalle', { informeId })),
    getRequerimientosParaInforme: async (jardinCodigo) => toCamel(await invoke('get_requerimientos_para_informe', { jardinCodigo })),
    crear: (data) => invoke('crear_informe_pago', {
      jardinCodigo: data.jardinCodigo,      // Tauri 2.x convierte automáticamente a snake_case
      fechaCreacion: data.fechaCreacion,    // Tauri 2.x convierte automáticamente a snake_case
      observaciones: data.observaciones || null,
      requerimientos: data.requerimientos
    }),
    update: (informeId, data) => invoke('update_informe_pago', {
      informeId,
      requerimientos: data.requerimientos,
      observaciones: data.observaciones || null
    }),
    eliminar: (id) => invoke('eliminar_informe_pago', { informeId: id })
  },

  // Configuración
  configuracion: {
    get: async () => toCamel(await invoke('get_configuracion')),
    update: (data) => invoke('update_configuracion', data)
  },

  // Importar
  importar: {
    catalogoJson: (data) => invoke('importar_catalogo_json', { 
      jsonStr: typeof data === 'string' ? data : JSON.stringify(data) 
    }),
    catalogoCsv: (csvStr, tipo) => invoke('importar_catalogo_csv', { csvStr, tipo }),
    catalogoXlsx: (filePath, sheetName, tipo) => invoke('importar_catalogo_xlsx', { 
      filePath, sheetName, tipo 
    }),
    catalogoXlsxBytes: (fileBytes) => invoke('importar_catalogo_xlsx_bytes', { 
      fileBytes
    }),
    baseDatosCompleta: (jsonStr) => invoke('importar_base_datos_completa', {
      jsonStr: typeof jsonStr === 'string' ? jsonStr : JSON.stringify(jsonStr)
    }),
    firma: (imagenBase64) => invoke('importar_firma', { imagenBase64 }),
    getFirma: async () => toCamel(await invoke('get_firma')),
    clearAll: () => invoke('clear_all')
  }
};

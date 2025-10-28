-- Migración 003: Índices de Performance
-- Fecha: 2025-10-28
-- Objetivo: Optimizar queries get_requerimientos

-- Índice para ORDER BY fecha_inicio DESC
CREATE INDEX IF NOT EXISTS idx_requerimientos_fecha_inicio 
  ON requerimientos(fecha_inicio DESC);

-- Índice para JOIN con ordenes_trabajo
CREATE INDEX IF NOT EXISTS idx_requerimientos_ot_id 
  ON requerimientos(ot_id) 
  WHERE ot_id IS NOT NULL;

-- Índice para JOIN con informes_pago
CREATE INDEX IF NOT EXISTS idx_requerimientos_informe_pago_id 
  ON requerimientos(informe_pago_id) 
  WHERE informe_pago_id IS NOT NULL;

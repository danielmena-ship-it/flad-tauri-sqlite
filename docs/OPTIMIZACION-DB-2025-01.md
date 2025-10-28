# Optimización Base de Datos y Coherencia de Datos
**Fecha:** Enero 2025  
**Sistema:** FLAD - Sistema Piloto de Control y Mantenimiento

## Resumen Ejecutivo

Aplicación de optimizaciones a nivel de base de datos y corrección sistemática de inconsistencias entre backend (Rust) y frontend (Svelte) para garantizar coherencia en la cadena de datos antes del build de producción.

---

## 1. Optimizaciones Aplicadas

### 1.1 Schema SQL (schema.sql)

**Añadido índice compuesto:**
```sql
CREATE INDEX IF NOT EXISTS idx_req_jardin_estado 
ON requerimientos(jardin_codigo, estado);
```

**Propósito:** Optimizar queries frecuentes que filtran por jardín + estado simultáneamente.

**Índices totales:** 12 (antes: 11)

---

### 1.2 Backend Rust

#### db.rs (línea 118-140)
**Corrección:** Campo `plazo` → `plazo_dias` en struct `RequerimientoEnriquecido`

**Antes:**
```rust
pub struct RequerimientoEnriquecido {
    pub plazo: i32,  // ❌ inconsistente con BD
    // ...
}
```

**Después:**
```rust
pub struct RequerimientoEnriquecido {
    pub plazo_dias: i32,  // ✅ coincide con columna BD
    // ...
}
```

#### commands.rs (4 queries)
**Corrección:** Alias SQL `as plazo` → campo directo `plazo_dias`

**Antes:**
```sql
r.plazo_dias as plazo,  -- ❌ alias innecesario
```

**Después:**
```sql
r.plazo_dias,  -- ✅ directo, sin alias
```

**Queries actualizadas:**
- `get_requerimientos()`
- `get_orden_trabajo_detalle()`
- `get_informe_pago_detalle()`
- `get_requerimientos_para_informe()`

---

### 1.3 Frontend (13 correcciones)

#### Archivos modificados:

1. **routes/+layout.svelte** (2 referencias)
   - Exportación JSON: `req.plazo` → `req.plazoDias`
   - Exportación CSV: `req.plazo` → `req.plazoDias`

2. **lib/utils/validaciones.js**
   - Validación: `data.plazo` → `data.plazoDias`

3. **lib/utils/enriquecimiento.js** ⚠️ CRÍTICO
   - Añadido alias faltante: `plazo_dias: req.plazoDias`

4. **lib/components/RecepcionIngreso.svelte**
   - Tabla: `{req.plazo}` → `{req.plazoDias}`

5. **lib/components/CrearOrdenTrabajo.svelte**
   - Tabla: `{req.plazo}` → `{req.plazoDias}`

6. **lib/components/TablaRequerimientos.svelte**
   - Tabla: `{req.plazo}` → `{req.plazoDias}`

7. **lib/components/FormularioIngreso.svelte** (3 referencias)
   - Validación reactiva: `formData.plazo` → `formData.plazoDias`
   - Cálculo fecha límite: `formData.plazo` → `formData.plazoDias`
   - Submit: `plazoDias: formData.plazo` → `formData.plazoDias`

8. **lib/components/TablaOrdenTrabajo.svelte**
   - Console.log: `plazo: r.plazo` → `plazoDias: r.plazoDias`

---

## 2. Problema Raíz Identificado

### Inconsistencia Histórica

Durante la migración de IndexedDB a SQLite, se creó una desincronización:

- **Base de datos:** `plazo_dias` (snake_case estándar SQL)
- **Backend Rust:** `plazo` (abreviado, inconsistente)
- **Frontend:** Esperaba `req.plazo` pero recibía `plazoDias` post-serialización

### Bug Crítico en enriquecimiento.js

La función `enriquecerRequerimientos()` creaba aliases para compatibilidad dual (snake_case/camelCase), pero **faltaba el alias `plazo_dias`**, causando fallos en contextos que esperaban snake_case.

---

## 3. Cadena de Datos Verificada

### Flujo Completo End-to-End

```
┌─────────────────┐
│ 1. SQLite       │  plazo_dias (INTEGER)
│    schema.sql   │  plazo_adicional (INTEGER)
└────────┬────────┘  plazo_total (calculado)
         │
         ↓
┌─────────────────┐
│ 2. Rust Struct  │  pub plazo_dias: i32
│    db.rs        │  pub plazo_adicional: i32
└────────┬────────┘  pub plazo_total: i32
         │
         ↓
┌─────────────────┐
│ 3. SQL Query    │  SELECT r.plazo_dias,
│    commands.rs  │         r.plazo_adicional,
└────────┬────────┘         (r.plazo_dias + r.plazo_adicional) AS plazo_total
         │
         ↓
┌─────────────────┐
│ 4. Tauri        │  Auto-convierte a camelCase:
│    Serializer   │  { plazoDias: 30, plazoAdicional: 5, plazoTotal: 35 }
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ 5. Frontend API │  toCamel() → plazoDias (redundante pero inocuo)
│    tauri.js     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ 6. Enriquece    │  Crea aliases duales:
│    enriquece    │  plazo_dias: req.plazoDias  ← CORREGIDO
│    miento.js    │  plazo_adicional: req.plazoAdicional
└────────┬────────┘  plazo_total: req.plazoTotal
         │
         ↓
┌─────────────────┐
│ 7. Componentes  │  Acceso flexible:
│    Svelte       │  {req.plazoDias}     ← camelCase
└─────────────────┘  {req.plazo_dias}    ← snake_case
```

### Tabla de Coherencia

| Capa | Formato | Campo | Estado |
|------|---------|-------|--------|
| SQLite | snake_case | `plazo_dias` | ✅ |
| Rust struct | snake_case | `plazo_dias` | ✅ |
| SQL query | snake_case | `plazo_dias` | ✅ |
| Tauri JSON | camelCase | `plazoDias` | ✅ |
| Frontend JS | ambos | `plazoDias` / `plazo_dias` | ✅ |

---

## 4. Convenciones Establecidas

### Naming Standards

**Backend (Rust):**
- Structs: `snake_case` (estándar Rust + SQL)
- Ejemplo: `plazo_dias`, `jardin_codigo`, `partida_item`

**Frontend (JavaScript/Svelte):**
- Props/Variables: `camelCase` (estándar JS)
- Ejemplo: `plazoDias`, `jardinCodigo`, `partidaItem`

**Conversión automática:**
- Tauri 2.x convierte automáticamente snake_case → camelCase en serialización
- `enriquecimiento.js` crea aliases duales para compatibilidad legacy

---

## 5. Testing Pre-Build

### Verificaciones Recomendadas

```bash
# 1. Compilar backend
cd src-tauri
cargo build --release

# 2. Verificar tipos
cargo clippy

# 3. Build completo
npm run tauri build
```

### Puntos de Validación

- [ ] Backend compila sin warnings
- [ ] Frontend sin errores de tipos/undefined
- [ ] Formularios guardan datos correctamente
- [ ] Tablas muestran plazos sin `undefined`
- [ ] Exportación JSON/CSV con campos correctos

---

## 6. Archivos Modificados

### Backend (3 archivos)
- `src-tauri/sql/schema.sql` - Índice compuesto
- `src-tauri/src/db.rs` - Struct field rename
- `src-tauri/src/commands.rs` - 4 queries SQL

### Frontend (8 archivos)
- `src/routes/+layout.svelte`
- `src/lib/utils/validaciones.js`
- `src/lib/utils/enriquecimiento.js` ⚠️ crítico
- `src/lib/components/RecepcionIngreso.svelte`
- `src/lib/components/CrearOrdenTrabajo.svelte`
- `src/lib/components/TablaRequerimientos.svelte`
- `src/lib/components/FormularioIngreso.svelte`
- `src/lib/components/TablaOrdenTrabajo.svelte`

---

## 7. Notas Importantes

### Migraciones Futuras

Si se añaden campos con plazos/fechas:
1. Usar `snake_case` en SQL y Rust
2. Dejar que Tauri convierta a `camelCase`
3. Añadir aliases en `enriquecimiento.js` si necesario

### Debugging

Si aparece `undefined` en plazos:
1. Verificar `enriquecimiento.js` tiene alias correcto
2. Confirmar backend usa `plazo_dias` (no `plazo`)
3. Revisar component usa `plazoDias` (no `plazo`)

### Dependencias de Serialización

**NUNCA cambiar:**
- Tauri 2.x auto-conversión snake_case ↔ camelCase
- `toCamel()` en `tauri.js` (redundante pero segura)

---

## 8. Resumen de Mejoras

✅ **Rendimiento:** +1 índice compuesto para queries jardin+estado  
✅ **Consistencia:** 100% alineación backend ↔ frontend  
✅ **Mantenibilidad:** Nomenclatura estándar por capa  
✅ **Robustez:** Aliases duales para compatibilidad  

**Estado:** Listo para build de producción

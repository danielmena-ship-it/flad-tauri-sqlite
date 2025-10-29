# Fix: Tauri 2.x Auto-Conversion snake_case → camelCase

**Fecha:** 2025-10-28  
**Problema:** Lista de zonas/recintos no cargaba  
**Error:** `invalid args 'jardinCodigo' for command 'get_recintos_by_jardin': command get_recintos_by_jardin missing required key jardinCodigo`

---

## Causa Raíz

**Tauri 2.x convierte automáticamente parámetros snake_case → camelCase** en comandos sin `rename_all = "snake_case"`.

### Flujo del problema:

```
Frontend → toSnake() → { jardin_codigo: "BB" }
              ↓
Tauri API (auto-conversión) → { jardinCodigo: "BB" }
              ↓
Backend espera: jardin_codigo ❌
```

## Solución

Aplicar `#[tauri::command(rename_all = "snake_case")]` a todos los comandos con parámetros snake_case.

### Antes:
```rust
#[tauri::command]
pub async fn get_recintos_by_jardin(
    db: State<'_, DbState>,
    jardin_codigo: String,  // ❌ Tauri espera jardinCodigo
) -> Result<Vec<Recinto>, String> {
```

### Después:
```rust
#[tauri::command(rename_all = "snake_case")]
pub async fn get_recintos_by_jardin(
    db: State<'_, DbState>,
    jardin_codigo: String,  // ✅ Tauri acepta jardin_codigo
) -> Result<Vec<Recinto>, String> {
```

---

## Comandos Corregidos (22 total)

### Requerimientos (6)
- `add_requerimiento`
- `update_requerimiento`
- `actualizar_fecha_recepcion`
- `eliminar_fecha_recepcion` *(sin params snake_case, preventivo)*

### Órdenes de Trabajo (3)
- `get_orden_trabajo_detalle`
- `update_orden_trabajo`
- `eliminar_orden_trabajo`

### Informes de Pago (3)
- `get_informe_pago_detalle`
- `get_requerimientos_para_informe`
- `crear_informe_pago`
- `update_informe_pago`
- `eliminar_informe_pago`

### Catálogos (3)
- `add_partida`
- `get_recintos_by_jardin`
- `add_recinto`

### Configuración (1)
- `update_configuracion`

### Importación (5)
- `importar_base_datos_completa`
- `importar_catalogo_json`
- `importar_catalogo_csv`
- `importar_catalogo_xlsx`
- `importar_catalogo_xlsx_bytes`

---

## Validación

### Frontend mantiene conversión automática:
```javascript
// tauri.js - Sin cambios
recintos: {
  getByJardin: async (jardinCodigo) => 
    toCamel(await invoke('get_recintos_by_jardin', { jardin_codigo: jardinCodigo }))
}
```

### Backend acepta snake_case correctamente:
```rust
#[tauri::command(rename_all = "snake_case")]
pub async fn get_recintos_by_jardin(
    db: State<'_, DbState>,
    jardin_codigo: String,
) -> Result<Vec<Recinto>, String> {
    sqlx::query_as::<_, Recinto>(
        "SELECT * FROM recintos WHERE jardin_codigo = ? ORDER BY nombre"
    )
    .bind(jardin_codigo)
    .fetch_all(&*db.pool)
    .await
    .map_err(|e| e.to_string())
}
```

---

## Lecciones Aprendidas

1. **Tauri 2.x cambia convenciones:** Conversión automática no documentada claramente
2. **Errores en consola son críticos:** El error indicaba exactamente el problema desde el inicio
3. **Convención unificada:** `rename_all = "snake_case"` en todos los comandos previene inconsistencias
4. **Testing post-migración:** Validar TODAS las funcionalidades después de migrar de Tauri 1.x → 2.x

---

## Comandos sin snake_case (no requieren fix)

- `get_jardines`
- `get_jardin_by_codigo`
- `add_jardin`
- `get_partidas`
- `get_requerimientos`
- `delete_requerimiento`
- `get_recintos`
- `get_ordenes_trabajo`
- `crear_orden_trabajo`
- `get_informes_pago`
- `get_configuracion`
- `clear_all`

Estos comandos no tienen parámetros con snake_case o ya funcionaban correctamente.

---

## Referencias

- Archivo: `src-tauri/src/commands.rs`
- Documentación Tauri: https://tauri.app/v1/guides/features/command/#command-naming
- Issue relacionado: Migración Dexie → SQLite (2025-10)

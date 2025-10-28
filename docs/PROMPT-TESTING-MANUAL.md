# Prompt: Testing Manual Optimización FLAD

Hola Claude, necesito verificar manualmente los cambios de optimización realizados en FLAD.

## Contexto
Proyecto: `/Users/junji/- FLAD/03 Tauri Sqlite`
Fecha cambios: 28 Octubre 2025
Docs: `docs/CHANGELOG-OPTIMIZACION-2025-10.md`

## Cambios Aplicados
1. **DB:** 3 índices nuevos (fecha_inicio, ot_id, informe_pago_id)
2. **enriquecimiento.js:** Refactor 108→44 líneas, solo camelCase
3. **Componentes:** Eliminados aliases snake_case, agregados Svelte keys

## Flujos a Verificar

### 1. Crear Requerimiento
- Ir a "Ingresar R"
- Seleccionar jardín, partida, cantidad
- Ingresar fecha inicio y plazo
- **Verificar:** 
  - Fecha Límite se calcula
  - Precio Total correcto
  - Guarda sin errores console

### 2. Editar Requerimiento
- En "Listado R", click editar (lápiz)
- Modificar plazo adicional o fecha inicio
- **Verificar:**
  - Dropdowns abren correctamente
  - Campos muestran valores actuales
  - Guarda cambios sin errores
  - Tabla actualiza solo fila modificada (no re-render completo)

### 3. Ordenar y Filtrar Tabla
- Click headers tabla (F.Inicio, Plazo, OT, IP)
- Filtrar por jardín
- **Verificar:**
  - Ordenamiento funciona
  - Filtros aplican correctamente
  - Sin errores console

### 4. Recepción Masiva
- "Recepción" → seleccionar múltiples
- Ingresar fecha recepción
- **Verificar:**
  - Validación fecha > fecha_inicio
  - Guarda sin errores
  - Estados actualizan

### 5. Console Errors
Abrir DevTools (Cmd+Option+I), tab Console
**Verificar:** Sin errores relacionados con:
- `jardin_nombre`, `partida_item`, `fecha_inicio` (undefined)
- `plazo_adicional`, `ot_codigo` (undefined)

## Comandos Útiles

```bash
# Ver índices DB
sqlite3 ~/Library/Application\ Support/sistema-piloto-cont-mant/database.db \
  "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%';"

# Query plan
sqlite3 ~/Library/Application\ Support/sistema-piloto-cont-mant/database.db \
  "EXPLAIN QUERY PLAN SELECT * FROM requerimientos ORDER BY fecha_inicio DESC;"

# Iniciar app
cd ~/- FLAD/03\ Tauri\ Sqlite
npm run tauri dev
```

## Resultado Esperado
✅ Todos los flujos funcionan sin errores
✅ Console sin warnings snake_case undefined
✅ Tabla re-renderiza incrementalmente
✅ Fecha Límite calcula correctamente

## Si hay Errores
1. Captura screenshot + mensaje error console
2. Identifica flujo específico que falla
3. Revisa `CHANGELOG-OPTIMIZACION-2025-10.md` línea del componente

---

**Nota:** Ya verifiqué visualmente que FormularioIngreso funciona (screenshot). Falta validar edición, ordenamiento y recepción masiva.

# Prompt: Optimización Cadena de Datos FLAD

## Contexto
Proyecto: FLAD (Sistema Piloto Control y Mantenimiento)  
Stack: Tauri 2.x + Rust + SQLite + Svelte 5  
Ubicación: `/Users/junji/- FLAD/03 Tauri Sqlite`

## Documentación Disponible
- `/docs/DATABASE-SCHEMA.md` - Estructura BD completa
- `/docs/OPTIMIZACION-DB-2025-01.md` - Optimizaciones Enero 2025
- `/docs/README.md` - Índice general

## Estado Actual Post-Optimización

### ✅ Completado
1. Índice compuesto: `(jardin_codigo, estado)` en requerimientos
2. Coherencia nomenclatura: `plazo_dias` unificado
3. 16 correcciones frontend/backend
4. Cadena verificada: SQL → Rust → Tauri → JS

### Cadena de Datos Actual
```
SQLite (snake_case)
  ↓
Rust structs (snake_case) 
  ↓
Tauri serializer (auto: snake → camel)
  ↓
tauri.js toCamel() [redundante]
  ↓
enriquecimiento.js (aliases duales)
  ↓
Componentes Svelte (camelCase/snake_case)
```

## Objetivos Próxima Sesión

### 1. Eliminar Redundancias
- [ ] Evaluar si `toCamel()` en tauri.js es necesario (Tauri 2.x ya convierte)
- [ ] Analizar si `enriquecimiento.js` puede simplificarse
- [ ] Identificar lookups N+1 en componentes

### 2. Optimizar Queries Backend
- [ ] Revisar JOINs en `RequerimientoEnriquecido`
- [ ] Evaluar si denormalización reduce queries
- [ ] Analizar índices vs query patterns reales

### 3. Performance Frontend
- [ ] Medir renders con datos reales
- [ ] Identificar re-cómputos innecesarios
- [ ] Evaluar cache de catálogos (jardines/partidas)

### 4. Estructura de Datos
- [ ] ¿`RequerimientoEnriquecido` debe existir o solo `Requerimiento`?
- [ ] ¿Frontend debe hacer lookups por ID en lugar de recibir denormalizado?
- [ ] ¿Stores Svelte para catálogos vs props drilling?

## Áreas Críticas a Analizar

### Backend (Rust)
```rust
// commands.rs - línea ~80
// Query con 3 LEFT JOINs - ¿Necesario siempre?
sqlx::query_as::<_, RequerimientoEnriquecido>(
    "SELECT r.*, p.partida, ot.codigo, ip.codigo FROM..."
)
```

### Frontend (JS)
```javascript
// enriquecimiento.js - línea 8
// Crea 40+ aliases por requerimiento - ¿Optimizable?
export async function enriquecerRequerimientos(requerimientos) {
  return requerimientos.map(req => ({
    ...req,
    // 40+ líneas de aliases...
  }));
}
```

### Componentes
- `TablaRequerimientos.svelte` - Re-renderiza tabla completa al editar 1 fila
- `FormularioIngreso.svelte` - Múltiples `$:` reactivos con overlapping deps
- `+layout.svelte` - Exportación recorre todos los datos 2 veces

## Preguntas Técnicas

1. **Serialización**: ¿Tauri 2.x convierte automáticamente snake→camel? ¿`toCamel()` es redundante?
2. **Struct Design**: ¿`RequerimientoEnriquecido` vs queries bajo demanda?
3. **Aliases**: ¿Necesarios 40+ aliases o frontend puede estandarizar en camelCase?
4. **Lookups**: ¿Frontend cachea catálogos o pide partida_nombre cada render?
5. **N+1**: ¿`enriquecerRequerimientos()` hace loops anidados?

## Métricas a Obtener

```bash
# Tamaño BD real
du -h ~/Library/Application\ Support/sistema-piloto-cont-mant/database.db

# Cantidad datos
sqlite3 database.db "SELECT 
  (SELECT COUNT(*) FROM requerimientos) as reqs,
  (SELECT COUNT(*) FROM jardines) as jardines,
  (SELECT COUNT(*) FROM partidas) as partidas"

# Queries lentas
EXPLAIN QUERY PLAN SELECT ...
```

## Comando para Ejecutar

```
Analiza la cadena de datos del proyecto FLAD ubicado en '/Users/junji/- FLAD/03 Tauri Sqlite'.

Lee la documentación en /docs para contexto.

Objetivos:
1. Identificar redundancias en serialización (toCamel duplicado)
2. Optimizar enriquecimiento.js (40+ aliases)
3. Evaluar si RequerimientoEnriquecido debe simplificarse
4. Detectar N+1 queries o loops costosos
5. Proponer mejoras sin romper funcionalidad

Prioriza:
- Performance en tablas >100 filas
- Reducir conversiones de datos
- Simplificar mantenimiento

Provee:
- Análisis con ejemplos de código
- Cambios específicos propuestos
- Impacto estimado por cambio
```

## Referencias Código Crítico

**Backend:**
- `src-tauri/src/db.rs:118-140` - struct RequerimientoEnriquecido
- `src-tauri/src/commands.rs:80-130` - get_requerimientos query

**Frontend:**
- `src/lib/api/tauri.js:22-31` - función toCamel
- `src/lib/utils/enriquecimiento.js:8-50` - enriquecerRequerimientos
- `src/lib/components/TablaRequerimientos.svelte` - render performance

**Stores:**
- `src/lib/stores/catalogos.js` - ¿Se usa cache o queries directas?

## Resultado Esperado

Documento similar a `OPTIMIZACION-DB-2025-01.md` con:
1. Análisis de puntos de mejora
2. Propuestas de refactorización
3. Código before/after
4. Estimación de beneficio
5. Plan de testing

---

**Nota:** No cambiar funcionalidad, solo optimizar flujo de datos existente.

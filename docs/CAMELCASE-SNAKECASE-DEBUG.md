# Guía de Depuración: camelCase vs snake_case

## Problema

**Backend Rust (SQLite)** usa `snake_case` → **Frontend JS/Svelte** usa `camelCase`

La función `toCamel()` en `/src/lib/api/tauri.js` convierte automáticamente respuestas, pero **NO convierte parámetros de entrada**.

## Arquitectura del Proyecto

```
Backend (Rust)          API Layer               Frontend (JS/Svelte)
─────────────────       ─────────────          ──────────────────────
snake_case         →    toCamel() transforma   camelCase
                        SOLO respuestas        
                        
snake_case params  ←    NO transforma          debe enviar snake_case
                        parámetros de entrada
```

## Reglas de Conversión Automática

### ✅ Automático (Respuestas)
```javascript
// Backend retorna:
{ ot_id: 1, fecha_recepcion: "2025-01-01" }

// Frontend recibe (auto-transformado):
{ otId: 1, fechaRecepcion: "2025-01-01" }
```

### ❌ Manual (Parámetros de entrada)
```javascript
// ❌ INCORRECTO:
db.requerimientos.update(id, {
  fechaRecepcion: "2025-01-01"  // Backend no reconoce
})

// ✅ CORRECTO:
db.requerimientos.update(id, {
  fecha_recepcion: "2025-01-01"  // Backend reconoce
})
```

## Búsqueda Masiva de Errores

### 1. Backend → Frontend (Nombres de campos)

**Buscar en Backend (Rust):**
```bash
# Buscar structs con campos snake_case
rg "pub struct.*\{" src-tauri/src/db.rs -A 20

# Buscar SELECT queries
rg "SELECT.*FROM" src-tauri/src/commands.rs -A 10
```

**Validar en Frontend que use camelCase:**
```bash
# Buscar acceso a campos
rg "\.ot_id|\.fecha_recepcion|\.jardin_codigo" src/lib --type svelte
# ❌ Si encuentra resultados = ERROR (debe ser otId, fechaRecepcion, jardinCodigo)

# Buscar correctamente en camelCase
rg "\.otId|\.fechaRecepcion|\.jardinCodigo" src/lib --type svelte
# ✅ Debe encontrar resultados
```

### 2. Frontend → Backend (Parámetros invoke)

**Buscar invocaciones incorrectas:**
```bash
# Buscar invoke con parámetros camelCase
rg "invoke\('.*',.*\{" src/lib/api/tauri.js -A 5 | rg "[A-Z]"
# ❌ Si encuentra mayúsculas en parámetros = posible ERROR
```

**Comandos correctos:**
```bash
# Ver todos los parámetros que espera Rust
rg "pub async fn (add_|update_|crear_)" src-tauri/src/commands.rs -A 10
```

### 3. Filtros y Funciones Helper

**Buscar filtros con nombres incorrectos:**
```bash
# En db-helpers.js y componentes
rg "\.filter\(.*=>.*\.(ot_id|fecha_recepcion|orden_trabajo_id)" src/lib
# ❌ Si encuentra = ERROR (debe usar otId, fechaRecepcion, ordenTrabajoId)
```

## Errores Comunes por Archivo

### `/src/lib/api/tauri.js`

**Patrón de error:**
```javascript
// ❌ INCORRECTO:
invoke('update_requerimiento', {
  fechaRecepcion: data.fechaRecepcion  
})

// ✅ CORRECTO:
invoke('update_requerimiento', {
  fecha_recepcion: data.fechaRecepcion  
})
```

**Búsqueda:**
```bash
# Ver todos los invoke
rg "invoke\(" src/lib/api/tauri.js -A 3

# Verificar parámetros uno por uno
cat src/lib/api/tauri.js | grep -E "^\s+[a-z][a-zA-Z]+:"
```

### `/src/lib/utils/db-helpers.js`

**Patrón de error:**
```javascript
// ❌ INCORRECTO:
reqs.filter(r => r.ordenTrabajoId && !r.fechaRecepcion)

// ✅ CORRECTO:
reqs.filter(r => r.otId && !r.fechaRecepcion)
```

**Búsqueda:**
```bash
# Buscar filtros con nombres sospechosos
rg "\.filter|\.map|\.find" src/lib/utils/db-helpers.js -A 2
```

### Componentes `.svelte`

**Patrón de error:**
```javascript
// ❌ INCORRECTO:
const detalle = await getOrdenTrabajoDetalle(orden.id);
orden.tieneAtrasados = detalle.requerimientos.some(...)

// ✅ CORRECTO (si backend retorna array directo):
const requerimientos = await getOrdenTrabajoDetalle(orden.id);
orden.tieneAtrasados = requerimientos.some(...)
```

**Búsqueda:**
```bash
# Buscar acceso a propiedades
rg "\.[a-z]+_[a-z]+" src/lib/components --type svelte
# ❌ Si encuentra snake_case = ERROR

# Buscar detalle.requerimientos cuando no existe
rg "detalle\.requerimientos" src/lib/components
```

## Tabla de Conversión Frecuente

| Backend (snake_case) | Frontend (camelCase) | Uso |
|---------------------|---------------------|-----|
| `ot_id` | `otId` | ID de orden trabajo |
| `fecha_recepcion` | `fechaRecepcion` | Fecha de recepción |
| `fecha_inicio` | `fechaInicio` | Fecha de inicio |
| `fecha_limite` | `fechaLimite` | Fecha límite |
| `jardin_codigo` | `jardinCodigo` | Código jardín |
| `partida_item` | `partidaItem` | Item de partida |
| `precio_unitario` | `precioUnitario` | Precio unitario |
| `precio_total` | `precioTotal` | Precio total |
| `plazo_dias` | `plazoDias` | Plazo en días |
| `plazo_adicional` | `plazoAdicional` | Plazo adicional |
| `dias_atraso` | `diasAtraso` | Días de atraso |
| `created_at` | `createdAt` | Fecha creación |
| `updated_at` | `updatedAt` | Fecha actualización |
| `orden_trabajo_id` | ❌ NO USAR | Usar `otId` |

## Checklist de Validación

### Al agregar nuevo campo en BD:

- [ ] Backend Rust: Define campo en snake_case
- [ ] Backend SQL: Usa snake_case en queries
- [ ] API tauri.js: 
  - [ ] Respuesta: se auto-convierte (no tocar)
  - [ ] Parámetro entrada: usar snake_case
- [ ] db-helpers.js: Acceder en camelCase
- [ ] Componentes: Acceder en camelCase

### Al depurar error "undefined":

1. Verificar nombre en Backend (Rust struct/query)
2. Verificar conversión automática esperada
3. Buscar acceso incorrecto en frontend:
   ```bash
   rg "\.[campo_incorrecto]" src/lib
   ```
4. Verificar parámetros en invoke:
   ```bash
   rg "invoke.*[campo]" src/lib/api/tauri.js -A 5
   ```

## Scripts de Corrección Masiva

### Encontrar todos los snake_case en frontend:
```bash
#!/bin/bash
# Guardar como: scripts/find-snake-case-errors.sh

echo "=== Buscando snake_case en componentes Svelte ==="
rg "\.[a-z]+_[a-z]+" src/lib/components --type svelte -n

echo "\n=== Buscando snake_case en utils ==="
rg "\.[a-z]+_[a-z]+" src/lib/utils -n

echo "\n=== Buscando parámetros camelCase en invoke ==="
rg "invoke\('.*',.*\{" src/lib/api/tauri.js -A 10 | rg "^\s+[a-z][A-Z]"
```

### Generar lista de reemplazos:
```bash
#!/bin/bash
# Guardar como: scripts/generate-replacements.sh

# Extraer campos de backend
echo "=== Campos Backend (snake_case) ==="
rg "pub (struct|enum)" src-tauri/src/db.rs -A 20 | rg "pub [a-z_]+:" | cut -d: -f1 | awk '{print $2}'

# Buscar accesos en frontend
echo "\n=== Accesos Frontend ==="
rg "\.\w+" src/lib --type svelte | cut -d. -f2 | sort -u
```

## Notas Importantes

1. **Respuestas siempre camelCase:** Backend→Frontend se transforma automáticamente
2. **Parámetros siempre snake_case:** Frontend→Backend debe enviar snake_case
3. **db-helpers.js es la capa intermedia:** Debe trabajar con camelCase (ya transformado)
4. **Componentes siempre camelCase:** Nunca acceder a snake_case
5. **api/tauri.js es el puente crítico:** Aquí ocurren la mayoría de errores

## Ejemplos Reales del Proyecto

### Error 1: ordenTrabajoId vs otId
```javascript
// ❌ INCORRECTO:
let filtrados = reqs.filter(r => r.ordenTrabajoId && !r.fechaRecepcion);

// ✅ CORRECTO:
let filtrados = reqs.filter(r => r.otId && !r.fechaRecepcion);

// Razón: Backend retorna "ot_id" → toCamel() → "otId" (no "ordenTrabajoId")
```

### Error 2: detalle.requerimientos cuando es array directo
```javascript
// Backend retorna: Vec<RequerimientoEnriquecido>
// Es decir: [req1, req2, req3]

// ❌ INCORRECTO en componente:
const detalle = await getOrdenTrabajoDetalle(otId);
detalle.requerimientos.forEach(...)

// ✅ CORRECTO - Opción A (wrapper en db-helpers.js):
export async function getOrdenTrabajoDetalle(otId) {
  const requerimientos = await db.ordenesTrabajo.getDetalle(otId);
  return { requerimientos };
}

// ✅ CORRECTO - Opción B (usar directo):
const requerimientos = await getOrdenTrabajoDetalle(otId);
requerimientos.forEach(...)
```

### Error 3: Parámetros en update
```javascript
// ❌ INCORRECTO:
invoke('update_requerimiento', {
  id,
  fechaRecepcion: data.fechaRecepcion,  // Backend no reconoce
  precioUnitario: data.precioUnitario   // Backend no reconoce
})

// ✅ CORRECTO:
invoke('update_requerimiento', {
  id,
  fecha_recepcion: data.fechaRecepcion,  // snake_case
  precio_unitario: data.precioUnitario   // snake_case
})
```

## Herramientas de Verificación

### VSCode Search & Replace

**Buscar snake_case en archivos JS/Svelte:**
```regex
Regex: \.[a-z]+_[a-z]+
Files: src/lib/**/*.{js,svelte}
```

**Buscar camelCase en parámetros invoke:**
```regex
Regex: invoke\('[^']+',\s*\{[^}]*[a-z][A-Z]
Files: src/lib/api/tauri.js
```

### Desktop Commander Commands

```bash
# Buscar snake_case en frontend
start_search(path="/path/to/src/lib", pattern="\\.[a-z]+_[a-z]+", searchType="content")

# Buscar invoke con parámetros
start_search(path="/path/to/src/lib/api", pattern="invoke.*{", searchType="content")
```

## Última Actualización

- Documento creado: 2025-10-20
- Errores documentados: ordenTrabajoId, detalle.requerimientos, parámetros update
- Proyecto: FLAD - Sistema Piloto Contratistas Mantenimiento

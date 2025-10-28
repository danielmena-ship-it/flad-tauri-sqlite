# Guía de Corrección: camelCase Post-Migración Dexie → SQLite

**Proyecto:** FLAD - Tauri 2.x + SQLite + Svelte  
**Fecha:** 2025-10-20  
**Problema:** 1,088 errores de snake_case residuales de migración Dexie

---

## 🎯 DIAGNÓSTICO

### Causa Raíz
Durante la migración Dexie → SQLite:
- ✅ Se eliminaron métodos Dexie (`.toArray()`, `.where()`)
- ✅ Se implementó `toCamel()` en respuestas backend
- ❌ **NO se actualizaron accesos a propiedades en componentes**

### Comportamiento de Dexie vs SQLite

```javascript
// ANTES (Dexie/IndexedDB)
// Acceso directo a columnas SQLite en snake_case
const req = await db.requerimientos.get(1);
req.fecha_inicio    // ✓ Funcionaba (columna real en BD)
req.ot_id           // ✓ Funcionaba
req.partida_item    // ✓ Funcionaba

// AHORA (SQLite + toCamel)
// Backend transforma snake_case → camelCase
const req = await db.requerimientos.getById(1);
req.fecha_inicio    // ✗ undefined (no existe)
req.fechaInicio     // ✓ Correcto (transformado)
req.otId            // ✓ Correcto
req.partidaItem     // ✓ Correcto
```

---

## 📊 ERRORES ENCONTRADOS

### Búsqueda 1: snake_case en frontend
```bash
Pattern: \.[a-z]+_[a-z]+
Ubicación: src/lib/**/*.{js,svelte}
Resultados: 1,088 coincidencias en 209 matches
```

**Archivos críticos:**
- `RecepcionIngreso.svelte` (26+ errores)
- `ModalEditarInforme.svelte` (12+ errores)
- `IngresarPago.svelte` (múltiples errores)

### Búsqueda 2: Parámetros en invoke()
```bash
Pattern: invoke\(.*\{[^}]*[a-z][A-Z]
Ubicación: src/lib/api/tauri.js
Resultados: 81 coincidencias en 9 matches
```

**Problema:** `tauri.js` tiene comentario "TODOS los parámetros en camelCase" pero según `CAMELCASE-SNAKECASE-DEBUG.md`, parámetros deben ser snake_case.

---

## 🔧 PLAN DE CORRECCIÓN

### Fase 1: Validar Arquitectura API (CRÍTICO)

**Objetivo:** Determinar si `tauri.js` tiene error arquitectural

**Verificar en Backend Rust:**
```bash
# Ver qué espera el backend
rg "pub async fn (add_|update_|crear_)" src-tauri/src/commands.rs -A 10
```

**Decisión:**
- Si backend espera `snake_case` → Corregir `tauri.js` inmediatamente
- Si backend espera `camelCase` → `tauri.js` está correcto

### Fase 2: Corrección Masiva de Componentes

**Tabla de Reemplazos Prioritarios:**

| snake_case (ERROR) | camelCase (CORRECTO) | Contexto |
|-------------------|---------------------|----------|
| `.fecha_inicio` | `.fechaInicio` | Fecha inicio requerimiento |
| `.fecha_recepcion` | `.fechaRecepcion` | Fecha recepción |
| `.fecha_limite` | `.fechaLimite` | Fecha límite |
| `.ot_id` | `.otId` | ID orden trabajo |
| `.orden_trabajo_id` | `.otId` | ⚠️ NO usar ordenTrabajoId |
| `.partida_item` | `.partidaItem` | Item de partida |
| `.partida_unidad` | `.partidaUnidad` | Unidad de partida |
| `.jardin_codigo` | `.jardinCodigo` | Código jardín |
| `.precio_unitario` | `.precioUnitario` | Precio unitario |
| `.precio_total` | `.precioTotal` | Precio total |
| `.plazo_dias` | `.plazoDias` | Plazo en días |
| `.plazo_adicional` | `.plazoAdicional` | Plazo adicional |
| `.dias_atraso` | `.diasAtraso` | Días de atraso |
| `.created_at` | `.createdAt` | Timestamp creación |
| `.updated_at` | `.updatedAt` | Timestamp actualización |

---

## 📝 CORRECCIONES POR ARCHIVO

### RecepcionIngreso.svelte

**Errores detectados (líneas 20-270):**

```javascript
// LÍNEA 26 - ❌ INCORRECTO
.map(id => requerimientos.find(r => r.id === id)?.fecha_inicio)

// ✅ CORRECTO
.map(id => requerimientos.find(r => r.id === id)?.fechaInicio)

// LÍNEA 119 - ❌ INCORRECTO
fecha_recepcion: fechaRecepcionCompartida,

// ✅ CORRECTO
fechaRecepcion: fechaRecepcionCompartida,

// LÍNEA 129-130 - ❌ INCORRECTO
const fechaInicio = req.fecha_inicio;
const fechaRecepcion = item.fecha_recepcion;

// ✅ CORRECTO
const fechaInicio = req.fechaInicio;
const fechaRecepcion = item.fechaRecepcion;

// LÍNEAS 264-270 - ❌ INCORRECTO (template HTML)
<td>{req.ot_id}</td>
<td>{req.partida_item}</td>
<td>{req.partida_unidad}</td>
<td>{req.fecha_inicio}</td>
<td>{req.fecha_limite}</td>

// ✅ CORRECTO
<td>{req.otId}</td>
<td>{req.partidaItem}</td>
<td>{req.partidaUnidad}</td>
<td>{req.fechaInicio}</td>
<td>{req.fechaLimite}</td>
```

### ModalEditarInforme.svelte

**Errores detectados (líneas 28, 89, 111-112, 134-135):**

```javascript
// LÍNEA 28 - ❌ INCORRECTO
jardinCodigo: informe.jardin_codigo

// ✅ CORRECTO
jardinCodigo: informe.jardinCodigo

// LÍNEA 89 - ❌ INCORRECTO
<p><strong>Jardín:</strong> {informe.jardin_codigo}</p>

// ✅ CORRECTO
<p><strong>Jardín:</strong> {informe.jardinCodigo}</p>

// LÍNEAS 111-112, 134-135 - ❌ INCORRECTO (repetido)
<span>{req.partida_item}</span>
<span>{req.partida_unidad}</span>

// ✅ CORRECTO
<span>{req.partidaItem}</span>
<span>{req.partidaUnidad}</span>
```

### IngresarPago.svelte

**Patrón común:**
```javascript
// ❌ Todos los accesos a campos en templates
{informe.fecha_creacion}
{informe.jardin_codigo}

// ✅ Corregir a
{informe.fechaCreacion}
{informe.jardinCodigo}
```

---

## 🛠️ METODOLOGÍA DE CORRECCIÓN

### Opción A: Corrección Manual Guiada

**1. Buscar por archivo:**
```bash
# Buscar todos los snake_case en un archivo específico
rg "\.[a-z]+_[a-z]+" src/lib/components/RecepcionIngreso.svelte
```

**2. Reemplazar con editor:**
- Usar búsqueda/reemplazo con regex
- Validar cada reemplazo manualmente
- Probar funcionalmente después de cada archivo

**Ventaja:** Control total, evita sobre-correcciones  
**Desventaja:** Lento (1,088 instancias)

### Opción B: Script de Corrección Automática

**Script bash con validación:**
```bash
#!/bin/bash
# fix-camelcase.sh

# Mapeo de reemplazos
declare -A REPLACEMENTS=(
  [".fecha_inicio"]=".fechaInicio"
  [".fecha_recepcion"]=".fechaRecepcion"
  [".fecha_limite"]=".fechaLimite"
  [".ot_id"]=".otId"
  [".orden_trabajo_id"]=".otId"
  [".partida_item"]=".partidaItem"
  [".partida_unidad"]=".partidaUnidad"
  [".jardin_codigo"]=".jardinCodigo"
  [".precio_unitario"]=".precioUnitario"
  [".precio_total"]=".precioTotal"
  [".plazo_dias"]=".plazoDias"
  [".plazo_adicional"]=".plazoAdicional"
  [".dias_atraso"]=".diasAtraso"
  [".created_at"]=".createdAt"
  [".updated_at"]=".updatedAt"
)

# Archivos a procesar
FILES="src/lib/components/*.svelte src/lib/utils/*.js"

# Crear backup
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r src/lib "$BACKUP_DIR/"

# Aplicar reemplazos
for pattern in "${!REPLACEMENTS[@]}"; do
  replacement="${REPLACEMENTS[$pattern]}"
  echo "Reemplazando: $pattern → $replacement"
  
  find src/lib -type f \( -name "*.svelte" -o -name "*.js" \) -exec sed -i '' "s/${pattern}/${replacement}/g" {} +
done

echo "✅ Corrección completa. Backup en: $BACKUP_DIR"
echo "⚠️  Verificar con: npm run dev"
```

**Ventaja:** Rápido, consistente  
**Desventaja:** Requiere validación post-ejecución

### Opción C: Corrección Híbrida (RECOMENDADA)

**1. Script automático para casos obvios (90%)**
**2. Revisión manual de casos ambiguos (10%)**
**3. Testing incremental por módulo**

---

## ✅ VALIDACIÓN POST-CORRECCIÓN

### 1. Búsquedas de Verificación

```bash
# No debe retornar resultados
rg "\.[a-z]+_[a-z]+" src/lib/components --type svelte
rg "\.[a-z]+_[a-z]+" src/lib/utils --type js

# Verificar que existan accesos correctos
rg "\.fechaInicio" src/lib
rg "\.otId" src/lib
rg "\.partidaItem" src/lib
```

### 2. Testing Funcional

**Probar cada módulo:**
- [ ] Módulo Recepción/Ingreso
- [ ] Módulo Informes de Pago
- [ ] Módulo Órdenes de Trabajo
- [ ] Módulo Requerimientos

**Verificar:**
- Carga de datos sin `undefined`
- Filtros funcionando
- Ordenamiento correcto
- Formularios guardando

### 3. Console DevTools

**Buscar errores:**
```javascript
// No debe aparecer:
"Cannot read property 'fecha_inicio' of undefined"
"TypeError: req.ot_id is undefined"
```

---

## 🚨 CASOS ESPECIALES

### 1. orden_trabajo_id vs otId

**Problema:** Backend retorna `ot_id`, NO `orden_trabajo_id`

```javascript
// ❌ NUNCA USAR
req.ordenTrabajoId  // No existe en respuesta backend

// ✅ SIEMPRE USAR
req.otId  // Transformación de ot_id → otId
```

### 2. Parámetros en invoke() - PENDIENTE VALIDACIÓN

**Según CAMELCASE-SNAKECASE-DEBUG.md:**
```javascript
// Backend espera snake_case
invoke('update_requerimiento', {
  id,
  fecha_recepcion: data.fechaRecepcion,  // snake_case
  precio_unitario: data.precioUnitario   // snake_case
})
```

**Estado actual en tauri.js:**
```javascript
// Usando camelCase (¿error?)
crear: (data) => invoke('crear_orden_trabajo', {
  jardinCodigo: data.jardinCodigo,
  fechaCreacion: data.fechaCreacion
})
```

**Acción requerida:** Validar con backend Rust qué convención espera.

### 3. Arrays y Objetos Anidados

```javascript
// Si backend retorna array de objetos
const reqs = await db.requerimientos.getAll();

// ✅ CORRECTO - cada objeto ya está en camelCase
reqs.forEach(r => {
  console.log(r.fechaInicio);  // ✓
  console.log(r.otId);          // ✓
});

// ❌ INCORRECTO
reqs.forEach(r => {
  console.log(r.fecha_inicio);  // undefined
});
```

---

## 📋 CHECKLIST DE EJECUCIÓN

### Pre-corrección
- [ ] Hacer backup completo de `src/lib`
- [ ] Commit en git del estado actual
- [ ] Documentar errores actuales en console

### Durante corrección
- [ ] Ejecutar script de corrección O corrección manual
- [ ] Validar cada archivo modificado
- [ ] Probar en dev después de cada módulo

### Post-corrección
- [ ] Ejecutar búsquedas de verificación (0 resultados)
- [ ] Testing funcional completo
- [ ] Verificar console sin errores undefined
- [ ] Actualizar documentación si hay cambios

---

## 📚 REFERENCIAS

- `CAMELCASE-SNAKECASE-DEBUG.md` - Arquitectura de conversión
- `DEBUG-GUIDE-DB-MIGRATION.md` - Historial migración Dexie
- Backend: `src-tauri/src/commands.rs` - Firmas de funciones
- API: `src/lib/api/tauri.js` - Transformación toCamel()

---

## 🎯 PRÓXIMOS PASOS

1. **CRÍTICO:** Validar convención de parámetros en `tauri.js`
2. **EJECUTAR:** Corrección masiva de snake_case → camelCase
3. **TESTING:** Validación funcional completa
4. **DOCUMENTAR:** Actualizar guías con lecciones aprendidas

---

**Última actualización:** 2025-10-20  
**Estado:** Pendiente de ejecución  
**Responsable:** Validar con equipo antes de ejecutar correcciones masivas

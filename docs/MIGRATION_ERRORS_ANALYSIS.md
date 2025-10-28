# Meta-Análisis: Errores de Migración Dexie → SQLite

**Proyecto:** FLAD - Sistema de Requerimientos  
**Fecha:** 2025-10-20  
**Tecnologías:** Tauri 2.x + SQLite (Rust) + Svelte/JS

---

## 1. ARQUITECTURA POST-MIGRACIÓN

### Backend (Rust/SQLite)
- Base de datos: SQLite
- Convención: `snake_case`
- Ejemplos: `jardin_codigo`, `fecha_inicio`, `plazo_dias`

### Frontend (Svelte/JavaScript)
- Framework: Svelte + JavaScript
- Convención: `camelCase`
- Ejemplos: `jardinCodigo`, `fechaInicio`, `plazoDias`

### Bridge Layer (`tauri.js`)
```javascript
function toCamel(obj) {
  // Convierte snake_case → camelCase automáticamente
}
```

---

## 2. ERROR CRÍTICO IDENTIFICADO

### Problema: Campos `undefined` en tablas

**Síntoma:**
```
Columna "Jardín" mostraba: undefined
```

**Causa raíz:**
El archivo `enriquecimiento.js` solo definía aliases en `snake_case`, pero los componentes Svelte usaban `camelCase`.

**Ejemplo del error:**
```javascript
// enriquecimiento.js (ANTES)
jardin_nombre: jardinesMap[req.jardinCodigo] || 'undefined',
// ❌ Falta: jardinNombre

// TablaRequerimientos.svelte
<td>{req.jardinNombre}</td>  // ← undefined
```

---

## 3. CAMPOS AFECTADOS

### 3.1 Requerimientos
| Campo Backend | Snake Alias | Camel Alias | Estado |
|---------------|-------------|-------------|--------|
| jardin_codigo | ✓ | jardinCodigo (auto) | ✓ OK |
| jardin_nombre | ✓ jardin_nombre | ❌→✓ jardinNombre | CORREGIDO |
| partida_item | ✓ partida_item | partidaItem (auto) | ✓ OK |
| partida_nombre | ✓ partida_nombre | ❌→✓ partidaNombre | CORREGIDO |
| partida_unidad | ✓ partida_unidad | ❌→✓ partidaUnidad | CORREGIDO |

### 3.2 Órdenes de Trabajo
| Campo | Snake | Camel | Estado |
|-------|-------|-------|--------|
| jardin_nombre | ✓ | ❌→✓ jardinNombre | CORREGIDO |

### 3.3 Informes de Pago
| Campo | Snake | Camel | Estado |
|-------|-------|-------|--------|
| jardin_nombre | ✓ | ❌→✓ jardinNombre | CORREGIDO |

---

## 4. PATRÓN DEL ERROR

### Ciclo de vida de los datos:

```
1. SQLite (snake_case)
   ↓
2. Rust → JSON (snake_case)
   ↓
3. toCamel() → Frontend (camelCase)
   ↓
4. enriquecimiento.js (AQUÍ FALLABA)
   ↓
5. Componentes Svelte
```

### Error específico:
`enriquecimiento.js` agregaba **campos calculados** solo en snake_case, causando que componentes que esperaban camelCase recibieran `undefined`.

---

## 5. SOLUCIÓN IMPLEMENTADA

### 5.1 Archivo: `enriquecimiento.js`

**ANTES:**
```javascript
return requerimientos.map(req => ({
  ...req,
  jardin_nombre: jardinesMap[req.jardinCodigo] || 'undefined',
  // ❌ Falta jardinNombre
}));
```

**DESPUÉS:**
```javascript
return requerimientos.map(req => ({
  ...req,
  jardin_nombre: jardinesMap[req.jardinCodigo] || 'undefined',
  jardinNombre: jardinesMap[req.jardinCodigo] || 'undefined',  // ✓ Agregado
  
  partida_nombre: req.partidaNombre || req.partidaItem,
  partidaNombre: req.partidaNombre || req.partidaItem,  // ✓ Agregado
  
  partida_unidad: req.partidaUnidad,
  partidaUnidad: req.partidaUnidad,  // ✓ Agregado
}));
```

### 5.2 Estrategia: Doble Alias

**Regla:** Todo campo calculado debe tener ambas versiones:
- `snake_case` (compatibilidad legacy/SQL)
- `camelCase` (uso en componentes modernos)

---

## 6. ARCHIVOS MODIFICADOS

1. `/src/lib/utils/enriquecimiento.js`
   - `enriquecerRequerimientos()` - 3 campos
   - `enriquecerOrdenTrabajo()` - 1 campo
   - `enriquecerInformePago()` - 1 campo

---

## 7. DETECCIÓN DE ERRORES SIMILARES

### Método de búsqueda:
```bash
# Buscar uso de camelCase en componentes
grep -r "req\.\w*[A-Z]" src/lib/components/

# Comparar con campos en enriquecimiento.js
```

### Componentes revisados:
- ✓ TablaRequerimientos.svelte
- ✓ TablaOrdenTrabajo.svelte
- ✓ ListaPago.svelte
- ✓ ListaRecepcion.svelte
- ✓ IngresarPago.svelte
- ✓ ModalEditarInforme.svelte

---

## 8. RECOMENDACIONES

### 8.1 Prevención
1. **Linter rule:** Validar que todo campo calculado tenga doble alias
2. **Tests unitarios:** Verificar existencia de campos en objetos enriquecidos
3. **TypeScript:** Considerar migrar para type safety

### 8.2 Convención de código
```javascript
// ESTÁNDAR para campos calculados
export function enriquecer(obj) {
  return {
    ...obj,
    // Siempre ambas versiones:
    campo_calculado: valor,
    campoCalculado: valor,
  };
}
```

### 8.3 Documentación
- Backend siempre snake_case
- Frontend siempre camelCase
- Enriquecimiento provee ambos
- `toCamel()` convierte automático (solo campos del DB)
- Campos calculados requieren definición manual

---

## 9. CHECKLIST DE MIGRACIÓN

Para futuros cambios similares:

- [ ] Identificar campos del backend (snake_case)
- [ ] Verificar conversión automática (`toCamel`)
- [ ] Buscar campos calculados en enriquecimiento
- [ ] Asegurar doble alias (snake + camel)
- [ ] Buscar uso en componentes (grep por camelCase)
- [ ] Probar en UI que no haya "undefined"
- [ ] Documentar en este archivo

---

## 10. MÉTRICAS

**Tiempo de detección:** ~15 min  
**Archivos afectados:** 1 core + 6 componentes  
**Líneas modificadas:** 9 líneas  
**Impacto:** CRÍTICO (datos visibles incorrectos)  
**Severidad:** ALTA (afecta UX directamente)  

---

## 11. LESSONS LEARNED

1. **La conversión automática no cubre campos calculados**
   - `toCamel()` solo procesa lo que viene del DB
   - Campos generados necesitan definición explícita

2. **Ambos formatos son necesarios**
   - Código legacy puede usar snake_case
   - Código moderno usa camelCase
   - Mantener ambos evita breakages

3. **Validación visual es insuficiente**
   - "undefined" puede pasar desapercibido
   - Tests automatizados son necesarios

---

**Status:** ✅ RESUELTO  
**Próxima revisión:** Cuando se agreguen nuevos campos calculados

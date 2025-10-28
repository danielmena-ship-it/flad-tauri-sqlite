# Estructura Base de Datos FLAD
**Sistema:** Sistema Piloto de Control y Mantenimiento  
**Motor:** SQLite 3  
**Ubicación:** `~/Library/Application Support/sistema-piloto-cont-mant/database.db`

---

## Tablas (7)

### 1. configuracion_contrato
**Tipo:** Singleton (id=1)  
**Propósito:** Configuración global del sistema

```sql
CREATE TABLE configuracion_contrato (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    titulo TEXT NOT NULL DEFAULT 'Contrato Mantención',
    prefijo_correlativo TEXT NOT NULL DEFAULT 'M',
    contratista TEXT NOT NULL DEFAULT '',
    ito_nombre TEXT,
    firma_png BLOB,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Constraints:**
- `id = 1` (singleton)
- Firma almacenada como PNG binario

---

### 2. jardines
**Propósito:** Catálogo de proyectos/ubicaciones

```sql
CREATE TABLE jardines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Índices:**
- `idx_jardines_codigo` ON codigo

**Relaciones:**
- ← `recintos.jardin_codigo`
- ← `requerimientos.jardin_codigo`
- ← `ordenes_trabajo.jardin_codigo`
- ← `informes_pago.jardin_codigo`

---

### 3. partidas
**Propósito:** Catálogo de ítems/productos

```sql
CREATE TABLE partidas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item TEXT NOT NULL UNIQUE,
    partida TEXT NOT NULL,
    unidad TEXT,
    precio_unitario REAL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Índices:**
- `idx_partidas_item` ON item

**Relaciones:**
- ← `requerimientos.partida_item`

---

### 4. recintos
**Propósito:** Subdivisiones dentro de jardines

```sql
CREATE TABLE recintos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jardin_codigo TEXT NOT NULL,
    nombre TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (jardin_codigo) REFERENCES jardines(codigo) ON DELETE CASCADE
);
```

**Índices:**
- `idx_recintos_jardin` ON jardin_codigo

**Relaciones:**
- → `jardines.codigo` (FK CASCADE)

---

### 5. ordenes_trabajo
**Propósito:** Agrupación de requerimientos para ejecución

```sql
CREATE TABLE ordenes_trabajo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    jardin_codigo TEXT NOT NULL,
    fecha_creacion TEXT NOT NULL,
    observaciones TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (jardin_codigo) REFERENCES jardines(codigo) ON DELETE CASCADE
);
```

**Índices:**
- `idx_ot_codigo` ON codigo
- `idx_ot_jardin` ON jardin_codigo

**Formato código:** `OT-{jardin}-{prefijo}{correlativo}`  
**Ejemplo:** `OT-JD001-M001`

**Relaciones:**
- → `jardines.codigo` (FK CASCADE)
- ← `requerimientos.ot_id`

---

### 6. informes_pago
**Propósito:** Consolidación financiera de requerimientos recepcionados

```sql
CREATE TABLE informes_pago (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    jardin_codigo TEXT NOT NULL,
    fecha_creacion TEXT NOT NULL,
    neto REAL NOT NULL DEFAULT 0,
    utilidades REAL NOT NULL DEFAULT 0,
    iva REAL NOT NULL DEFAULT 0,
    total_final REAL NOT NULL DEFAULT 0,
    observaciones TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (jardin_codigo) REFERENCES jardines(codigo) ON DELETE CASCADE
);
```

**Índices:**
- `idx_informe_codigo` ON codigo
- `idx_informe_jardin` ON jardin_codigo

**Formato código:** `IP-{jardin}-{prefijo}{correlativo}`  
**Ejemplo:** `IP-JD001-M01`

**Cálculos:**
- `utilidades = neto × 0.10` (10%)
- `iva = (neto + utilidades) × 0.19` (19%)
- `total_final = neto + utilidades + iva`

**Relaciones:**
- → `jardines.codigo` (FK CASCADE)
- ← `requerimientos.informe_pago_id`

---

### 7. requerimientos ⭐
**Propósito:** TABLA CENTRAL - Requerimientos de mantención

```sql
CREATE TABLE requerimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jardin_codigo TEXT NOT NULL,
    recinto TEXT,
    partida_item TEXT NOT NULL,
    cantidad REAL NOT NULL DEFAULT 0,
    precio_unitario REAL NOT NULL DEFAULT 0,
    precio_total REAL NOT NULL DEFAULT 0,
    fecha_inicio TEXT NOT NULL,
    fecha_registro TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    ot_id INTEGER,
    informe_pago_id INTEGER,
    fecha_recepcion TEXT,
    plazo_dias INTEGER DEFAULT 0,
    plazo_adicional INTEGER DEFAULT 0,
    plazo_total INTEGER DEFAULT 0,
    fecha_limite TEXT,
    multa REAL DEFAULT 0,
    descripcion TEXT,
    observaciones TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (jardin_codigo) REFERENCES jardines(codigo) ON DELETE CASCADE,
    FOREIGN KEY (partida_item) REFERENCES partidas(item) ON DELETE CASCADE,
    FOREIGN KEY (ot_id) REFERENCES ordenes_trabajo(id) ON DELETE SET NULL,
    FOREIGN KEY (informe_pago_id) REFERENCES informes_pago(id) ON DELETE SET NULL
);
```

**Índices (6):**
- `idx_req_jardin` ON jardin_codigo
- `idx_req_estado` ON estado
- `idx_req_jardin_estado` ON (jardin_codigo, estado) ← compuesto
- `idx_req_partida` ON partida_item
- `idx_req_ot` ON ot_id
- `idx_req_informe` ON informe_pago_id

**Estados válidos:**
- `pendiente` - Sin asignar
- `en_ot` - Vinculado a orden trabajo
- `en_informe` - Vinculado a informe pago

**Relaciones:**
- → `jardines.codigo` (FK CASCADE)
- → `partidas.item` (FK CASCADE)
- → `ordenes_trabajo.id` (FK SET NULL)
- → `informes_pago.id` (FK SET NULL)

---

## Triggers (4)

### 1. actualizar_plazo_total_insert
**Dispara:** AFTER INSERT ON requerimientos

```sql
UPDATE requerimientos 
SET plazo_total = COALESCE(plazo_dias, 0) + COALESCE(plazo_adicional, 0),
    fecha_limite = date(fecha_inicio, '+' || plazo_total || ' days'),
    precio_total = cantidad * precio_unitario
WHERE id = NEW.id;
```

### 2. actualizar_plazo_total_update
**Dispara:** AFTER UPDATE OF plazo_dias, plazo_adicional, fecha_inicio, cantidad, precio_unitario

```sql
-- Mismo cálculo que INSERT
```

### 3. calcular_multa_insert
**Dispara:** AFTER INSERT ON requerimientos WHEN fecha_recepcion IS NOT NULL

```sql
SET multa = MAX(
    dias_atraso × $7,500,
    dias_atraso × (precio_total / plazo_total)
)
WHERE fecha_recepcion > fecha_limite
```

### 4. calcular_multa_update
**Dispara:** AFTER UPDATE OF fecha_recepcion, fecha_inicio, plazo_dias, plazo_adicional, precio_total

```sql
-- Mismo cálculo que INSERT
```

---

## Diagrama Relacional

```
configuracion_contrato (singleton)
    └─ prefijo_correlativo → ordenes_trabajo.codigo
                          → informes_pago.codigo

jardines
    ├─ codigo → recintos.jardin_codigo
    ├─ codigo → requerimientos.jardin_codigo
    ├─ codigo → ordenes_trabajo.jardin_codigo
    └─ codigo → informes_pago.jardin_codigo

partidas
    └─ item → requerimientos.partida_item

ordenes_trabajo
    └─ id → requerimientos.ot_id

informes_pago
    └─ id → requerimientos.informe_pago_id

requerimientos (CENTRAL)
    ├─ jardin_codigo → jardines.codigo
    ├─ partida_item → partidas.item
    ├─ ot_id → ordenes_trabajo.id
    └─ informe_pago_id → informes_pago.id
```

---

## Flujo de Trabajo

### 1. Setup Inicial
```sql
INSERT jardines (codigo, nombre)
INSERT partidas (item, partida, unidad, precio_unitario)
INSERT recintos (jardin_codigo, nombre)
```

### 2. Ingreso Requerimiento
```sql
INSERT requerimientos (
    jardin_codigo,
    recinto,
    partida_item,
    cantidad,
    precio_unitario,
    fecha_inicio,
    plazo_dias,
    fecha_registro
)
-- Triggers calculan: plazo_total, fecha_limite, precio_total
```

### 3. Crear Orden Trabajo
```sql
BEGIN TRANSACTION;
INSERT ordenes_trabajo (codigo, jardin_codigo, fecha_creacion)
UPDATE requerimientos SET ot_id = ?, estado = 'en_ot' WHERE id IN (...)
COMMIT;
```

### 4. Recepción
```sql
UPDATE requerimientos SET fecha_recepcion = ?
-- Trigger calcula: multa (si aplica)
```

### 5. Crear Informe Pago
```sql
BEGIN TRANSACTION;
INSERT informes_pago (codigo, jardin_codigo, neto, utilidades, iva, total_final)
UPDATE requerimientos SET informe_pago_id = ?, estado = 'en_informe' WHERE id IN (...)
COMMIT;
```

---

## Campos Calculados Automáticos

| Campo | Trigger | Fórmula |
|-------|---------|---------|
| precio_total | INSERT/UPDATE | cantidad × precio_unitario |
| plazo_total | INSERT/UPDATE | plazo_dias + plazo_adicional |
| fecha_limite | INSERT/UPDATE | fecha_inicio + plazo_total días |
| multa | INSERT/UPDATE | MAX(días_atraso × $7500, días_atraso × precio_diario) |

---

## Integridad Referencial

### CASCADE (elimina hijos)
- jardines → recintos
- jardines → requerimientos
- jardines → ordenes_trabajo
- jardines → informes_pago
- partidas → requerimientos

### SET NULL (desvincula)
- ordenes_trabajo → requerimientos.ot_id
- informes_pago → requerimientos.informe_pago_id

---

## Convenciones de Datos

### Fechas
**Formato:** ISO 8601 - `YYYY-MM-DD`  
**Ejemplo:** `2025-01-15`

### Timestamps
**Formato:** ISO 8601 - `YYYY-MM-DD HH:MM:SS`  
**Ejemplo:** `2025-01-15 14:30:00`

### Montos
**Tipo:** REAL (float 64-bit)  
**Unidad:** Pesos chilenos (CLP)

### Códigos
**Jardines:** Alfanumérico libre, ej: `JD001`, `PARQUE-A`  
**Partidas:** Alfanumérico libre, ej: `P01`, `ITEM-123`  
**OT:** `OT-{jardin}-{prefijo}{num}`, ej: `OT-JD001-M001`  
**Informe:** `IP-{jardin}-{prefijo}{num}`, ej: `IP-JD001-M01`

---

## Optimizaciones

### Índices Estratégicos
- Claves únicas: `codigo`, `item`
- Foreign keys: todas indexadas
- Compuesto: `(jardin_codigo, estado)` para filtros frecuentes

### WAL Mode
```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
```
**Beneficio:** Lecturas concurrentes sin bloqueo

---

## Backup Recomendado

```bash
# Backup completo
sqlite3 database.db ".backup backup-$(date +%Y%m%d).db"

# Export SQL
sqlite3 database.db .dump > backup-$(date +%Y%m%d).sql

# Export JSON (via Tauri)
# Usar función exportarBaseDatos() en +layout.svelte
```

---

## Notas Técnicas

### Límites SQLite
- Max tamaño DB: ~140 TB (teórico)
- Max filas/tabla: 2^64
- Max longitud TEXT: ~1GB

### Consideraciones Performance
- Índices cubriendo queries frecuentes ✅
- Triggers eficientes (solo cálculos necesarios) ✅
- WAL mode para concurrencia ✅

### Migración Futura
Si se requiere PostgreSQL:
1. Cambiar `TEXT` → `VARCHAR` con límites
2. Cambiar `INTEGER` → `BIGSERIAL` (auto-increment)
3. Triggers: sintaxis diferente pero lógica igual
4. Índices: migrables directamente

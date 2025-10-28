# Documentación FLAD

Sistema Piloto de Control y Mantenimiento - Tauri + SQLite

## 📚 Documentos Disponibles

### [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md)
**Estructura completa de base de datos**
- 7 tablas con schema SQL
- Diagrama relacional
- Triggers y cálculos automáticos
- Índices y optimizaciones
- Flujo de trabajo
- Convenciones de datos

### [OPTIMIZACION-DB-2025-01.md](./OPTIMIZACION-DB-2025-01.md)
**Optimización y coherencia de datos (Enero 2025)**
- Índice compuesto añadido
- Corrección campo `plazo` → `plazo_dias`
- 13 correcciones frontend/backend
- Cadena de datos verificada
- Archivos modificados
- Testing pre-build

## 🔍 Referencias Rápidas

### Ubicación Base de Datos
```
~/Library/Application Support/sistema-piloto-cont-mant/database.db
```

### Schema Source
```
src-tauri/sql/schema.sql
```

### Estructura del Proyecto
```
/Users/junji/- FLAD/03 Tauri Sqlite/
├── docs/                    ← Documentación
├── src/                     ← Frontend Svelte
├── src-tauri/               ← Backend Rust
│   ├── src/
│   │   ├── db.rs           ← Structs y conexión BD
│   │   ├── commands.rs     ← Comandos Tauri
│   │   └── main.rs
│   └── sql/
│       └── schema.sql      ← Schema SQLite
└── sistema-piloto-cont-mant.db  ← BD de desarrollo (vacía)
```

### Tablas Principales

| Tabla | Propósito | Relaciones |
|-------|-----------|------------|
| **requerimientos** | TABLA CENTRAL - Requerimientos | 4 FKs |
| jardines | Catálogo de proyectos | Padre de todos |
| partidas | Catálogo de ítems | → requerimientos |
| ordenes_trabajo | Agrupación para ejecución | → requerimientos |
| informes_pago | Consolidación financiera | → requerimientos |
| recintos | Subdivisiones de jardines | → jardines |
| configuracion_contrato | Config global (singleton) | Prefijos |

### Comandos Útiles

```bash
# Compilar backend
cd src-tauri && cargo build --release

# Build completo
npm run tauri build

# Verificar schema
sqlite3 ~/Library/Application\ Support/sistema-piloto-cont-mant/database.db ".schema"

# Backup
sqlite3 database.db ".backup backup-$(date +%Y%m%d).db"
```

### Convenciones de Nomenclatura

**Backend (Rust):**
- snake_case: `plazo_dias`, `jardin_codigo`

**Frontend (JS/Svelte):**
- camelCase: `plazoDias`, `jardinCodigo`

**Conversión automática:**
- Tauri 2.x: snake_case → camelCase
- `enriquecimiento.js`: Aliases duales

### Versiones

| Componente | Versión |
|------------|---------|
| Tauri | 2.x |
| Rust | 1.75+ |
| SQLite | 3.x |
| Svelte | 5.x |
| Node | 18+ |

## 🎯 Para Nuevos Desarrolladores

1. Lee [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) para entender la BD
2. Revisa [OPTIMIZACION-DB-2025-01.md](./OPTIMIZACION-DB-2025-01.md) para convenciones
3. Sigue flujo: SQL → Rust → Tauri → Frontend
4. Respeta nomenclatura: snake_case (backend) / camelCase (frontend)
5. Añade aliases en `enriquecimiento.js` si es necesario

## 📅 Historial

- **Enero 2025** - Optimización BD + coherencia datos
- **2024** - Migración IndexedDB → SQLite
- **2023** - Versión inicial web

---

**Última actualización:** Enero 2025

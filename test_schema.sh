#!/bin/bash
set -e

DB_PATH="$HOME/Library/Application Support/sistema-piloto-cont-mant/database.db"
SCHEMA="/Users/junji/- FLAD/03 Tauri Sqlite/src-tauri/sql/schema.sql"

# Limpiar
rm -rf "$(dirname "$DB_PATH")"
mkdir -p "$(dirname "$DB_PATH")"

echo "📂 Testing schema at: $DB_PATH"

# Ejecutar schema línea por línea
sqlite3 "$DB_PATH" < "$SCHEMA" 2>&1

echo "✅ Schema aplicado correctamente"

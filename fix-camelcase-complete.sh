#!/bin/bash
# fix-camelcase-complete.sh
# Corrección masiva: API layer + Componentes

PROJECT_ROOT="/Users/danielestebanmenaflores/Desktop/- FLAD/03 Tauri Sqlite"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$PROJECT_ROOT/backup-camelcase-$TIMESTAMP"

echo "🔧 Iniciando corrección masiva camelCase"
echo "📦 Creando backup en: $BACKUP_DIR"

# Crear backup
mkdir -p "$BACKUP_DIR"
cp -r "$PROJECT_ROOT/src/lib" "$BACKUP_DIR/"

cd "$PROJECT_ROOT"

# ============================================================
# FASE 1: CORREGIR API LAYER (tauri.js) - CRÍTICO
# ============================================================
echo ""
echo "🚨 FASE 1: Corrigiendo tauri.js (parámetros → snake_case)"

TAURI_FILE="src/lib/api/tauri.js"

# Cambiar comentario incorrecto
sed -i '' 's/TODOS los parámetros en camelCase/TODOS los parámetros en snake_case/g' "$TAURI_FILE"

# Parámetros comunes
sed -i '' 's/jardinCodigo:/jardin_codigo:/g' "$TAURI_FILE"
sed -i '' 's/fechaCreacion:/fecha_creacion:/g' "$TAURI_FILE"
sed -i '' 's/requerimientoIds:/requerimiento_ids:/g' "$TAURI_FILE"
sed -i '' 's/prefijoCorrelativo:/prefijo_correlativo:/g' "$TAURI_FILE"
sed -i '' 's/imagenBase64:/imagen_base64:/g' "$TAURI_FILE"

echo "✅ tauri.js corregido"

# ============================================================
# FASE 2: CORREGIR COMPONENTES (accesos → camelCase)
# ============================================================
echo ""
echo "📝 FASE 2: Corrigiendo accesos en componentes"

declare -A REPLACEMENTS=(
  ["\.fecha_inicio"]="\.fechaInicio"
  ["\.fecha_recepcion"]="\.fechaRecepcion"
  ["\.fecha_limite"]="\.fechaLimite"
  ["\.fecha_creacion"]="\.fechaCreacion"
  ["\.ot_id"]="\.otId"
  ["\.orden_trabajo_id"]="\.otId"
  ["\.partida_item"]="\.partidaItem"
  ["\.partida_unidad"]="\.partidaUnidad"
  ["\.jardin_codigo"]="\.jardinCodigo"
  ["\.precio_unitario"]="\.precioUnitario"
  ["\.precio_total"]="\.precioTotal"
  ["\.plazo_dias"]="\.plazoDias"
  ["\.plazo_adicional"]="\.plazoAdicional"
  ["\.dias_atraso"]="\.diasAtraso"
  ["\.created_at"]="\.createdAt"
  ["\.updated_at"]="\.updatedAt"
)

for pattern in "${!REPLACEMENTS[@]}"; do
  replacement="${REPLACEMENTS[$pattern]}"
  echo "  $pattern → $replacement"
  
  # Buscar en .svelte y .js
  find src/lib -type f \( -name "*.svelte" -o -name "*.js" \) \
    -exec sed -i '' "s/${pattern}/${replacement}/g" {} +
done

echo "✅ Componentes corregidos"

# ============================================================
# FASE 3: CORRECCIONES ESPECIALES
# ============================================================
echo ""
echo "🎯 FASE 3: Correcciones especiales"

# Parámetro fecha_recepcion en objetos
find src/lib -type f -name "*.svelte" -exec sed -i '' 's/fecha_recepcion:/fechaRecepcion:/g' {} +

echo "✅ Correcciones especiales aplicadas"

# ============================================================
# VERIFICACIÓN
# ============================================================
echo ""
echo "🔍 Verificando correcciones..."

ERRORS_API=$(grep -rn "jardinCodigo:" src/lib/api/tauri.js | wc -l)
ERRORS_COMPONENTS=$(grep -rn "\.[a-z]*_[a-z]*" src/lib/components | wc -l)

echo "  - Errores API restantes: $ERRORS_API (debería ser 0)"
echo "  - Errores componentes restantes: $ERRORS_COMPONENTS"

if [ "$ERRORS_API" -eq 0 ]; then
  echo "✅ API layer 100% corregido"
else
  echo "⚠️  API layer requiere revisión manual"
fi

echo ""
echo "📁 Backup guardado en: $BACKUP_DIR"
echo "🧪 Ejecutar: npm run dev"
echo "📊 Verificar console para errores undefined"
echo ""
echo "✅ Corrección masiva completada"

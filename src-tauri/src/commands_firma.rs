use crate::db::DbState;
use tauri::State;
use sqlx::Row;

// ========== FIRMA ==========

#[tauri::command]
pub async fn importar_firma(
    db: State<'_, DbState>,
    imagen_base64: String,
) -> Result<(), String> {
    use base64::{Engine as _, engine::general_purpose};
    
    let imagen_bytes = general_purpose::STANDARD
        .decode(&imagen_base64)
        .map_err(|e| format!("Error decodificando base64: {}", e))?;
    
    sqlx::query(
        "UPDATE configuracion_contrato 
         SET firma_png = ?, updated_at = datetime('now')
         WHERE id = 1"
    )
    .bind(&imagen_bytes)
    .execute(&*db.pool)
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn get_firma(db: State<'_, DbState>) -> Result<Option<String>, String> {
    use base64::{Engine as _, engine::general_purpose};
    
    let row = sqlx::query("SELECT firma_png FROM configuracion_contrato WHERE id = 1")
        .fetch_one(&*db.pool)
        .await
        .map_err(|e| e.to_string())?;
    
    let firma_bytes: Option<Vec<u8>> = row.get("firma_png");
    
    Ok(firma_bytes.map(|bytes| general_purpose::STANDARD.encode(&bytes)))
}

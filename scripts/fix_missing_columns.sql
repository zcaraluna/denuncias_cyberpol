-- Script para agregar columnas faltantes en producción
-- Ejecutar este script en la base de datos de producción

-- Agregar campos para rango de fechas/horas del hecho (si no existen)
ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS fecha_hecho_fin DATE;
ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS hora_hecho_fin VARCHAR(10);

-- Agregar columnas de carta poder en denuncias_involucrados
ALTER TABLE denuncias_involucrados ADD COLUMN IF NOT EXISTS con_carta_poder BOOLEAN DEFAULT FALSE;
ALTER TABLE denuncias_involucrados ADD COLUMN IF NOT EXISTS carta_poder_fecha DATE;
ALTER TABLE denuncias_involucrados ADD COLUMN IF NOT EXISTS carta_poder_numero VARCHAR(100);
ALTER TABLE denuncias_involucrados ADD COLUMN IF NOT EXISTS carta_poder_notario VARCHAR(255);

-- Agregar descripcion_fisica en supuestos_autores
ALTER TABLE supuestos_autores ADD COLUMN IF NOT EXISTS descripcion_fisica TEXT;

-- Verificar que todas las columnas existen
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'denuncias' 
            AND column_name = 'fecha_hecho_fin'
        ) THEN '✓ fecha_hecho_fin existe'
        ELSE '✗ ERROR: fecha_hecho_fin NO existe'
    END as estado_fecha_hecho_fin,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'denuncias' 
            AND column_name = 'hora_hecho_fin'
        ) THEN '✓ hora_hecho_fin existe'
        ELSE '✗ ERROR: hora_hecho_fin NO existe'
    END as estado_hora_hecho_fin,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'denuncias_involucrados' 
            AND column_name = 'con_carta_poder'
        ) THEN '✓ con_carta_poder existe'
        ELSE '✗ ERROR: con_carta_poder NO existe'
    END as estado_con_carta_poder,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'denuncias_involucrados' 
            AND column_name = 'carta_poder_fecha'
        ) THEN '✓ carta_poder_fecha existe'
        ELSE '✗ ERROR: carta_poder_fecha NO existe'
    END as estado_carta_poder_fecha,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'denuncias_involucrados' 
            AND column_name = 'carta_poder_numero'
        ) THEN '✓ carta_poder_numero existe'
        ELSE '✗ ERROR: carta_poder_numero NO existe'
    END as estado_carta_poder_numero,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'denuncias_involucrados' 
            AND column_name = 'carta_poder_notario'
        ) THEN '✓ carta_poder_notario existe'
        ELSE '✗ ERROR: carta_poder_notario NO existe'
    END as estado_carta_poder_notario,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'supuestos_autores' 
            AND column_name = 'descripcion_fisica'
        ) THEN '✓ descripcion_fisica existe'
        ELSE '✗ ERROR: descripcion_fisica NO existe'
    END as estado_descripcion_fisica;

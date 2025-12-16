-- Script para agregar columnas faltantes en producción
-- Ejecutar este script en la base de datos de producción si falta fecha_hecho_fin y hora_hecho_fin

-- Agregar campos para rango de fechas/horas del hecho (si no existen)
DO $$
BEGIN
    -- Verificar y agregar fecha_hecho_fin
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'denuncias' 
        AND column_name = 'fecha_hecho_fin'
    ) THEN
        ALTER TABLE denuncias ADD COLUMN fecha_hecho_fin DATE;
        RAISE NOTICE 'Columna fecha_hecho_fin agregada';
    ELSE
        RAISE NOTICE 'Columna fecha_hecho_fin ya existe';
    END IF;

    -- Verificar y agregar hora_hecho_fin
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'denuncias' 
        AND column_name = 'hora_hecho_fin'
    ) THEN
        ALTER TABLE denuncias ADD COLUMN hora_hecho_fin VARCHAR(10);
        RAISE NOTICE 'Columna hora_hecho_fin agregada';
    ELSE
        RAISE NOTICE 'Columna hora_hecho_fin ya existe';
    END IF;
END $$;

-- Verificar que las columnas existen
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
    END as estado_hora_hecho_fin;


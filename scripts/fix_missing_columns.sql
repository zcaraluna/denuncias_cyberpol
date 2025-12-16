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

    -- Verificar y agregar columnas de carta poder en denuncias_involucrados
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'denuncias_involucrados' 
        AND column_name = 'con_carta_poder'
    ) THEN
        ALTER TABLE denuncias_involucrados ADD COLUMN con_carta_poder BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Columna con_carta_poder agregada';
    ELSE
        RAISE NOTICE 'Columna con_carta_poder ya existe';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'denuncias_involucrados' 
        AND column_name = 'carta_poder_fecha'
    ) THEN
        ALTER TABLE denuncias_involucrados ADD COLUMN carta_poder_fecha DATE;
        RAISE NOTICE 'Columna carta_poder_fecha agregada';
    ELSE
        RAISE NOTICE 'Columna carta_poder_fecha ya existe';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'denuncias_involucrados' 
        AND column_name = 'carta_poder_numero'
    ) THEN
        ALTER TABLE denuncias_involucrados ADD COLUMN carta_poder_numero VARCHAR(100);
        RAISE NOTICE 'Columna carta_poder_numero agregada';
    ELSE
        RAISE NOTICE 'Columna carta_poder_numero ya existe';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'denuncias_involucrados' 
        AND column_name = 'carta_poder_notario'
    ) THEN
        ALTER TABLE denuncias_involucrados ADD COLUMN carta_poder_notario VARCHAR(255);
        RAISE NOTICE 'Columna carta_poder_notario agregada';
    ELSE
        RAISE NOTICE 'Columna carta_poder_notario ya existe';
    END IF;

    -- Verificar y agregar descripcion_fisica en supuestos_autores
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'supuestos_autores' 
        AND column_name = 'descripcion_fisica'
    ) THEN
        ALTER TABLE supuestos_autores ADD COLUMN descripcion_fisica TEXT;
        RAISE NOTICE 'Columna descripcion_fisica agregada';
    ELSE
        RAISE NOTICE 'Columna descripcion_fisica ya existe';
    END IF;
END $$;

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


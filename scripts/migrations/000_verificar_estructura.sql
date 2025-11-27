-- Script para verificar qué columnas faltan en las tablas principales
-- Ejecutar con: psql -U postgres -d cyberpol_db -h localhost -f scripts/migrations/000_verificar_estructura.sql

-- ============================================================================
-- VERIFICACIÓN DE COLUMNAS FALTANTES
-- ============================================================================

SELECT '============================================================================' as verificacion;
SELECT 'VERIFICACIÓN DE ESTRUCTURA DE LA BASE DE DATOS' as verificacion;
SELECT '============================================================================' as verificacion;

SELECT '--- TABLA: denunciantes ---' as verificacion;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'denunciantes' AND column_name = 'correo') 
            THEN '✓ correo existe'
        ELSE '✗ FALTA: correo'
    END as estado
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'denunciantes' AND column_name = 'matricula') 
            THEN '✓ matricula existe'
        ELSE '✗ FALTA: matricula'
    END;

SELECT '--- TABLA: denuncias ---' as verificacion;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'denuncias' AND column_name = 'fecha_hecho_fin') 
            THEN '✓ fecha_hecho_fin existe'
        ELSE '✗ FALTA: fecha_hecho_fin'
    END as estado
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'denuncias' AND column_name = 'hora_hecho_fin') 
            THEN '✓ hora_hecho_fin existe'
        ELSE '✗ FALTA: hora_hecho_fin'
    END;

SELECT '--- TABLA: denuncias_involucrados ---' as verificacion;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'denuncias_involucrados' AND column_name = 'con_carta_poder') 
            THEN '✓ con_carta_poder existe'
        ELSE '✗ FALTA: con_carta_poder'
    END as estado
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'denuncias_involucrados' AND column_name = 'carta_poder_fecha') 
            THEN '✓ carta_poder_fecha existe'
        ELSE '✗ FALTA: carta_poder_fecha'
    END
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'denuncias_involucrados' AND column_name = 'carta_poder_numero') 
            THEN '✓ carta_poder_numero existe'
        ELSE '✗ FALTA: carta_poder_numero'
    END
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'denuncias_involucrados' AND column_name = 'carta_poder_notario') 
            THEN '✓ carta_poder_notario existe'
        ELSE '✗ FALTA: carta_poder_notario'
    END;

SELECT '--- TABLA: supuestos_autores ---' as verificacion;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'supuestos_autores' AND column_name = 'descripcion_fisica') 
            THEN '✓ descripcion_fisica existe'
        ELSE '✗ FALTA: descripcion_fisica'
    END as estado;

-- ============================================================================
-- LISTADO COMPLETO DE COLUMNAS ACTUALES (para referencia)
-- ============================================================================

SELECT '============================================================================' as verificacion;
SELECT 'ESTRUCTURA ACTUAL: denunciantes' as verificacion;
SELECT '============================================================================' as verificacion;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'denunciantes'
ORDER BY ordinal_position;

SELECT '============================================================================' as verificacion;
SELECT 'ESTRUCTURA ACTUAL: denuncias' as verificacion;
SELECT '============================================================================' as verificacion;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'denuncias'
ORDER BY ordinal_position;

SELECT '============================================================================' as verificacion;
SELECT 'ESTRUCTURA ACTUAL: denuncias_involucrados' as verificacion;
SELECT '============================================================================' as verificacion;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'denuncias_involucrados'
ORDER BY ordinal_position;

SELECT '============================================================================' as verificacion;
SELECT 'ESTRUCTURA ACTUAL: supuestos_autores' as verificacion;
SELECT '============================================================================' as verificacion;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'supuestos_autores'
ORDER BY ordinal_position;

-- ============================================================================
-- RESUMEN FINAL: TODAS LAS COLUMNAS QUE FALTAN
-- ============================================================================

SELECT '============================================================================' as verificacion;
SELECT 'RESUMEN FINAL: COLUMNAS FALTANTES' as verificacion;
SELECT '============================================================================' as verificacion;

SELECT 
    'denunciantes.' || column_name as columna_faltante
FROM (
    SELECT 'correo' as column_name
    UNION ALL SELECT 'matricula'
) as cols
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'denunciantes' 
    AND column_name = cols.column_name
)
UNION ALL
SELECT 
    'denuncias.' || column_name as columna_faltante
FROM (
    SELECT 'fecha_hecho_fin' as column_name
    UNION ALL SELECT 'hora_hecho_fin'
) as cols
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'denuncias' 
    AND column_name = cols.column_name
)
UNION ALL
SELECT 
    'denuncias_involucrados.' || column_name as columna_faltante
FROM (
    SELECT 'con_carta_poder' as column_name
    UNION ALL SELECT 'carta_poder_fecha'
    UNION ALL SELECT 'carta_poder_numero'
    UNION ALL SELECT 'carta_poder_notario'
) as cols
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'denuncias_involucrados' 
    AND column_name = cols.column_name
)
UNION ALL
SELECT 
    'supuestos_autores.' || column_name as columna_faltante
FROM (
    SELECT 'descripcion_fisica' as column_name
) as cols
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'supuestos_autores' 
    AND column_name = cols.column_name
)
ORDER BY columna_faltante;

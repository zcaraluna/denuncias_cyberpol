-- Script para verificar datos en Neon después de la importación
-- Ejecutar en el SQL Editor de Neon o con psql

-- Establecer search_path
SET search_path = public;

-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar conteo de registros
SELECT 
    'denuncias' as tabla, 
    COUNT(*) as registros 
FROM public.denuncias
UNION ALL
SELECT 'denunciantes', COUNT(*) FROM public.denunciantes
UNION ALL
SELECT 'usuarios', COUNT(*) FROM public.usuarios
UNION ALL
SELECT 'supuestos_autores', COUNT(*) FROM public.supuestos_autores
UNION ALL
SELECT 'denuncias_involucrados', COUNT(*) FROM public.denuncias_involucrados
ORDER BY tabla;


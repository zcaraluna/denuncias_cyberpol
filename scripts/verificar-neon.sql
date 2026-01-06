-- Script para verificar el estado de la base de datos en Neon
-- Ejecutar en el SQL Editor de Neon

-- 1. Verificar que el schema public existe
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'public';

-- 2. Listar todas las tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 3. Verificar conteo de registros (si las tablas existen)
SELECT 
    'denuncias' as tabla, 
    COUNT(*) as registros 
FROM denuncias
UNION ALL
SELECT 'denunciantes', COUNT(*) FROM denunciantes
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'supuestos_autores', COUNT(*) FROM supuestos_autores
UNION ALL
SELECT 'denuncias_involucrados', COUNT(*) FROM denuncias_involucrados;


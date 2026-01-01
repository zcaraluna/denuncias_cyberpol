-- Script para eliminar usuarios importados del Excel
-- CUIDADO: Este script eliminará permanentemente los usuarios

-- OPCIÓN 1: Eliminar usuarios por rango de IDs (ajusta según tus necesidades)
-- Basado en el output anterior, los usuarios importados tienen IDs del 10 al 45
-- IMPORTANTE: Verifica primero qué usuarios tienen esos IDs antes de eliminar
DELETE FROM usuarios 
WHERE id >= 10 AND id <= 45
AND oficina = 'Asunción'
AND rol = 'operador'
AND grado = 'No especificado';

-- OPCIÓN 2: Eliminar usuarios creados después de una fecha específica
-- Descomenta y ajusta la fecha según cuándo ejecutaste el import
/*
DELETE FROM usuarios 
WHERE creado_en >= '2026-01-01 00:00:00'
AND oficina = 'Asunción'
AND rol = 'operador';
*/

-- OPCIÓN 3: Eliminar usuarios específicos por lista de credenciales
-- Descomenta y agrega las credenciales que quieres eliminar
/*
DELETE FROM usuarios 
WHERE usuario IN (
  '54477', '55968', '59604', '55986', '57289', '57339', 
  '63118', '54899', '71036', '44531', '60371', '73855', 
  '73910', '58794', '64215', '41616', '44253', '57239', 
  '68978', '58505', '54506', '58616', '58158', '46422', 
  '56007', '57540', '58589', '62608', '63147', '58888', 
  '55865', '62150', '50317', '55568', '58534'
);
*/

-- ANTES DE EJECUTAR: Verificar qué usuarios se van a eliminar
-- Descomenta esta consulta para ver los usuarios que coinciden:
/*
SELECT id, usuario, nombre, apellido, grado, oficina, rol, creado_en 
FROM usuarios 
WHERE id >= 10 AND id <= 45
AND oficina = 'Asunción'
AND rol = 'operador'
ORDER BY id;
*/


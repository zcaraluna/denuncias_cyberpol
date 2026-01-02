-- Corregir desfase de -24 horas en fecha_denuncia
-- Este script suma 1 día a todas las fechas de denuncia para corregir el desfase de timezone
-- Solo se aplica a denuncias completadas (no borradores)

-- IMPORTANTE: Ejecutar con precaución. Verificar primero con un SELECT antes de hacer UPDATE
-- Para verificar qué denuncias se van a corregir, ejecutar primero:
-- SELECT id, fecha_denuncia, hora_denuncia, (fecha_denuncia + INTERVAL '1 day') as fecha_corregida
-- FROM denuncias 
-- WHERE estado = 'completada'
-- ORDER BY fecha_denuncia DESC;

-- Actualizar todas las denuncias completadas sumando 1 día
UPDATE denuncias 
SET fecha_denuncia = fecha_denuncia + INTERVAL '1 day'
WHERE estado = 'completada';

-- Comentario: Esta migración corrige el desfase de -24 horas causado por la falta del cast ::DATE
-- en las operaciones UPDATE/INSERT de fecha_denuncia. El problema fue corregido en el código
-- en la migración 011, y este script corrige las denuncias ya creadas.


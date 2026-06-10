-- Migration 019: Índice parcial para optimizar la consulta del cron de limpieza de borradores expirados
-- Este índice es puramente aditivo y no afecta datos existentes ni el funcionamiento actual
-- Solo acelera: WHERE estado = 'borrador' AND creado_en < NOW() - INTERVAL '24 hours'
CREATE INDEX IF NOT EXISTS idx_denuncias_borrador_creado_en
ON denuncias (creado_en)
WHERE estado = 'borrador';

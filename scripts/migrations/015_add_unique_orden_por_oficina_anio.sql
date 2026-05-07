-- Garantiza numeración de acta única por oficina y año para denuncias completadas.
-- No afecta borradores (orden negativo).

CREATE UNIQUE INDEX IF NOT EXISTS idx_denuncias_unique_oficina_anio_orden
ON denuncias (oficina, (EXTRACT(YEAR FROM fecha_denuncia)), orden)
WHERE estado = 'completada'
  AND fecha_denuncia IS NOT NULL
  AND orden >= 1;

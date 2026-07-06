-- Numero de arranque (offset) de la numeracion de actas por oficina y año.
--
-- Permite que una oficina que se incorpora al sistema a mitad de año (p. ej.
-- Ciudad del Este en 2026, con actas ya tomadas en papel) continue la numeracion
-- desde el ultimo numero usado fuera del sistema, evitando duplicar nombres de acta.
--
-- ultimo_orden_previo = cantidad de actas que ya existian fuera del sistema para
-- esa (oficina, año). La primera denuncia cargada recibira ultimo_orden_previo + 1.
-- Una oficina sin fila equivale a base 0 (numeracion desde 1).

CREATE TABLE IF NOT EXISTS numeracion_base (
    id SERIAL PRIMARY KEY,
    oficina VARCHAR(255) NOT NULL,
    anio INTEGER NOT NULL,
    ultimo_orden_previo INTEGER NOT NULL DEFAULT 0,
    nota TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_numeracion_base_oficina_anio UNIQUE (oficina, anio),
    CONSTRAINT chk_ultimo_orden_previo CHECK (ultimo_orden_previo >= 0)
);

CREATE INDEX IF NOT EXISTS idx_numeracion_base_oficina_anio ON numeracion_base(oficina, anio);

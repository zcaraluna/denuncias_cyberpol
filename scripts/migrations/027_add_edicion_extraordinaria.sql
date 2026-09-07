-- Migración para permitir que una cuenta con rol 'developer' habilite, de forma
-- puntual y de un solo uso, una edición extraordinaria de una denuncia completada
-- ya fuera del período de gracia normal de 10 minutos.
--
-- Esa habilitación es de uso exclusivo del operador que originalmente cargó la
-- denuncia (usuario_id de la denuncia) — no de quien la otorga ni de otro admin.
-- Se consume automáticamente (edicion_extra_usada_en) en cuanto ese operador
-- guarda una edición usándola, sin afectar al período de gracia normal.
ALTER TABLE denuncias
  ADD COLUMN IF NOT EXISTS edicion_extra_otorgada_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edicion_extra_otorgada_en TIMESTAMP,
  ADD COLUMN IF NOT EXISTS edicion_extra_usada_en TIMESTAMP;

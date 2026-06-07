ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS grado_ejecucion VARCHAR(30);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_grado_ejecucion') THEN
        ALTER TABLE denuncias ADD CONSTRAINT check_grado_ejecucion CHECK (grado_ejecucion IN ('consumado', 'tentativa'));
    END IF;
END $$;

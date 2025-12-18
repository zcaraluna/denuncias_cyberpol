-- Agregar campo nombre/descripción a códigos de activación
ALTER TABLE codigos_activacion 
ADD COLUMN IF NOT EXISTS nombre VARCHAR(200) NULL,
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

-- Agregar campo nombre/descripción a dispositivos autorizados
ALTER TABLE dispositivos_autorizados 
ADD COLUMN IF NOT EXISTS nombre VARCHAR(200) NULL;

-- Comentarios para documentación
COMMENT ON COLUMN codigos_activacion.nombre IS 'Nombre o descripción del código (ej: Oficina Central, Sucursal X)';
COMMENT ON COLUMN codigos_activacion.activo IS 'Indica si el código está activo (false = eliminado/desactivado)';
COMMENT ON COLUMN dispositivos_autorizados.nombre IS 'Nombre heredado del código de activación usado';

-- Índices adicionales
CREATE INDEX IF NOT EXISTS idx_codigos_activacion_activo ON codigos_activacion(activo);
CREATE INDEX IF NOT EXISTS idx_codigos_activacion_nombre ON codigos_activacion(nombre);


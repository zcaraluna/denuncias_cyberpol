-- Agregar campo para forzar cambio de contraseña en primer inicio de sesión
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS debe_cambiar_contraseña BOOLEAN DEFAULT TRUE;

-- Comentario para documentación
COMMENT ON COLUMN usuarios.debe_cambiar_contraseña IS 'Indica si el usuario debe cambiar su contraseña en el próximo inicio de sesión';

-- Actualizar usuarios existentes para que no tengan que cambiar su contraseña
-- (solo los nuevos usuarios o aquellos creados después de esta migración deberán cambiarla)
UPDATE usuarios SET debe_cambiar_contraseña = FALSE WHERE debe_cambiar_contraseña IS NULL;


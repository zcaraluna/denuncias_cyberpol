-- 1. Eliminar restricción anterior de roles
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS check_rol;

-- 2. Crear nueva restricción incluyendo 'developer'
ALTER TABLE usuarios ADD CONSTRAINT check_rol CHECK (rol IN ('superadmin', 'admin', 'operador', 'supervisor', 'developer'));

-- 3. Actualizar al usuario 'garv' a rol 'developer'
UPDATE usuarios SET rol = 'developer' WHERE usuario = 'garv';

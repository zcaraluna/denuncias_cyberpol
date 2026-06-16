-- Migración para crear la tabla de registro de auditoría de usuarios
CREATE TABLE IF NOT EXISTS registro_auditoria_usuarios (
    id SERIAL PRIMARY KEY,
    usuario_realizador_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_afectado_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    accion VARCHAR(100) NOT NULL, -- 'restauracion_contraseña'
    detalle TEXT,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

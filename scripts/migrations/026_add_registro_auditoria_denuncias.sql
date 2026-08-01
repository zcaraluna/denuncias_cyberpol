-- Migración para crear la tabla de registro de auditoría de denuncias (creación, edición, eliminación)
CREATE TABLE IF NOT EXISTS registro_auditoria_denuncias (
    id SERIAL PRIMARY KEY,
    denuncia_id INTEGER REFERENCES denuncias(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    accion VARCHAR(100) NOT NULL, -- 'CREACION', 'EDICION', 'ELIMINACION', 'REMISION'
    detalle TEXT,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

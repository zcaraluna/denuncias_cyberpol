-- Migración para crear la tabla de preguntas de seguridad de usuarios
CREATE TABLE IF NOT EXISTS preguntas_seguridad_usuarios (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    pregunta TEXT NOT NULL,
    respuesta_hash VARCHAR(255) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_usuario_pregunta UNIQUE (usuario_id, pregunta)
);

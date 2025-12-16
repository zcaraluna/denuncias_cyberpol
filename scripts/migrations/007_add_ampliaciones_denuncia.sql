-- Tabla de ampliaciones de denuncia
CREATE TABLE IF NOT EXISTS ampliaciones_denuncia (
    id SERIAL PRIMARY KEY,
    denuncia_id INTEGER REFERENCES denuncias(id) ON DELETE CASCADE NOT NULL,
    numero_ampliacion INTEGER NOT NULL,
    relato TEXT NOT NULL,
    fecha_ampliacion DATE NOT NULL,
    hora_ampliacion VARCHAR(10) NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    operador_grado VARCHAR(50) NOT NULL,
    operador_nombre VARCHAR(100) NOT NULL,
    operador_apellido VARCHAR(100) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_denuncia_numero UNIQUE (denuncia_id, numero_ampliacion)
);

-- Índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_ampliaciones_denuncia ON ampliaciones_denuncia(denuncia_id);
CREATE INDEX IF NOT EXISTS idx_ampliaciones_fecha ON ampliaciones_denuncia(fecha_ampliacion);


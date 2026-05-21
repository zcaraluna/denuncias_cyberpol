-- Cambiar el tipo de datos de monto_dano a BIGINT para soportar montos mayores en la tabla de denuncias (como en Guaraníes)
ALTER TABLE denuncias ALTER COLUMN monto_dano TYPE BIGINT;

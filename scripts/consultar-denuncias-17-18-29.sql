-- Consulta para verificar las denuncias 17/2026, 18/2026 y 29/2026
-- Ejecutar en psql: \i scripts/consultar-denuncias-17-18-29.sql
-- O copiar y pegar la consulta directamente en psql

SELECT 
    d.id,
    d.orden,
    d.fecha_denuncia,
    d.hora_denuncia,
    d.tipo_denuncia,
    d.estado,
    den.nombres as nombre_denunciante,
    den.cedula as cedula_denunciante,
    den.tipo_documento,
    den.nacionalidad,
    den.domicilio,
    den.telefono,
    den.correo
FROM denuncias d
JOIN denunciantes den ON d.denunciante_id = den.id
WHERE d.orden IN (17, 18, 29)
  AND EXTRACT(YEAR FROM d.fecha_denuncia) = 2026
ORDER BY d.orden;


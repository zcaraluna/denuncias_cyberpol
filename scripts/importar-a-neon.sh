#!/bin/bash

# Script para importar la base de datos a Neon
# Uso: ./scripts/importar-a-neon.sh <connection_string_neon> <backup_file.sql>

if [ $# -lt 2 ]; then
    echo "❌ Error: Faltan argumentos"
    echo "Uso: $0 <connection_string_neon> <backup_file.sql>"
    echo ""
    echo "Ejemplo:"
    echo "  $0 'postgresql://usuario:contraseña@host.neon.tech/database?sslmode=require' backup.sql"
    exit 1
fi

NEON_CONNECTION="$1"
BACKUP_FILE="$2"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: El archivo $BACKUP_FILE no existe"
    exit 1
fi

echo "🔄 Importando base de datos a Neon..."
echo "📁 Archivo: $BACKUP_FILE"
echo ""

# Verificar conexión
echo "🔍 Verificando conexión a Neon..."
psql "$NEON_CONNECTION" -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Conexión exitosa a Neon"
    echo ""
    echo "📦 Importando datos..."
    
    # Importar el backup
    psql "$NEON_CONNECTION" -f "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Importación completada exitosamente!"
        echo ""
        echo "📊 Verificando datos importados:"
        psql "$NEON_CONNECTION" -c "
            SELECT 
                'denuncias' as tabla, 
                COUNT(*) as registros 
            FROM denuncias
            UNION ALL
            SELECT 'denunciantes', COUNT(*) FROM denunciantes
            UNION ALL
            SELECT 'usuarios', COUNT(*) FROM usuarios
            UNION ALL
            SELECT 'supuestos_autores', COUNT(*) FROM supuestos_autores
            UNION ALL
            SELECT 'denuncias_involucrados', COUNT(*) FROM denuncias_involucrados;
        "
    else
        echo "❌ Error al importar los datos"
        exit 1
    fi
else
    echo "❌ Error: No se pudo conectar a Neon"
    echo "Verifica tu connection string"
    exit 1
fi


#!/bin/bash

# Script para exportar la base de datos del VPS para migración a Neon
# Uso: ./scripts/exportar-para-neon.sh

DB_NAME="denuncias"
DB_USER="postgres"
BACKUP_DIR="/tmp"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/denuncias_backup_${TIMESTAMP}.sql"

echo "📦 Iniciando exportación de base de datos..."

# Verificar si existe la base de datos
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "❌ Error: La base de datos '$DB_NAME' no existe"
    exit 1
fi

# Exportar la base de datos completa
echo "🔄 Exportando base de datos..."
sudo -u postgres pg_dump -d "$DB_NAME" -F p --clean --if-exists --no-owner --no-acl > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Exportación completada: $BACKUP_FILE"
    echo "📊 Tamaño del archivo: $(du -h "$BACKUP_FILE" | cut -f1)"
    
    # Información adicional
    echo ""
    echo "📋 Estadísticas de la base de datos:"
    sudo -u postgres psql -d "$DB_NAME" -c "
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
    
    echo ""
    echo "📝 Siguiente paso:"
    echo "1. Descargar el archivo: $BACKUP_FILE"
    echo "2. Importar a Neon usando:"
    echo "   psql \"TU_CONNECTION_STRING_NEON\" -f $BACKUP_FILE"
else
    echo "❌ Error al exportar la base de datos"
    exit 1
fi


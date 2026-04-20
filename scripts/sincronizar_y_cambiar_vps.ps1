# Script de Sincronización Final y Cambio de Base de Datos a VPS - VERSIÓN PERFECTA
# Ejecutar este script esta noche para realizar el cambio definitivo.

$supabaseUrl = "postgres://postgres.assahvgvcepcbijzjxwj:u9i1jHQW9Xj0mo4J@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
$vpsUrl = "postgresql://user_denuncias:zq7gC7Cqyy8eFUl08GBL8ny6YgyX@178.104.197.196:5432/denuncias_dchpef?sslmode=disable"

Write-Host "--- INICIANDO PROCESO DE MIGRACIÓN FINAL (MODO BINARIO PERFECTO) ---" -ForegroundColor Green

# 1. Realizar trasvase vía archivo binario para evitar problemas de codificación de Windows
Write-Host "1/3: Sincronizando datos (Supabase -> VPS) vía dump binario..." -ForegroundColor Cyan
pg_dump --no-owner --no-acl --schema=public --format=custom --file=final_migration.dump $supabaseUrl
pg_restore --clean --if-exists --no-owner --no-acl --dbname=$vpsUrl final_migration.dump

# 2. Actualizar variables de entorno en .env.local
Write-Host "2/3: Actualizando variables de entorno..." -ForegroundColor Cyan
$envPath = ".env.local"
if (Test-Path $envPath) {
    $content = Get-Content $envPath
    $newContent = $content | ForEach-Object {
        if ($_ -match "^DATABASE_URL=") {
            "DATABASE_URL=`"$vpsUrl`""
        } else {
            $_
        }
    }
    $newContent | Set-Content $envPath -Encoding UTF8
}

# 3. Finalización y Limpieza
Write-Host "3/3: Verificando integridad..." -ForegroundColor Cyan
psql $vpsUrl -c "SELECT count(*) as total_denuncias FROM denuncias; SELECT count(*) as corrupcion FROM denuncias WHERE relato LIKE '%??%';"

Remove-Item final_migration.dump -ErrorAction SilentlyContinue

Write-Host "`n¡MIGRACIÓN COMPLETADA CON ÉXITO!" -ForegroundColor Green
Write-Host "Recuerda reiniciar la aplicación (ej: pm2 restart all) para que tome los cambios." -ForegroundColor Yellow

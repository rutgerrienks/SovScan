# SovScan Local Launch Script
Write-Host "--- Starten van SovScan Lokale Omgeving ---" -ForegroundColor Cyan

# 1. Controleer of Docker engine bereikbaar is
Write-Host "Controleren of Docker beschikbaar is..." -ForegroundColor Yellow
$dockerCheck = docker info 2>$null
if ($LastExitCode -ne 0) {
    Write-Host "Fout: Docker engine is niet bereikbaar. Zorg dat Docker draait en probeer het opnieuw." -ForegroundColor Red
    exit
}

# 2. Bouwen en starten van containers
Write-Host "Bouwen en starten van containers..." -ForegroundColor Yellow
docker-compose up --build -d

# 3. Wachten op database
Write-Host "Wachten tot de database gereed is..." -ForegroundColor Yellow
$retries = 10
while ($retries -gt 0) {
    $dbCheck = docker exec sovscan-db pg_isready -U user -d sovscan 2>$null
    if ($LastExitCode -eq 0) {
        Write-Host "Database is gereed!" -ForegroundColor Green
        break
    }
    $retries--
    Write-Host "Database nog niet gereed, even geduld... ($retries pogingen over)" -ForegroundColor Gray
    Start-Sleep -Seconds 3
}

if ($retries -eq 0) {
    Write-Host "Waarschuwing: Database start traag. Het kan zijn dat de backend nog even moet herstellen." -ForegroundColor Yellow
}

Write-Host "--- SovScan is nu lokaal beschikbaar! ---" -ForegroundColor Green
Write-Host "Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "Backend API: http://localhost:3001/api" -ForegroundColor White
Write-Host "Database: localhost:5432 (User: user, Password: password)" -ForegroundColor White
Write-Host ""
Write-Host "Gebruik 'docker-compose logs -f' om de logs te bekijken."
Write-Host "Gebruik 'docker-compose down' om de omgeving te stoppen."

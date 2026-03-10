# SovScan Cloud Deployment Script
param (
    [Parameter(Mandatory=$true)]
    [string]$RegistryEndpoint
)

# Bepaal de root map van het project op basis van de locatie van dit script
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = $ScriptRoot # In dit geval is het script al in de root

Write-Host "--- Bezig met voorbereiden van Cloud Containers voor $RegistryEndpoint ---" -ForegroundColor Cyan
Write-Host "Project Root: $ProjectRoot" -ForegroundColor Gray

# 1. Login bij Scaleway Registry
Write-Host "Inloggen bij Scaleway Registry..." -ForegroundColor Yellow
scw registry login

# 2. Bouwen van Backend
Write-Host "Bouwen van Backend container..." -ForegroundColor Yellow
docker build -t $RegistryEndpoint/sovscan-backend:latest "$ProjectRoot/backend"

# 3. Bouwen van Frontend
Write-Host "Bouwen van Frontend container..." -ForegroundColor Yellow
# We geven REACT_APP_API_URL mee als lege string of placeholder, want de proxy regelt het runtime
# Maar voor lokale build is het handig om te weten dat we via relative path werken
docker build --build-arg REACT_APP_API_URL=/api -t $RegistryEndpoint/sovscan-frontend:latest "$ProjectRoot/frontend"

# 4. Pushen naar Registry
Write-Host "Pushen naar Scaleway Registry..." -ForegroundColor Yellow
docker push $RegistryEndpoint/sovscan-backend:latest
docker push $RegistryEndpoint/sovscan-frontend:latest

Write-Host "--- Containers succesvol gepusht naar de cloud! ---" -ForegroundColor Green

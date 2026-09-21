#!/usr/bin/env pwsh
# SovScan — Azure Container Apps Deployment
# Uses: Azure Container Registry + Container Apps + PostgreSQL Flexible Server

$ErrorActionPreference = "Stop"

$RESOURCE_GROUP  = "rg-sovscan"
$LOCATION        = "westeurope"
$ACR_NAME        = "acrsovscan1473"      # must be globally unique, alphanumeric only
$PG_SERVER       = "pg-sovscan-1473"
$CONTAINER_ENV   = "cae-sovscan"
$DB_NAME         = "sovscan"
$DB_USER         = "sovadmin"
# Secrets come from environment variables — never hardcode them here.
#   $env:DB_PASSWORD     — PostgreSQL admin password
#   $env:RESEND_API_KEY  — Resend API key
$DB_PASSWORD     = $env:DB_PASSWORD
$RESEND_API_KEY  = $env:RESEND_API_KEY
if (-not $DB_PASSWORD)    { $DB_PASSWORD    = Read-Host -Prompt "Enter DB_PASSWORD (PostgreSQL admin password)" }
if (-not $RESEND_API_KEY) { $RESEND_API_KEY = Read-Host -Prompt "Enter RESEND_API_KEY" }
if (-not $DB_PASSWORD -or -not $RESEND_API_KEY) { throw "DB_PASSWORD and RESEND_API_KEY are required." }

Write-Host "=== SovScan Azure Deployment ===" -ForegroundColor Cyan

# ── 0. Set subscription context ──────────────────────────────────────────────
az account set --subscription "be505343-cc88-4a62-b4f0-9f1d674f7777"
if ($LASTEXITCODE -ne 0) { throw "Failed to set subscription context" }
Write-Host "Subscription: NL-TT-AZU-SBX-0001473" -ForegroundColor Gray

# ── 1. Resource Group ────────────────────────────────────────────────────────
Write-Host "`n[1/9] Resource Group..." -ForegroundColor Yellow
az group create --name $RESOURCE_GROUP --location $LOCATION --output none
Write-Host "OK" -ForegroundColor Green

# ── 2. Container Registry ────────────────────────────────────────────────────
Write-Host "`n[2/9] Azure Container Registry..." -ForegroundColor Yellow
$acrExists = az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query name -o tsv 2>$null
if (-not $acrExists) {
    az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true --output none
    Write-Host "Created ACR: $ACR_NAME" -ForegroundColor Green
} else {
    Write-Host "ACR already exists: $ACR_NAME" -ForegroundColor Gray
}
$ACR_SERVER = "$ACR_NAME.azurecr.io"

# ── 3. Build & Push backend image via ACR Build (no local Docker needed) ─────
Write-Host "`n[3/10] Build & push backend image..." -ForegroundColor Yellow
az acr build --registry $ACR_NAME --image sovscan-backend:latest ./backend --output none
Write-Host "Backend image pushed" -ForegroundColor Green

# NOTE: Frontend image is built later (step 9) once the backend URL is known.
# The React build needs REACT_APP_API_URL baked in at compile time.

# ── 4. PostgreSQL Flexible Server ────────────────────────────────────────────
Write-Host "`n[4/10] PostgreSQL Flexible Server..." -ForegroundColor Yellow
$pgExists = az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $PG_SERVER --query name -o tsv 2>$null
if (-not $pgExists) {
    az postgres flexible-server create `
        --resource-group $RESOURCE_GROUP `
        --name $PG_SERVER `
        --location $LOCATION `
        --admin-user $DB_USER `
        --admin-password $DB_PASSWORD `
        --sku-name Standard_B1ms `
        --tier Burstable `
        --version 15 `
        --public-access 0.0.0.0 `
        --database-name $DB_NAME `
        --output none
    Write-Host "PostgreSQL server created" -ForegroundColor Green
} else {
    Write-Host "PostgreSQL server already exists" -ForegroundColor Gray
}

$PG_HOST = az postgres flexible-server show `
    --resource-group $RESOURCE_GROUP `
    --name $PG_SERVER `
    --query "fullyQualifiedDomainName" -o tsv

Write-Host "DB Host: $PG_HOST" -ForegroundColor Gray

# ── 5. Initialize database schema ────────────────────────────────────────────
Write-Host "`n[5/10] Initializing database schema (init.sql)..." -ForegroundColor Yellow
$initSqlPath = (Resolve-Path ".\backend\init.sql").Path.Replace('\', '/')
docker run --rm `
    -e PGPASSWORD=$DB_PASSWORD `
    -v "${initSqlPath}:/init.sql" `
    postgres:15-alpine `
    psql -h $PG_HOST -p 5432 -U $DB_USER -d $DB_NAME --set=sslmode=require -f /init.sql
Write-Host "Database initialized" -ForegroundColor Green

# ── 6. Container Apps Environment ────────────────────────────────────────────
Write-Host "`n[6/10] Container Apps Environment..." -ForegroundColor Yellow
$envExists = az containerapp env show --name $CONTAINER_ENV --resource-group $RESOURCE_GROUP --query name -o tsv 2>$null
if (-not $envExists) {
    az containerapp env create `
        --name $CONTAINER_ENV `
        --resource-group $RESOURCE_GROUP `
        --location $LOCATION `
        --output none
    Write-Host "Container Apps Environment created" -ForegroundColor Green
} else {
    Write-Host "Container Apps Environment already exists" -ForegroundColor Gray
}

# ACR credentials
$ACR_USERNAME = az acr credential show --name $ACR_NAME --query username -o tsv
$ACR_PASSWORD_VAL = az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv

# ── 7. Backend Container App ─────────────────────────────────────────────────
Write-Host "`n[7/10] Deploying backend Container App..." -ForegroundColor Yellow
$backendExists = az containerapp show --name sovscan-backend --resource-group $RESOURCE_GROUP --query name -o tsv 2>$null
if (-not $backendExists) {
    az containerapp create `
        --name sovscan-backend `
        --resource-group $RESOURCE_GROUP `
        --environment $CONTAINER_ENV `
        --image "$ACR_SERVER/sovscan-backend:latest" `
        --registry-server $ACR_SERVER `
        --registry-username $ACR_USERNAME `
        --registry-password $ACR_PASSWORD_VAL `
        --target-port 8080 `
        --ingress external `
        --min-replicas 0 --max-replicas 5 `
        --secrets "db-password=$DB_PASSWORD" "resend-key=$RESEND_API_KEY" `
        --env-vars `
            "DB_HOST=$PG_HOST" `
            "DB_PORT=5432" `
            "DB_USER=$DB_USER" `
            "DB_NAME=$DB_NAME" `
            "DB_SSL=true" `
            "DB_PASSWORD=secretref:db-password" `
            "RESEND_API_KEY=secretref:resend-key" `
        --output none
    Write-Host "Backend deployed" -ForegroundColor Green
} else {
    az containerapp update `
        --name sovscan-backend `
        --resource-group $RESOURCE_GROUP `
        --image "$ACR_SERVER/sovscan-backend:latest" `
        --output none
    Write-Host "Backend updated" -ForegroundColor Green
}

$BACKEND_FQDN = az containerapp show `
    --name sovscan-backend `
    --resource-group $RESOURCE_GROUP `
    --query "properties.configuration.ingress.fqdn" -o tsv

$BACKEND_URL = "https://$BACKEND_FQDN"
Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor Gray

# ── 8. Frontend: Build image with backend URL baked in, then deploy ───────────
Write-Host "`n[8/10] Build & push frontend image (with backend URL)..." -ForegroundColor Yellow
az acr build --registry $ACR_NAME --image sovscan-frontend:latest `
    --build-arg "REACT_APP_API_URL=$BACKEND_URL/api" ./frontend --output none
Write-Host "Frontend image pushed (API URL: $BACKEND_URL/api)" -ForegroundColor Green

# NOTE: On Deloitte Azure subscriptions, `az containerapp update` may silently
# fail due to InvalidPolicyEvaluation errors. Deleting & recreating the container
# app is the reliable workaround.
Write-Host "`n[9/10] Deploying frontend Container App..." -ForegroundColor Yellow
$frontendExists = az containerapp show --name sovscan-frontend --resource-group $RESOURCE_GROUP --query name -o tsv 2>$null
if ($frontendExists) {
    Write-Host "Removing old frontend container..." -ForegroundColor Gray
    az containerapp delete --name sovscan-frontend --resource-group $RESOURCE_GROUP --yes --output none
}
az containerapp create `
    --name sovscan-frontend `
    --resource-group $RESOURCE_GROUP `
    --environment $CONTAINER_ENV `
    --image "$ACR_SERVER/sovscan-frontend:latest" `
    --registry-server $ACR_SERVER `
    --registry-username $ACR_USERNAME `
    --registry-password $ACR_PASSWORD_VAL `
    --target-port 8080 `
    --ingress external `
    --min-replicas 0 --max-replicas 5 `
    --env-vars "BACKEND_URL=$BACKEND_URL" `
    --output none
Write-Host "Frontend deployed" -ForegroundColor Green

$FRONTEND_FQDN = az containerapp show `
    --name sovscan-frontend `
    --resource-group $RESOURCE_GROUP `
    --query "properties.configuration.ingress.fqdn" -o tsv

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " SovScan live op Azure!" -ForegroundColor Green
Write-Host " URL: https://$FRONTEND_FQDN" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

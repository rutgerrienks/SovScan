# SovScan Cloud Deployment Script — Azure
# Builds and pushes container images to Azure Container Registry via ACR Build Tasks.
# Called automatically by Terraform (registry.tf null_resource.container_push),
# but can also be run standalone.
param (
    [Parameter(Mandatory=$true)]
    [string]$AcrName
)

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host "--- SovScan: Building & Pushing to ACR '$AcrName' ---" -ForegroundColor Cyan

# Backend
Write-Host "Building backend image..." -ForegroundColor Yellow
az acr build --registry $AcrName --image sovscan-backend:latest "$ScriptRoot/backend"
if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }

# Frontend
Write-Host "Building frontend image..." -ForegroundColor Yellow
az acr build --registry $AcrName --image sovscan-frontend:latest --build-arg REACT_APP_API_URL=/api "$ScriptRoot/frontend"
if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }

Write-Host "--- Images successfully pushed to $AcrName.azurecr.io ---" -ForegroundColor Green

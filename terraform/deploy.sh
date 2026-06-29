#!/usr/bin/env bash
# SovScan — one-shot deploy naar een Azure subscription.
#
# Doet alles in één keer:
#   1. terraform apply  (resource group, ACR, PostgreSQL, App Service, web apps)
#   2. bouwt + pusht de backend/frontend images (az acr build)
#   3. laadt het DB-schema (backend/init.sql) via een Azure Container Instance
#      — draait ín Azure, dus werkt ook als lokaal poort 5432 geblokkeerd is
#   4. herstart de web apps zodat ze de nieuwe images pullen
#
# Vereist: az (ingelogd: `az login`), terraform >= 1.5, een ingevulde
# terraform.tfvars (zie terraform.tfvars.example).
set -euo pipefail

cd "$(dirname "$0")"
ROOT="$(cd .. && pwd)"

echo "==> 0/4  Controles"
command -v az >/dev/null        || { echo "az CLI ontbreekt"; exit 1; }
command -v terraform >/dev/null || { echo "terraform ontbreekt"; exit 1; }
az account show >/dev/null      || { echo "Niet ingelogd — run 'az login'"; exit 1; }

echo "==> 1/4  Terraform apply (infra)"
terraform init -input=false
terraform apply -input=false -auto-approve

# Outputs ophalen
RG=$(terraform output -raw resource_group)
ACR=$(terraform output -raw acr_name)
PG_FQDN=$(terraform output -raw pg_fqdn)
DB_NAME=$(terraform output -raw db_name)
DB_USER=$(terraform output -raw db_admin_user)
DB_PW=$(terraform output -raw db_admin_password)
ST=$(terraform output -raw storage_account)
SHARE=$(terraform output -raw storage_share)
BE_APP=$(terraform output -raw backend_app_name)
FE_APP=$(terraform output -raw frontend_app_name)
FE_URL=$(terraform output -raw frontend_url)

echo "==> 2/4  Images bouwen en pushen ($ACR)"
az acr build -r "$ACR" -t sovscan-backend:latest "$ROOT/backend"
az acr build -r "$ACR" --build-arg REACT_APP_API_URL=/api -t sovscan-frontend:latest "$ROOT/frontend"

echo "==> 3/4  Schema laden in PostgreSQL ($DB_NAME) via Azure Container Instance"
ST_KEY=$(az storage account keys list -n "$ST" -g "$RG" --query "[0].value" -o tsv)
az storage file upload --account-name "$ST" --account-key "$ST_KEY" \
  --share-name "$SHARE" --source "$ROOT/backend/init.sql" --output none
# postgres-image in eigen ACR (vermijdt Docker Hub rate limits)
az acr import -n "$ACR" --source docker.io/library/postgres:16-alpine \
  --image postgres:16-alpine --force --output none
ACR_PW=$(az acr credential show -n "$ACR" --query "passwords[0].value" -o tsv)
az container delete -g "$RG" -n sovscan-sqlload --yes --output none 2>/dev/null || true
az container create -g "$RG" -n sovscan-sqlload \
  --image "$ACR.azurecr.io/postgres:16-alpine" \
  --registry-login-server "$ACR.azurecr.io" \
  --registry-username "$ACR" --registry-password "$ACR_PW" \
  --restart-policy Never --os-type Linux --cpu 1 --memory 1 \
  --azure-file-volume-account-name "$ST" --azure-file-volume-account-key "$ST_KEY" \
  --azure-file-volume-share-name "$SHARE" --azure-file-volume-mount-path /mnt/sql \
  --secure-environment-variables PGPASSWORD="$DB_PW" \
  --command-line "psql 'host=$PG_FQDN port=5432 user=$DB_USER dbname=$DB_NAME sslmode=require' -v ON_ERROR_STOP=1 -f /mnt/sql/init.sql" \
  --output none
# Wachten tot de seed-container klaar is
for _ in $(seq 1 30); do
  state=$(az container show -g "$RG" -n sovscan-sqlload --query "containers[0].instanceView.currentState.state" -o tsv 2>/dev/null || echo "")
  [ "$state" = "Terminated" ] && break
  sleep 5
done
SEED_EXIT=$(az container show -g "$RG" -n sovscan-sqlload --query "containers[0].instanceView.currentState.exitCode" -o tsv 2>/dev/null || echo "?")
echo "    seed exit code: $SEED_EXIT"
az container logs -g "$RG" -n sovscan-sqlload | tail -5 || true
az container delete -g "$RG" -n sovscan-sqlload --yes --output none 2>/dev/null || true
[ "$SEED_EXIT" = "0" ] || { echo "FOUT: schema-load faalde (exit $SEED_EXIT)"; exit 1; }

echo "==> 4/4  Web apps herstarten (nieuwe images pullen)"
az webapp restart -g "$RG" -n "$BE_APP" --output none
az webapp restart -g "$RG" -n "$FE_APP" --output none

echo ""
echo "Klaar. App: $FE_URL"
echo "Login (geseed): admin / admin123  ·  sovadmin / sovadmin123"
echo "DB-wachtwoord opvragen: terraform output -raw db_admin_password"

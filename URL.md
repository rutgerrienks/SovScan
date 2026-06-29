# SovScan — Deploy URLs & Toegang

**Deploy:** 2026-06-29 · image tag `20260629202617` · frontend versie `1.1.0`
**Subscription:** NL-TT-AZU-SBX-0001478 · resource group `rg-sovscan`
**Platform:** Azure App Service (Web App for Containers, Linux B1)
> Container Apps was niet mogelijk op deze subscription (kapotte tenant-policy blokkeert `Microsoft.App/containerApps`); daarom App Service.

## URLs
| Onderdeel | URL |
|-----------|-----|
| **App (frontend)** | https://sovscan-frontend-1478.azurewebsites.net |
| Backend API | https://sovscan-backend-1478.azurewebsites.net |
| Backend health | https://sovscan-backend-1478.azurewebsites.net/health |

## Login (applicatie)
Deze accounts worden geseed via `backend/init.sql`:

| Gebruiker | Wachtwoord | Rol |
|-----------|------------|-----|
| `admin` | `admin123` | user |
| `sovadmin` | `sovadmin123` | admin |

## Infrastructuur
| Resource | Naam |
|----------|------|
| Container Registry | `acrsovscan1478.azurecr.io` |
| PostgreSQL Flexible Server | `pg-sovscan-1478.postgres.database.azure.com` (db `dsh_data`, admin `sovadmin`) |
| App Service Plan | `asp-sovscan` (Linux B1) |
| Storage (schema-load) | `stsovscan1478` |

> DB-admin-wachtwoord is **niet** in deze repo opgenomen (Azure-secret / App Service app setting `DB_PASSWORD`).

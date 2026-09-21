# SovScan — architecture & run cost

## What runs in production

SovScan is a small 3-tier web app:

| Layer | Service | Purpose |
|---|---|---|
| Frontend | Azure App Service (Linux, Web App for Containers) | Serves the React UI |
| Backend | Azure App Service (Linux, Web App for Containers) | Node/Express API |
| Database | Azure Database for PostgreSQL Flexible Server | Persistent app data |
| Images | Azure Container Registry | Stores frontend/backend container images |
| Secrets/config | App Service settings / Azure secrets | DB password, API keys |

## Logical flow

`browser -> frontend App Service -> backend App Service -> PostgreSQL`

The frontend is built with the backend API URL baked in.  
The backend reads DB settings from environment variables and connects to PostgreSQL over SSL.

## Footprint

For the current Azure setup the footprint is roughly:

- **2 web apps** on one **Linux App Service Plan (B1)**
- **1 PostgreSQL Flexible Server** instance
- **1 ACR Basic** registry
- **1 small storage account** only if schema/bootstrap artifacts are used
- Optional external dependency: **Resend** for mail/API calls

## Rough monthly cost

This is an approximate **always-on** production cost for a small workload in West Europe.

| Component | Rough cost / month |
|---|---:|
| App Service Plan B1 | ~€12–€18 |
| PostgreSQL Flexible Server B1ms | ~€25–€45 |
| Azure Container Registry Basic | ~€5 |
| Storage / misc. | ~€1–€5 |
| **Total** | **~€45–€75 / month** |

## Notes

- This estimate excludes outbound bandwidth and unusual growth in database/storage.
- Costs can be lower if the app is stopped outside office hours, but the current setup is meant to stay live.
- Container Apps was not used on this subscription; App Service is the active platform.
- Secrets such as the DB password are not stored in the repo.


terraform {
  required_version = ">= 1.5"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

# ── Naamgeving ───────────────────────────────────────────────────────────────
# ACR, opslag en web apps hebben globaal-unieke namen nodig; een random suffix
# voorkomt botsingen bij deploy op een willekeurige subscription.
resource "random_string" "suffix" {
  length  = 6
  upper   = false
  special = false
}

resource "random_password" "db" {
  length           = 24
  special          = true
  override_special = "!#$%-_"
  # PostgreSQL admin-wachtwoord: minstens 3 van 4 categorieën.
  min_upper   = 2
  min_lower   = 2
  min_numeric = 2
}

locals {
  suffix   = random_string.suffix.result
  acr_name = "${var.name_prefix}acr${local.suffix}" # alleen alfanumeriek
  st_name  = "${var.name_prefix}st${local.suffix}"  # alleen alfanumeriek, <=24
  pg_name  = "${var.name_prefix}-pg-${local.suffix}"
  be_name  = "${var.name_prefix}-backend-${local.suffix}"
  fe_name  = "${var.name_prefix}-frontend-${local.suffix}"
}

resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
}

# ── Container Registry ───────────────────────────────────────────────────────
resource "azurerm_container_registry" "main" {
  name                = local.acr_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true
}

# ── PostgreSQL Flexible Server (managed) ─────────────────────────────────────
resource "azurerm_postgresql_flexible_server" "main" {
  name                          = local.pg_name
  resource_group_name           = azurerm_resource_group.main.name
  location                      = azurerm_resource_group.main.location
  version                       = "16"
  administrator_login           = var.db_admin_user
  administrator_password        = random_password.db.result
  storage_mb                    = 32768
  sku_name                      = "B_Standard_B1ms"
  public_network_access_enabled = true
  zone                          = "1"

  lifecycle {
    # Voorkom dat een latere zone-/storage-drift de server wil herbouwen.
    ignore_changes = [zone, high_availability]
  }
}

# Sta verbindingen vanuit Azure-services (App Service-uitgaand) toe.
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure" {
  name             = "allow-azure-services"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

resource "azurerm_postgresql_flexible_server_database" "app" {
  name      = var.db_name
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# ── Opslag voor eenmalige schema-seed (gebruikt door deploy.sh / ACI) ─────────
resource "azurerm_storage_account" "seed" {
  name                     = local.st_name
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_share" "seed" {
  name               = "sqlshare"
  storage_account_id = azurerm_storage_account.seed.id
  quota              = 1
}

# ── App Service (compute) ────────────────────────────────────────────────────
# Bewust App Service i.p.v. Azure Container Apps: op sommige subscriptions
# blokkeert een tenant-policy het aanmaken van Microsoft.App/containerApps.
resource "azurerm_service_plan" "main" {
  name                = "${var.name_prefix}-plan"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = var.app_service_sku
}

resource "azurerm_linux_web_app" "backend" {
  name                = local.be_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_service_plan.main.location
  service_plan_id     = azurerm_service_plan.main.id

  site_config {
    application_stack {
      docker_image_name        = "sovscan-backend:latest"
      docker_registry_url      = "https://${azurerm_container_registry.main.login_server}"
      docker_registry_username = azurerm_container_registry.main.admin_username
      docker_registry_password = azurerm_container_registry.main.admin_password
    }
  }

  app_settings = {
    WEBSITES_PORT = "3001"
    PORT          = "3001"
    DB_HOST       = azurerm_postgresql_flexible_server.main.fqdn
    DB_PORT       = "5432"
    DB_USER       = var.db_admin_user
    DB_NAME       = var.db_name
    DB_SSL        = "true"
    DB_PASSWORD   = random_password.db.result
  }
}

resource "azurerm_linux_web_app" "frontend" {
  name                = local.fe_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_service_plan.main.location
  service_plan_id     = azurerm_service_plan.main.id

  site_config {
    application_stack {
      docker_image_name        = "sovscan-frontend:latest"
      docker_registry_url      = "https://${azurerm_container_registry.main.login_server}"
      docker_registry_username = azurerm_container_registry.main.admin_username
      docker_registry_password = azurerm_container_registry.main.admin_password
    }
  }

  app_settings = {
    WEBSITES_PORT = "8080"
    # nginx in de frontend-image proxyt /api naar deze HTTPS-backend (SNI).
    BACKEND_URL = "https://${azurerm_linux_web_app.backend.default_hostname}"
  }
}

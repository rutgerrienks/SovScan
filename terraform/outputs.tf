output "frontend_url" {
  description = "Publieke URL van de applicatie (frontend)."
  value       = "https://${azurerm_linux_web_app.frontend.default_hostname}"
}

output "backend_url" {
  description = "URL van de backend-API."
  value       = "https://${azurerm_linux_web_app.backend.default_hostname}"
}

output "acr_name" {
  description = "Naam van de Container Registry (voor az acr build)."
  value       = azurerm_container_registry.main.name
}

output "acr_login_server" {
  value = azurerm_container_registry.main.login_server
}

output "resource_group" {
  value = azurerm_resource_group.main.name
}

output "pg_fqdn" {
  description = "FQDN van de PostgreSQL-server."
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "db_name" {
  value = azurerm_postgresql_flexible_server_database.app.name
}

output "db_admin_user" {
  value = var.db_admin_user
}

output "db_admin_password" {
  description = "Gegenereerd PostgreSQL admin-wachtwoord."
  value       = random_password.db.result
  sensitive   = true
}

output "storage_account" {
  description = "Storage account voor de eenmalige schema-seed."
  value       = azurerm_storage_account.seed.name
}

output "storage_share" {
  value = azurerm_storage_share.seed.name
}

output "backend_app_name" {
  value = azurerm_linux_web_app.backend.name
}

output "frontend_app_name" {
  value = azurerm_linux_web_app.frontend.name
}

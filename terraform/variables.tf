variable "subscription_id" {
  description = "Azure subscription ID waarop gedeployed wordt."
  type        = string
}

variable "resource_group_name" {
  description = "Naam van de resource group (wordt aangemaakt)."
  type        = string
  default     = "rg-sovscan"
}

variable "location" {
  description = "Azure-regio. West Europe werkt voor App Service/ACR/PostgreSQL."
  type        = string
  default     = "westeurope"
}

variable "name_prefix" {
  description = "Voorvoegsel voor resourcenamen (alleen kleine letters/cijfers)."
  type        = string
  default     = "sovscan"

  validation {
    condition     = can(regex("^[a-z0-9]{2,12}$", var.name_prefix))
    error_message = "name_prefix moet 2-12 tekens zijn, alleen kleine letters en cijfers."
  }
}

variable "db_admin_user" {
  description = "PostgreSQL administrator-login."
  type        = string
  default     = "sovadmin"
}

variable "db_name" {
  description = "Naam van de applicatiedatabase."
  type        = string
  default     = "dsh_data"
}

variable "app_service_sku" {
  description = "App Service Plan SKU (Linux). B1 = goedkoop/demo."
  type        = string
  default     = "B1"
}

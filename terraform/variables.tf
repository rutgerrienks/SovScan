variable "project_id" {
  description = "Scaleway Project ID"
  type        = string
}

variable "region" {
  description = "Scaleway Region (e.g., nl-ams)"
  type        = string
  default     = "nl-ams"
}

variable "zone" {
  description = "Scaleway Zone (e.g., nl-ams-1)"
  type        = string
  default     = "nl-ams-1"
}

variable "env_name" {
  description = "Environment name (e.g. prod, dev)"
  type        = string
  default     = "sovscan"
}

variable "resend_api_key" {
  description = "API Key for Resend email service"
  type        = string
  sensitive   = true
}

# Kubernetes Configuration
variable "k8s_node_type" {
  description = "Instance type for K8s nodes"
  type        = string
  default     = "DEV1-M"
}

variable "k8s_min_size" {
  description = "Min nodes in pool"
  type        = number
  default     = 1
}

variable "k8s_max_size" {
  description = "Max nodes in pool"
  type        = number
  default     = 3
}

# Database Configuration
variable "db_node_type" {
  description = "Instance type for Database"
  type        = string
  default     = "db-dev-s"
}

variable "db_user" {
  description = "Database username"
  type        = string
  default     = "sovscan_admin"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

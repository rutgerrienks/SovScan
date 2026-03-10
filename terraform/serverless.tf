resource "scaleway_container_namespace" "sovscan_namespace" {
  name        = "sov-ns-${substr(var.project_id, 0, 8)}"
  description = "Namespace for SovScan serverless containers"
  region      = var.region
}

# Backend Container
resource "scaleway_container" "backend" {
  name            = "sovscan-backend"
  namespace_id    = scaleway_container_namespace.sovscan_namespace.id
  registry_image  = "${scaleway_registry_namespace.sovscan_registry.endpoint}/sovscan-backend:latest"
  port            = 8080
  cpu_limit       = 140
  memory_limit    = 256
  min_scale       = 0
  max_scale       = 5
  timeout         = 60
  protocol        = "http1"
  privacy         = "public"
  sandbox         = "v2"

  environment_variables = {
    DB_HOST         = scaleway_rdb_instance.sovscan_db.endpoint_ip
    DB_PORT         = tostring(scaleway_rdb_instance.sovscan_db.endpoint_port)
    DB_USER         = var.db_user
    DB_NAME         = "sovscan"
    DB_SSL          = "true"
    REDEPLOY_AT     = null_resource.container_push.triggers.timestamp
  }

  secret_environment_variables = {
    DB_PASSWORD    = var.db_password
    RESEND_API_KEY = var.resend_api_key
  }

  depends_on = [null_resource.container_push]
}

# Frontend Container
resource "scaleway_container" "frontend" {
  name            = "sovscan-frontend"
  namespace_id    = scaleway_container_namespace.sovscan_namespace.id
  registry_image  = "${scaleway_registry_namespace.sovscan_registry.endpoint}/sovscan-frontend:latest"
  port            = 8080
  cpu_limit       = 140
  memory_limit    = 512
  min_scale       = 0
  max_scale       = 5
  timeout         = 60
  protocol        = "http1"
  privacy         = "public"
  sandbox         = "v2"

  environment_variables = {
    BACKEND_URL       = "https://${scaleway_container.backend.domain_name}"
    REACT_APP_API_URL = "https://${scaleway_container.backend.domain_name}"
    REDEPLOY_AT       = null_resource.container_push.triggers.timestamp
  }

  depends_on = [null_resource.container_push, scaleway_container.backend]
}

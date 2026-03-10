output "registry_endpoint" {
  value = scaleway_registry_namespace.sovscan_registry.endpoint
}

output "database_host" {
  value = scaleway_rdb_instance.sovscan_db.endpoint_ip
}

output "database_port" {
  value = scaleway_rdb_instance.sovscan_db.endpoint_port
}

output "backend_url" {
  value = "https://${scaleway_container.backend.domain_name}"
}

output "frontend_url" {
  value = "https://${scaleway_container.frontend.domain_name}"
}

output "db_init_command" {
  value     = "docker run --rm -e PGPASSWORD=${var.db_password} -v ${abspath(path.module)}/../backend/init.sql:/init.sql postgres:15-alpine psql -h ${scaleway_rdb_instance.sovscan_db.endpoint_ip} -p ${scaleway_rdb_instance.sovscan_db.endpoint_port} -U ${var.db_user} -d sovscan -f /init.sql"
  sensitive = true
}

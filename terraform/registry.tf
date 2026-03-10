resource "scaleway_registry_namespace" "sovscan_registry" {
  name        = "sovscan-reg-${var.project_id}"
  description = "Registry for SovScan containers"
  is_public   = false
}

# Automatisch bouwen en pushen van containers na aanmaken registry
resource "null_resource" "container_push" {
  triggers = {
    # Forceer push bij elke apply
    timestamp = timestamp()
    registry_id = scaleway_registry_namespace.sovscan_registry.id
  }

  provisioner "local-exec" {
    command = "powershell.exe -File ../deploy_to_cloud.ps1 -RegistryEndpoint ${scaleway_registry_namespace.sovscan_registry.endpoint}"
  }

  depends_on = [scaleway_registry_namespace.sovscan_registry]
}

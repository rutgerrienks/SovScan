resource "scaleway_vpc_private_network" "sovscan_pn" {
  name   = "sovscan-pn"
  region = var.region
  tags   = ["sovscan", "network"]
}

# VPC Gateway
resource "scaleway_vpc_public_gateway" "sovscan_gw" {
  name  = "sovscan-gw"
  # 'Learning' is niet meer beschikbaar, gebruik de nieuwe standaard: 'VPC-GW-S'
  type  = "VPC-GW-S"
  zone  = var.zone
}

resource "scaleway_vpc_gateway_network" "main" {
  gateway_id         = scaleway_vpc_public_gateway.sovscan_gw.id
  private_network_id = scaleway_vpc_private_network.sovscan_pn.id
  
  # Moderne IPAM configuratie ipv cleanup_dhcp
  ipam_config {
    push_default_route = true
  }

  enable_masquerade  = true
}

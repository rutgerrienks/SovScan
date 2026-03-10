resource "scaleway_object_bucket" "sovscan_docs" {
  name   = "sovscan-documents-${var.project_id}" # Maak uniek met project ID
  region = var.region
}

resource "scaleway_object_bucket" "sovscan_exports" {
  name   = "sovscan-exports-${var.project_id}"
  region = var.region
}

resource "scaleway_object_bucket" "sovscan_assets" {
  name   = "sovscan-assets-${var.project_id}"
  region = var.region
}

terraform {
  required_providers {
    scaleway = {
      source  = "scaleway/scaleway"
      version = ">= 2.30.0"
    }
    local = {
      source  = "hashicorp/local"
      version = ">= 2.4.0"
    }
    null = {
      source  = "hashicorp/null"
      version = ">= 3.2.0"
    }
  }
  required_version = ">= 1.5.0"
}

provider "scaleway" {
  project_id = var.project_id
  region     = var.region
  zone       = var.zone
}

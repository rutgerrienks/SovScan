resource "scaleway_rdb_instance" "sovscan_db" {
  name           = "sovscan-db"
  node_type      = var.db_node_type
  engine         = "PostgreSQL-15"
  disable_backup = true
  user_name      = var.db_user
  password       = var.db_password
  region         = var.region

  # We gebruiken hier alleen de standaard instellingen
  # De LoadBalancer (publiek) is nodig zolang de serverless-vpc integratie niet via connector gaat
}

resource "scaleway_rdb_database" "main" {
  instance_id = scaleway_rdb_instance.sovscan_db.id
  name        = "sovscan"
}

# Grant permissies aan de gebruiker voor de database
resource "scaleway_rdb_privilege" "main" {
  instance_id   = scaleway_rdb_instance.sovscan_db.id
  user_name     = var.db_user
  database_name = scaleway_rdb_database.main.name
  permission    = "all"
}

# Sta verkeer toe (ACL) zodat serverless containers erbij kunnen
resource "scaleway_rdb_acl" "main" {
  instance_id = scaleway_rdb_instance.sovscan_db.id
  acl_rules {
    ip          = "0.0.0.0/0" # Tijdelijk voor test-omgeving, beveilig dit later!
    description = "Allow global access for serverless testing"
  }
}

# Automatische initialisatie van de database
resource "null_resource" "db_init" {
  depends_on = [scaleway_rdb_instance.sovscan_db, scaleway_rdb_database.main, scaleway_rdb_acl.main, scaleway_rdb_privilege.main]

  triggers = {
    # Voer opnieuw uit als de database instance verandert of init.sql wijzigt
    db_id       = scaleway_rdb_instance.sovscan_db.id
    script_hash = filesha256("${path.module}/../backend/init.sql")
  }

  provisioner "local-exec" {
    # Gebruik Docker om psql te draaien tegen de remote database
    # We mounten init.sql in de container en voeren het uit
    # Let op: PGPASSWORD wordt als environment variabele doorgegeven
    command = "docker run --rm -e PGPASSWORD=${var.db_password} -v ${abspath(path.module)}/../backend/init.sql:/init.sql postgres:15-alpine psql -h ${scaleway_rdb_instance.sovscan_db.endpoint_ip} -p ${scaleway_rdb_instance.sovscan_db.endpoint_port} -U ${var.db_user} -d sovscan -f /init.sql"
    
    # Voor Windows compatibility gebruiken we Powershell indien beschikbaar, anders default shell
    interpreter = ["PowerShell", "-Command"]
  }
}

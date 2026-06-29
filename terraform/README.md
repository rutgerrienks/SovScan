# SovScan — Terraform deploy

One-shot deploy van de volledige SovScan-stack naar een Azure subscription:
**Container Registry + PostgreSQL (managed) + App Service (frontend & backend)**.

## Waarom App Service (en niet Container Apps)?
Op sommige Deloitte-subscriptions blokkeert een tenant-policy het aanmaken van
`Microsoft.App/containerApps`. App Service (`Microsoft.Web`) wordt daar niet door
geraakt en draait dezelfde container-images. Daarom gebruikt deze module App
Service Web Apps for Containers.

## Vereisten
- [Azure CLI](https://learn.microsoft.com/cli/azure/) — ingelogd via `az login`
- [Terraform](https://www.terraform.io/) >= 1.5
- Rol op de subscription: minimaal **Contributor**

## Gebruik
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
#  vul subscription_id in (en eventueel name_prefix/location)

./deploy.sh
```
`deploy.sh` doet in één keer:
1. `terraform apply` — alle infra (resource group, ACR, PostgreSQL + firewall + database, App Service Plan, 2 web apps).
2. `az acr build` — backend- en frontend-image bouwen en pushen.
3. Schema-seed — `backend/init.sql` wordt geladen via een Azure Container Instance (draait ín Azure; werkt ook als lokaal poort 5432 dichtstaat).
4. Web apps herstarten zodat ze de nieuwe images pullen.

Aan het eind print het script de app-URL en de login-gegevens.

## Alleen infra (zonder build/seed)
```bash
terraform init
terraform apply -var subscription_id=<SUB_ID>
```
Daarna zelf de images bouwen (`az acr build`) en het schema laden.

## Outputs
```bash
terraform output frontend_url
terraform output -raw db_admin_password   # gevoelig
```

## Opruimen
```bash
terraform destroy -var subscription_id=<SUB_ID>
```

## Let op
- Het PostgreSQL-wachtwoord wordt door Terraform gegenereerd (`random_password`)
  en staat in de **Terraform state** — bewaar de state veilig (remote backend
  aanbevolen voor teamgebruik). De state is via `.gitignore` uit git gehouden.
- De PostgreSQL-firewall staat op "Allow Azure Services" (App Service kan
  verbinden). Voeg een eigen IP-regel toe als je lokaal wilt connecten.
- App login-accounts komen uit `backend/init.sql`
  (`admin`/`admin123`, `sovadmin`/`sovadmin123`) — wijzig deze voor productie.

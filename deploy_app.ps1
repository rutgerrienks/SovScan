$ErrorActionPreference = "Stop"

Write-Host "--------------------------------------------------"
Write-Host "DataSafeHouse Deployment Script"
Write-Host "--------------------------------------------------"

# 1. Infrastructure Provisioning with Terraform
Write-Host "Step 1: Provisioning Infrastructure with Terraform..."

if (-not (Test-Path "terraform\.terraform")) {
    Write-Host "Initializing Terraform..."
    terraform -chdir=terraform init
}

# Apply Terraform configuration
Write-Host "Applying Terraform configuration..."
terraform -chdir=terraform apply -auto-approve

if ($LASTEXITCODE -ne 0) {
    Write-Error "Terraform apply failed!"
}

# 2. Get Configuration from Terraform Outputs
Write-Host "Step 2: Fetching Configuration..."
$registry_endpoint = terraform -chdir=terraform output -raw registry_endpoint
$kubeconfig_content = terraform -chdir=terraform output -raw k8s_kubeconfig
# We halen het project_id op voor de zekerheid, mocht dit nodig zijn voor de registry
$project_id = terraform -chdir=terraform output -raw project_id 

if ([string]::IsNullOrWhiteSpace($registry_endpoint)) {
    Write-Error "Registry endpoint is empty. Check Terraform outputs."
}

Write-Host "Registry Endpoint: $registry_endpoint"

# 3. Docker Build and Push
Write-Host "Step 3: Building and Pushing Docker Images..."

$registry_server = $registry_endpoint.Split('/')[0]

# Credentials initialiseren
$scw_secret_key = $env:SCW_SECRET_KEY
$scw_access_key = $env:SCW_ACCESS_KEY

# Verbeterde parser voor .env bestand
if (Test-Path "backend/.env") {
    Write-Host "Reading credentials from backend/.env..."
    Get-Content "backend/.env" | Foreach-Object {
        if ($_ -match "^SCW_SECRET_KEY=(.*)") { $scw_secret_key = $matches[1].Trim().Trim('"').Trim("'") }
        if ($_ -match "^SCW_ACCESS_KEY=(.*)") { $scw_access_key = $matches[1].Trim().Trim('"').Trim("'") }
    }
}

# Fallback/Validatie
if (-not $scw_secret_key) {
    $scw_secret_key = Read-Host -Prompt "Please enter your Scaleway Secret Key (GUID)"
}

# Voer de login uit, maar ga door als het mislukt (omdat we handmatig al ingelogd zijn)
if ($scw_secret_key) {
    Write-Host "Logging into Scaleway Registry ($registry_server)..."
    try {
        $scw_secret_key | docker login $registry_server -u nologin --password-stdin
        Write-Host "Docker login successful."
    } catch {
        Write-Warning "Docker login via script failed, but we continue assuming manual login is active."
    }
}


# Build and Push Backend
Write-Host "Building & Pushing Backend..."
docker build -t "$registry_endpoint/dsh-backend:latest" ./backend
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker push "$registry_endpoint/dsh-backend:latest"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Build and Push Frontend
Write-Host "Building & Pushing Frontend..."
docker build -t "$registry_endpoint/dsh-frontend:latest" --build-arg REACT_APP_API_URL=/api ./frontend
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker push "$registry_endpoint/dsh-frontend:latest"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 4. Update Kubernetes Deployments
Write-Host "Step 4: Updating Kubernetes Deployments..."

$kubeconfig_path = Join-Path (Get-Location) "terraform\kubeconfig.yaml"
$kubeconfig_content | Out-File -Encoding ASCII $kubeconfig_path
$env:KUBECONFIG = $kubeconfig_path

# Restart Deployments om de nieuwe images te laden
Write-Host "Restarting deployments..."
kubectl rollout restart deployment dsh-backend dsh-frontend

Write-Host "--------------------------------------------------"
Write-Host "Deployment Completed Successfully!"
Write-Host "--------------------------------------------------"
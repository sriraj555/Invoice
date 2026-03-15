# Create .env from .env.example in all backend and frontend folders.
# Run from repo root: .\scripts\create-env.ps1

$ErrorActionPreference = "Stop"
$ROOT = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$dirs = @(
  "products\backend", "carts\backend", "orders\backend", "payments\backend", "invoices\backend",
  "gateway",
  "products\frontend", "carts\frontend", "orders\frontend", "payments\frontend", "invoices\frontend",
  "frontend"
)

foreach ($d in $dirs) {
  $envPath = Join-Path $ROOT $d ".env"
  $exPath  = Join-Path $ROOT $d ".env.example"
  if (Test-Path $exPath) {
    if (-not (Test-Path $envPath)) {
      Copy-Item $exPath $envPath -Force
      Write-Host "Created .env in $d"
    } else {
      Write-Host "Exists: $d\.env"
    }
  } else {
    Write-Host "No .env.example: $d"
  }
}
Write-Host "Done."

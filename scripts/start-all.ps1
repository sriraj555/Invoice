# Start all backends and frontends in separate terminal windows.
# Ensures .env exists (from .env.example) in each repo before starting.
# Run from repo root: .\scripts\start-all.ps1   or   pwsh -File scripts\start-all.ps1

$ErrorActionPreference = "Stop"
$ROOT = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

function Ensure-Env {
  param([string]$Dir)
  $envPath = Join-Path $ROOT $Dir
  $envFile = Join-Path $envPath ".env"
  $exampleFile = Join-Path $envPath ".env.example"
  if (-not (Test-Path $envFile)) {
    if (Test-Path $exampleFile) {
      Copy-Item $exampleFile $envFile -Force
      Write-Host "Created .env from .env.example in $Dir"
    } else {
      New-Item -ItemType File -Path $envFile -Force | Out-Null
      Write-Host "Created empty .env in $Dir"
    }
  }
}

function Ensure-Install {
  param([string]$Dir)
  $fullPath = Join-Path $ROOT $Dir
  $nodeModules = Join-Path $fullPath "node_modules"
  if (-not (Test-Path $nodeModules)) {
    Write-Host "Installing dependencies in $Dir..."
    $pkg = Join-Path $fullPath "package.json"
    if (-not (Test-Path $pkg)) {
      Write-Warning "No package.json in $Dir - skipping npm install"
      return
    }
    Push-Location $fullPath
    try {
      $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm", "install" -WorkingDirectory $fullPath -Wait -PassThru -NoNewWindow
      if ($proc.ExitCode -ne 0) { Write-Warning "npm install in $Dir exited with $($proc.ExitCode)" }
    } finally { Pop-Location }
  }
}

function Start-InNewWindow {
  param([string]$Title, [string]$Dir, [string]$Command)
  $fullPath = Join-Path $ROOT $Dir
  if (-not (Test-Path $fullPath)) {
    Write-Warning "Path not found: $fullPath - skipping $Title"
    return
  }
  $run = "`$host.UI.RawUI.WindowTitle = '$Title'; " + $Command
  Start-Process powershell -ArgumentList "-NoExit", "-Command", $run -WorkingDirectory $fullPath
  Write-Host "Started: $Title"
}

$backends = @(
  "products\backend",
  "carts\backend",
  "orders\backend",
  "payments\backend",
  "invoices\backend",
  "gateway"
)
$frontends = @(
  "products\frontend",
  "carts\frontend",
  "orders\frontend",
  "payments\frontend",
  "invoices\frontend",
  "frontend"
)

Write-Host "Ensuring .env exists in all repos..."
foreach ($d in $backends + $frontends) {
  Ensure-Env -Dir $d
}

Write-Host "`nEnsuring node_modules (npm install) in all repos..."
foreach ($d in $backends + $frontends) {
  Ensure-Install -Dir $d
}

Write-Host "`nStarting backends (6 windows)..."
Start-InNewWindow -Title "Products API (4001)"   -Dir "products\backend"   -Command "npm run dev"
Start-Sleep -Milliseconds 500
Start-InNewWindow -Title "Carts API (4002)"     -Dir "carts\backend"     -Command "npm run dev"
Start-Sleep -Milliseconds 500
Start-InNewWindow -Title "Orders API (4003)"    -Dir "orders\backend"    -Command "npm run dev"
Start-Sleep -Milliseconds 500
Start-InNewWindow -Title "Payments API (4004)"  -Dir "payments\backend"  -Command "npm run dev"
Start-Sleep -Milliseconds 500
Start-InNewWindow -Title "Invoices API (4005)"  -Dir "invoices\backend"  -Command "npm run dev"
Start-Sleep -Milliseconds 500
Start-InNewWindow -Title "Gateway (4000)"       -Dir "gateway"           -Command "npm run dev"

Write-Host "`nStarting frontends (5 windows)..."
Start-Sleep -Seconds 3
Start-InNewWindow -Title "Products UI (3011)"   -Dir "products\frontend" -Command "npm run dev"
Start-Sleep -Milliseconds 500
Start-InNewWindow -Title "Carts UI (3012)"      -Dir "carts\frontend"    -Command "npm run dev"
Start-Sleep -Milliseconds 500
Start-InNewWindow -Title "Orders UI (3013)"     -Dir "orders\frontend"   -Command "npm run dev"
Start-Sleep -Milliseconds 500
Start-InNewWindow -Title "Payments UI (3014)"   -Dir "payments\frontend" -Command "npm run dev"
Start-Sleep -Milliseconds 500
Start-InNewWindow -Title "Invoices UI (3015)"   -Dir "invoices\frontend" -Command "npm run dev"
Start-Sleep -Milliseconds 500
Start-InNewWindow -Title "Unified App (3000)"   -Dir "frontend"          -Command "npm run dev"

Write-Host "`nDone. 12 terminal windows opened (6 backends + 6 frontends)."
Write-Host "Gateway: http://localhost:4000  |  Unified app: http://localhost:3000  |  Section UIs: http://localhost:3011-3015"

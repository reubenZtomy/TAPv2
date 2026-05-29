# One-time setup + start TAP V2 (Windows). Run from repo root in PowerShell:
#   Set-ExecutionPolicy -Scope Process Bypass -ExecutionPolicy Bypass
#   .\scripts\setup-windows.ps1

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$FrontendUrl = "http://localhost:5173"
$AdminLoginUrl = "$FrontendUrl/admin/login"
$PublicQuizUrl = "$FrontendUrl/"
$BackendUrl = "http://127.0.0.1:5000"

$BackendProc = $null
$FrontendProc = $null
$EnvWasExisting = $false

function Write-Info($msg) { Write-Host $msg -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host $msg -ForegroundColor Green }
function Write-Err($msg) { Write-Host $msg -ForegroundColor Red }

function Read-DotEnvValue {
    param([string]$FilePath, [string]$Key)
    if (-not (Test-Path $FilePath)) { return $null }
    foreach ($line in Get-Content $FilePath) {
        $trimmed = $line.Trim()
        if ($trimmed -match '^\s*#') { continue }
        if ($trimmed -match "^\s*$([regex]::Escape($Key))\s*=\s*(.*)$") {
            return $Matches[1].Trim().Trim('"').Trim("'")
        }
    }
    return $null
}

function Require-Command($name) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        Write-Err "Missing required command: $name"
        Write-Err "Install it, then run this script again."
        exit 1
    }
}

function Wait-ForUrl($url, $label, $maxSeconds = 90) {
    $deadline = (Get-Date).AddSeconds($maxSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $null = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
            Write-Ok "  $label is ready."
            return
        } catch {
            Start-Sleep -Seconds 1
        }
    }
    throw "Timed out waiting for $label at $url"
}

function Stop-Servers {
    Write-Host ""
    Write-Info "Stopping servers..."
    foreach ($proc in @($BackendProc, $FrontendProc)) {
        if ($proc -and -not $proc.HasExited) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

try {
    Write-Host ""
    Write-Host "TAP V2 — Windows setup" -ForegroundColor White
    Write-Host "Repository: $Root"
    Write-Host ""

    Require-Command python
    Require-Command node
    Require-Command npm

    Write-Info "[1/5] Creating Python virtual environment..."
    if (-not (Test-Path ".venv")) {
        python -m venv .venv
    }

    $venvPython = Join-Path $Root ".venv\Scripts\python.exe"
    $venvPip = Join-Path $Root ".venv\Scripts\pip.exe"

    Write-Info "[2/5] Installing Python dependencies..."
    & $venvPython -m pip install -q --upgrade pip
    & $venvPip install -q -r (Join-Path $Root "backend\requirements.txt")

    Write-Info "[3/5] Configuring backend/.env..."
    $envPath = Join-Path $Root "backend\.env"
    $envExample = Join-Path $Root "backend\.env.example"
    if (-not (Test-Path $envPath)) {
        Copy-Item $envExample $envPath
        Write-Ok "  Created backend\.env from backend\.env.example"
    } else {
        $EnvWasExisting = $true
        Write-Ok "  backend\.env already exists (left unchanged)"
    }

    $AdminEmail = Read-DotEnvValue $envPath "ADMIN_EMAIL"
    $AdminPassword = Read-DotEnvValue $envPath "ADMIN_PASSWORD"
    if (-not $AdminEmail) { $AdminEmail = "(missing — set ADMIN_EMAIL in backend\.env)" }
    if (-not $AdminPassword) { $AdminPassword = "(missing — set ADMIN_PASSWORD in backend\.env)" }

    Write-Info "[4/5] Installing frontend dependencies..."
    Push-Location (Join-Path $Root "frontend")
    npm install --silent
    Pop-Location

    Write-Info "[5/5] Starting backend and frontend..."
    $backendLog = Join-Path $Root ".setup-backend.log"
    $frontendLog = Join-Path $Root ".setup-frontend.log"

    $BackendProc = Start-Process -FilePath $venvPython `
        -ArgumentList "backend/app.py" `
        -WorkingDirectory $Root `
        -RedirectStandardOutput $backendLog `
        -RedirectStandardError $backendLog `
        -PassThru

    if (Get-Command npm.cmd -ErrorAction SilentlyContinue) {
        $npmCmd = (Get-Command npm.cmd).Source
    } else {
        $npmCmd = (Get-Command npm).Source
    }

    $FrontendProc = Start-Process -FilePath $npmCmd `
        -ArgumentList "run", "dev" `
        -WorkingDirectory (Join-Path $Root "frontend") `
        -RedirectStandardOutput $frontendLog `
        -RedirectStandardError $frontendLog `
        -PassThru

    Write-Info "Waiting for servers..."
    Wait-ForUrl "$BackendUrl/api/hello" "Backend"
    Wait-ForUrl "$FrontendUrl/" "Frontend"

    Write-Host ""
    Write-Host "================================================================================" -ForegroundColor White
    Write-Host "  TAP V2 is running" -ForegroundColor White
    Write-Host "================================================================================" -ForegroundColor White
    Write-Host ""
    Write-Host "  Example public quiz (after publish + link)"
    Write-Host "    $PublicQuizUrl"
    Write-Host ""
    Write-Host "  Admin dashboard"
    Write-Host "    $AdminLoginUrl"
    Write-Host ""
    Write-Host "  Admin login (from backend\.env)"
    Write-Host "    Email:    $AdminEmail"
    Write-Host "    Password: $AdminPassword"
    if ($EnvWasExisting) {
        Write-Host "    Note:     Using your existing backend\.env — not the README defaults." -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "  Backend API"
    Write-Host "    $BackendUrl"
    Write-Host ""
    Write-Host "  Dev auto-login: opening /admin/login may sign you in automatically in debug mode."
    Write-Host "  Logs: .setup-backend.log and .setup-frontend.log in the repo root."
    Write-Host ""
    Write-Host "  Press Ctrl+C in this window to stop both servers." -ForegroundColor Yellow
    Write-Host "================================================================================" -ForegroundColor White
    Write-Host ""

    Wait-Process -Id @($BackendProc.Id, $FrontendProc.Id)
} catch {
    Write-Err $_.Exception.Message
    if (Test-Path $backendLog) {
        Write-Err "Last lines of backend log:"
        Get-Content $backendLog -Tail 15 | ForEach-Object { Write-Err "  $_" }
    }
    if (Test-Path $frontendLog) {
        Write-Err "Last lines of frontend log:"
        Get-Content $frontendLog -Tail 15 | ForEach-Object { Write-Err "  $_" }
    }
    exit 1
} finally {
    Stop-Servers
}

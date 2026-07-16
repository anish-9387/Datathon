<#
.SYNOPSIS
  Prepare the project for deployment on Zoho Catalyst.

  This script packages the Next.js app for Catalyst Slate (Git-based or
  direct-upload) and the Python ML service for Catalyst AppSail (Docker).

  Run this script BEFORE pushing to GitHub or uploading to Catalyst.

  Prerequisites:
    - pnpm, Node.js 20+
    - Docker Desktop (only needed for ML service via AppSail)
    - A Zoho Catalyst project (create at console.catalyst.zoho.com)
    - A Neon PostgreSQL database (create at neon.tech)

.DESCRIPTION
  What this script does:
    1. Installs dependencies (pnpm install)
    2. Generates Prisma client
    3. Builds the Next.js app
    4. Generates package-lock.json for npm fallback
    5. Packages the Next.js app into a deployable zip
    6. (Optional) Builds a Docker image for the ML service

  Output:
    - catalyst-web.zip        → Direct upload to Slate or use via Git
    - catalyst-ml-service/    → Docker image for AppSail (build manually)
#>

param(
  [switch]$buildDocker  # Also build the ML service Docker image
)

$ErrorActionPreference = "Stop"
$rootDir = Resolve-Path "$PSScriptRoot/.."
$webDir = "$rootDir/apps/web"
$distDir = "$rootDir/dist-catalyst"

Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    Catalyst Deployment Preparation           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan

# ─── Step 1: Install dependencies ─────────────────────────────────
Write-Host "`n[1/6] Installing dependencies..." -ForegroundColor Yellow
Set-Location $rootDir
pnpm install
if (-not $?) { throw "pnpm install failed" }

# ─── Step 2: Generate Prisma client ───────────────────────────────
Write-Host "`n[2/6] Generating Prisma client..." -ForegroundColor Yellow
pnpm db:generate
if (-not $?) { throw "Prisma generate failed" }

# ─── Step 3: Build Next.js app ────────────────────────────────────
Write-Host "`n[3/6] Building Next.js app..." -ForegroundColor Yellow
Push-Location $webDir
npx next build
if (-not $?) { throw "Next.js build failed" }
Pop-Location

# ─── Step 4: Generate package-lock.json (npm fallback for Slate) ──
Write-Host "`n[4/6] Generating package-lock.json for npm compatibility..." -ForegroundColor Yellow
if (-not (Test-Path "$webDir/package-lock.json")) {
  Push-Location $webDir
  npm install --package-lock-only --workspaces=false 2>$null
  Pop-Location
  Write-Host "  Created apps/web/package-lock.json"
} else {
  Write-Host "  package-lock.json already exists"
}

# ─── Step 5: Package web app bundle ───────────────────────────────
Write-Host "`n[5/6] Packaging web app for Slate direct upload..." -ForegroundColor Yellow
if (Test-Path $distDir) { Remove-Item -Recurse -Force $distDir }
New-Item -ItemType Directory -Path $distDir -Force | Out-Null

# Copy source files needed by Slate to build from source
@(
  "$webDir/.next", "$webDir/public", "$webDir/src",
  "$webDir/package.json", "$webDir/package-lock.json",
  "$webDir/next.config.ts", "$webDir/tsconfig.json",
  "$webDir/.env.example", "$webDir/.gitignore",
  "$webDir/postcss.config.mjs", "$webDir/node_modules"
) | ForEach-Object {
  $src = $_
  if (Test-Path $src) {
    $rel = $src.Replace("$webDir/", "")
    if (Test-Path -LiteralPath $src -PathType Container) {
      Copy-Item -Recurse -Path "$src/*" -Destination "$distDir/$rel/" -ErrorAction SilentlyContinue
    } else {
      Copy-Item -Path $src -Destination "$distDir/$rel" -ErrorAction SilentlyContinue
    }
  }
}

# Copy Prisma schema
Copy-Item -Recurse "$rootDir/prisma" "$distDir/prisma/"

# Create catalyst-env.example with the required environment variables
@"
# ═══════════════════════════════════════════════════════════════
# Catalyst Slate Environment Variables
# Set these in the Catalyst console under Settings → Environment Variables
# ═══════════════════════════════════════════════════════════════

# PostgreSQL connection string from Neon
DATABASE_URL="postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/crime_intel?sslmode=require"

# Auth secrets (generate with: openssl rand -base64 32)
AUTH_SECRET="<replace-with-random-secret>"
NEXTAUTH_SECRET="<replace-with-random-secret>"

# Auth URLs (update AFTER deployment with the actual Slate URL)
# AUTH_URL and NEXTAUTH_URL must match your deployed app URL exactly
AUTH_URL="https://<project-id>.<org-id>.catalystserverless.com"
NEXTAUTH_URL="https://<project-id>.<org-id>.catalystserverless.com"

# ML service URL (AppSail endpoint)
ML_SERVICE_URL="https://<appsail-app-name>-<project-id>.<org-id>.catalystserverless.com"

# Mapbox public token (get one free at https://account.mapbox.com/access-tokens/)
NEXT_PUBLIC_MAPBOX_TOKEN="pk.ey..."
"@ | Set-Content "$distDir/catalyst-env-template.txt"

# Zip the bundle
$zipPath = "$rootDir/catalyst-web.zip"
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($distDir, $zipPath)

Write-Host "  ✅ Created $zipPath" -ForegroundColor Green

# ─── Step 6: (Optional) Build ML service Docker image ────────────
if ($buildDocker) {
  Write-Host "`n[6/6] Building ML service Docker image..." -ForegroundColor Yellow
  Set-Location "$rootDir/apps/ml-service"

  # Check if Docker is available
  $dockerPath = Get-Command "docker" -ErrorAction SilentlyContinue
  if (-not $dockerPath) {
    Write-Host "  ⚠️  Docker not found. Skipping Docker build." -ForegroundColor Red
    Write-Host "  Install Docker Desktop from https://www.docker.com/products/docker-desktop/"
  } else {
    docker build -t crime-intel-ml-service:latest .
    if (-not $?) { throw "Docker build failed" }
    Write-Host "  ✅ Docker image built: crime-intel-ml-service:latest" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Next steps for AppSail Custom Runtime:" -ForegroundColor Cyan
    Write-Host "  1. Tag and push to Docker Hub:" -ForegroundColor White
    Write-Host "     docker tag crime-intel-ml-service:latest your-dockerhub-username/crime-intel-ml-service:latest"
    Write-Host "     docker push your-dockerhub-username/crime-intel-ml-service:latest"
    Write-Host "  2. In Catalyst console → Serverless → AppSail → Deploy from Console"
    Write-Host "     Select 'Docker Image' → Docker Hub → enter image URL"
    Write-Host "     Memory: 2048 MB | Port: 8000"
    Write-Host "     Env vars: CORS_ORIGINS='https://<slate-app-url>'"
  }
}

Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ Preparation complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Next.js app ready for Catalyst Slate."
Write-Host "  ML service ready for Catalyst AppSail."
Write-Host ""
Write-Host "  See the printed deployment guide below." -ForegroundColor Cyan

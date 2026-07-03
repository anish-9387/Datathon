# TBD AI - Setup Script
Write-Host "=== TBD AI Platform Setup ===" -ForegroundColor Cyan

# 1. Install web dependencies
Write-Host "[1/4] Installing web dependencies..." -ForegroundColor Yellow
Set-Location apps/web
npm install
Set-Location ../..

# 2. Generate Prisma client
Write-Host "[2/4] Generating Prisma client..." -ForegroundColor Yellow
Set-Location apps/web
npx prisma generate --schema=../../prisma/schema.prisma
Set-Location ../..

# 3. Seed database
Write-Host "[3/4] Seeding database..." -ForegroundColor Yellow
Set-Location apps/web
npx ts-node ../../scripts/seed.ts
Set-Location ../..

# 4. Install ML service dependencies
Write-Host "[4/4] Installing ML service dependencies..." -ForegroundColor Yellow
pip install -r apps/ml-service/requirements.txt

Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "To run:"
Write-Host "  Web:        cd apps/web && npm run dev"
Write-Host "  ML Service: cd apps/ml-service && uvicorn main:app --reload --port 8000"

# Nexus deploy — calls unified deploy script
param([switch]$SkipBuild, [switch]$SkipPush, [switch]$SkipCommit)

$deploy = "D:\repositories\dev-infra\agents\skills\how-to-deploy-applications-to-servers\scripts\how-to-deploy-to-vps.ps1"

Write-Host "Nexus Deploy — staging → production" -ForegroundColor Cyan

# Staging
pwsh.exe -NoProfile -File $deploy -Service nexus-dev -Port 3001 -VPS 95.217.19.147 -Env staging -Domain dev-nexus.elunari.uk -RepoDir "$PSScriptRoot"
if ($LASTEXITCODE -ne 0) { throw "Staging deploy failed" }

# Production
Write-Host "`nStaging OK. Deploying production..." -ForegroundColor Yellow
pwsh.exe -NoProfile -File $deploy -Service nexus -Port 3000 -VPS 95.217.19.147 -Env production -Domain nexus.elunari.uk -RepoDir "$PSScriptRoot"

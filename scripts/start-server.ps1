. "D:\dev-wrapper\agents\scripts\shell\system.ps1"
$bun = Get-RealBinary "bun"
if (-not $bun) { Write-Error "bun not found"; exit 1 }

Set-Location -LiteralPath "D:\dev-wrapper\repositories\weassist\apps\wsos-extension"
while ($true) {
  Write-Host "Starting WSOS Extension server..."
  & $bun run src/index.ts
  Write-Host "Server exited, restarting in 2s..."
  Start-Sleep -Seconds 2
}

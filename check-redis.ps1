# check-redis.ps1
# This script checks the connection to the local Redis server.

$REDIS_CLI = ".\tools\redis\redis-cli.exe"

if (Test-Path $REDIS_CLI) {
    Write-Host "[Redis] Pinging Server..." -ForegroundColor Yellow
    $ping = & $REDIS_CLI ping
    if ($ping.Trim() -eq "PONG") {
        Write-Host "[Redis] Connection: SUCCESS (PONG)" -ForegroundColor Green
        Write-Host "[Redis] Stats:" -ForegroundColor Cyan
        & $REDIS_CLI info memory | Select-String "used_memory_human"
        & $REDIS_CLI info clients | Select-String "connected_clients"
    } else {
        Write-Host "[Redis] Connection: FAILED. Ensure the server is running by running .\start-redis.ps1" -ForegroundColor Red
    }
} else {
    Write-Host "[Redis] Error: redis-cli.exe not found." -ForegroundColor Red
}

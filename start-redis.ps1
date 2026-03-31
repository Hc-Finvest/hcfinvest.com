# start-redis.ps1
# This script launches the local portable Redis server.

$REDIS_DIR = ".\tools\redis"
$REDIS_CONF = "$REDIS_DIR\redis.windows.conf"
$REDIS_EXE = "$REDIS_DIR\redis-server.exe"

if (Test-Path $REDIS_EXE) {
    Write-Host "🚀 Launching Local Redis Server (Port 6379)..." -ForegroundColor Cyan
    # Start-Process runs it in a separate window so the current terminal stays free
    Start-Process -FilePath $REDIS_EXE -ArgumentList $REDIS_CONF -WorkingDirectory $REDIS_DIR
    Write-Host "✅ Redis is starting in a separate window." -ForegroundColor Green
    Write-Host "💡 Run .\check-redis.ps1 to verify the connection." -ForegroundColor Yellow
} else {
    Write-Host "❌ Error: Redis binaries not found in $REDIS_DIR" -ForegroundColor Red
}

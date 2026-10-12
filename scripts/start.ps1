param(
    [ValidateSet('Api', 'Frontend')]
    [string]$Target = 'Api'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
if ($Target -eq 'Frontend') {
    Push-Location (Join-Path $projectRoot 'frontend')
    try { npm run dev -- --host 127.0.0.1 --port 3000 --strictPort }
    finally { Pop-Location }
    exit $LASTEXITCODE
}

$databaseConfig = Join-Path $projectRoot '.local/database.json'
if (-not (Test-Path $databaseConfig)) { throw 'Run scripts/setup.ps1 first.' }
$database = Get-Content -LiteralPath $databaseConfig -Raw | ConvertFrom-Json
& (Join-Path $database.PostgresBin 'pg_ctl.exe') status -D $database.DataPath
if ($LASTEXITCODE -ne 0) {
    $dbStart = Start-Process -FilePath (Join-Path $database.PostgresBin 'pg_ctl.exe') -ArgumentList @(
        'start', '-D', "`"$($database.DataPath)`"", '-l', "`"$(Join-Path $projectRoot '.local/postgres.log')`"", '-w'
    ) -WindowStyle Hidden -PassThru
    $dbStart.WaitForExit()
    if ($dbStart.ExitCode -ne 0) { throw 'PostgreSQL startup failed. See .local/postgres.log.' }
}
Push-Location (Join-Path $projectRoot 'backend/CampusEats.Api')
try { dotnet run --no-restore --no-launch-profile -- --environment Development --urls http://localhost:5000 }
finally { Pop-Location }
exit $LASTEXITCODE

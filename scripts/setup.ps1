param(
    [string]$PostgresBin,
    [int]$DatabasePort = 5433
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$apiPath = Join-Path $projectRoot 'backend/CampusEats.Api'
$localPath = Join-Path $projectRoot '.local'
$dataPath = Join-Path $localPath 'postgres'
$settingsPath = Join-Path $apiPath 'appsettings.Development.Local.json'

function Invoke-Checked {
    param([string]$Executable, [string[]]$Arguments)
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Executable failed with exit code $LASTEXITCODE." }
}

function New-Secret {
    param([int]$Length)
    $bytes = New-Object byte[] $Length
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $generator.GetBytes($bytes) }
    finally { $generator.Dispose() }
    return [Convert]::ToBase64String($bytes)
}

foreach ($command in 'node', 'npm', 'dotnet') {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        throw "$command is required. Install Node.js and the .NET 8 SDK before running setup."
    }
}
if (-not $PostgresBin) {
    $installation = Get-ChildItem "$env:ProgramFiles/PostgreSQL" -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^\d+(\.\d+)?$' } |
        Sort-Object { [version]($_.Name + '.0') } -Descending | Select-Object -First 1
    if ($installation) { $PostgresBin = Join-Path $installation.FullName 'bin' }
}
if (-not $PostgresBin -or -not (Test-Path (Join-Path $PostgresBin 'initdb.exe'))) {
    throw 'PostgreSQL binaries are required. Supply -PostgresBin with the PostgreSQL bin directory.'
}

New-Item -ItemType Directory -Path $localPath -Force | Out-Null
if (-not (Test-Path (Join-Path $dataPath 'PG_VERSION'))) {
    if (Test-Path $settingsPath) {
        throw 'Local API settings already exist. Back them up before initializing a new project database.'
    }
    $password = New-Secret 32
    $passwordPath = Join-Path $localPath 'initdb-password.txt'
    Set-Content -LiteralPath $passwordPath -Value $password -Encoding ascii
    try {
        Invoke-Checked (Join-Path $PostgresBin 'initdb.exe') @(
            '-D', $dataPath, '-U', 'campuseats', '--pwfile', $passwordPath,
            '--auth-host=scram-sha-256', '--auth-local=scram-sha-256', '--encoding=UTF8', '--locale=C'
        )
    } finally {
        Remove-Item -LiteralPath $passwordPath -ErrorAction SilentlyContinue
    }
    Add-Content -LiteralPath (Join-Path $dataPath 'postgresql.conf') -Value @"

listen_addresses = 'localhost'
port = $DatabasePort
"@
    $settings = @{
        ConnectionStrings = @{ Default = "Host=localhost;Port=$DatabasePort;Database=campuseats;Username=campuseats;Password=$password" }
        Jwt = @{
            Key = New-Secret 48
            Issuer = 'CampusEats.Local'
            Audience = 'CampusEats.Frontend'
        }
    }
    $settings | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $settingsPath -Encoding utf8
}
if (-not (Test-Path $settingsPath)) { throw "Missing local configuration: $settingsPath" }
@{ PostgresBin = $PostgresBin; DataPath = $dataPath } | ConvertTo-Json |
    Set-Content -LiteralPath (Join-Path $localPath 'database.json') -Encoding utf8

& (Join-Path $PostgresBin 'pg_ctl.exe') status -D $dataPath
if ($LASTEXITCODE -ne 0) {
    $dbStart = Start-Process -FilePath (Join-Path $PostgresBin 'pg_ctl.exe') -ArgumentList @(
        'start', '-D', "`"$dataPath`"", '-l', "`"$(Join-Path $localPath 'postgres.log')`"", '-w'
    ) -WindowStyle Hidden -PassThru
    $dbStart.WaitForExit()
    if ($dbStart.ExitCode -ne 0) { throw 'PostgreSQL startup failed. See .local/postgres.log.' }
}

$connection = (Get-Content -LiteralPath $settingsPath -Raw | ConvertFrom-Json).ConnectionStrings.Default
$connectionParts = @{}
foreach ($part in $connection.Split(';', [System.StringSplitOptions]::RemoveEmptyEntries)) {
    $key, $value = $part.Split('=', 2)
    $connectionParts[$key] = $value
}
$oldPassword = $env:PGPASSWORD
try {
    $env:PGPASSWORD = $connectionParts.Password
    $psql = Join-Path $PostgresBin 'psql.exe'
    $dbArgs = @('-w', '-h', $connectionParts.Host, '-p', $connectionParts.Port, '-U', $connectionParts.Username)
    $exists = & $psql @dbArgs -d postgres -Atc "SELECT 1 FROM pg_database WHERE datname = 'campuseats';"
    if ($LASTEXITCODE -ne 0) { throw 'Unable to authenticate with the project database.' }
    if ($exists -ne '1') {
        Invoke-Checked (Join-Path $PostgresBin 'createdb.exe') ($dbArgs + @('campuseats'))
    }
} finally { $env:PGPASSWORD = $oldPassword }

$frontendEnv = Join-Path $projectRoot 'frontend/.env.local'
if (-not (Test-Path $frontendEnv)) {
    Set-Content -LiteralPath $frontendEnv -Value 'VITE_API_URL=http://localhost:5000' -Encoding ascii
}

Push-Location $projectRoot
$previousEnvironment = $env:ASPNETCORE_ENVIRONMENT
try {
    Invoke-Checked dotnet @('restore', 'backend/CampusEats.Api/CampusEats.Api.csproj', '--packages', '.nuget/packages')
    Unblock-File -LiteralPath '.config/dotnet-tools.json'
    Invoke-Checked dotnet @('tool', 'restore')
    Invoke-Checked dotnet @('build', 'backend/CampusEats.Api/CampusEats.Api.csproj', '--no-restore')
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    Invoke-Checked dotnet @('ef', 'database', 'update', '--project', 'backend/CampusEats.Api', '--no-build')
    Push-Location (Join-Path $projectRoot 'frontend')
    try { Invoke-Checked npm @('ci', '--cache', '.npm-cache', '--no-audit', '--no-fund') }
    finally { Pop-Location }
} finally {
    $env:ASPNETCORE_ENVIRONMENT = $previousEnvironment
    Pop-Location
}
Write-Host 'Setup complete. Run scripts/start.ps1 -Target Api and scripts/start.ps1 -Target Frontend in separate terminals.'

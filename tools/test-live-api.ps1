param([string]$PostgresBin = 'C:\Program Files\PostgreSQL\17\bin', [string]$Maven = '', [string]$MavenRepository = '')
$ErrorActionPreference = 'Stop'
$frontendRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$backendRoot = [IO.Path]::GetFullPath((Join-Path $frontendRoot '../../Backend/tracecore'))
$testRoot = Join-Path $backendRoot ('target/frontend-smoke/' + [Guid]::NewGuid().ToString('N'))
$clusterPath = Join-Path $testRoot 'data'
New-Item -ItemType Directory -Force -Path $testRoot | Out-Null
function Get-TestPort { $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0); $listener.Start(); $port = $listener.LocalEndpoint.Port; $listener.Stop(); return $port }
function Invoke-PgControl([string[]]$ControlArguments, [string]$Operation) {
    $control = Start-Process -FilePath (Join-Path $PostgresBin 'pg_ctl.exe') -ArgumentList $ControlArguments -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $testRoot ($Operation + '.out.log')) -RedirectStandardError (Join-Path $testRoot ($Operation + '.err.log'))
    if (-not $control.WaitForExit(35000) -or $control.ExitCode -ne 0) { throw ('PostgreSQL control failed: ' + $Operation) }
}
$dbPort = Get-TestPort; $apiPort = Get-TestPort; $frontPort = Get-TestPort
$variables = @('SPRING_PROFILES_ACTIVE','TRACECORE_DB_URL','TRACECORE_DB_USERNAME','TRACECORE_DB_PASSWORD','TRACECORE_AUTH_SECRET_BASE64','TRACECORE_BOOTSTRAP_ENABLED','TRACECORE_COMPANY_LEGAL_NAME','TRACECORE_COMPANY_NAME','TRACECORE_ADMIN_NAME','TRACECORE_ADMIN_EMAIL','TRACECORE_ADMIN_PASSWORD','TRACECORE_E2E_PROXY','TRACECORE_E2E_ISOLATED','TRACECORE_E2E_FRONT_PORT','TRACECORE_E2E_FRONT_URL','TRACECORE_EVIDENCE_ROOT','TRACECORE_E2E_RECOVERY_FILE','TRACECORE_E2E_COMMERCE_RECOVERY_FILE','TRACECORE_E2E_LOGISTICS_RECOVERY_FILE','TRACECORE_E2E_FINANCE_RECOVERY_FILE','TRACECORE_E2E_RECOVERY','TRACECORE_CORS_ORIGINS','TRACECORE_E2E_API_URL')
$previous = @{}; foreach ($key in $variables) { $previous[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
$started = $false; $backend = $null
try {
    Push-Location $backendRoot
    try { $mavenArguments = @('-B', '-DskipTests', 'package'); if ($MavenRepository) { $mavenArguments += ('-Dmaven.repo.local=' + $MavenRepository) }; if ($Maven) { & $Maven @mavenArguments } else { & '.\mvnw.cmd' @mavenArguments }; if ($LASTEXITCODE -ne 0) { throw 'Backend package failed.' } } finally { Pop-Location }
    & (Join-Path $PostgresBin 'initdb.exe') -D $clusterPath -U postgres '--auth-local=trust' '--auth-host=trust' '--encoding=UTF8' '--no-locale' *> (Join-Path $testRoot 'initdb.log')
    if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL initialization failed.' }
    Invoke-PgControl @('-D', ('"' + $clusterPath + '"'), '-l', ('"' + (Join-Path $testRoot 'postgres.log') + '"'), '-o', ('"-h 127.0.0.1 -p ' + $dbPort + '"'), '-w', '-t', '30', 'start') 'start'; $started = $true
    $env:SPRING_PROFILES_ACTIVE = 'postgres'; $env:TRACECORE_DB_URL = 'jdbc:postgresql://127.0.0.1:' + $dbPort + '/postgres'; $env:TRACECORE_DB_USERNAME = 'postgres'; $env:TRACECORE_DB_PASSWORD = 'isolated-test'
    $env:TRACECORE_EVIDENCE_ROOT = Join-Path $testRoot 'party-evidence'
    $env:TRACECORE_CORS_ORIGINS = 'http://127.0.0.1:' + $frontPort; $env:TRACECORE_E2E_API_URL = 'http://127.0.0.1:' + $apiPort
    $env:TRACECORE_E2E_LOGISTICS_RECOVERY_FILE = Join-Path $testRoot 'logistics-recovery.json'
    $env:TRACECORE_E2E_FINANCE_RECOVERY_FILE = Join-Path $testRoot 'finance-recovery.json'
    $env:TRACECORE_E2E_COMMERCE_RECOVERY_FILE = Join-Path $testRoot 'commerce-recovery.json'
    $env:TRACECORE_E2E_RECOVERY_FILE = Join-Path $testRoot 'quality-recovery.json'; $env:TRACECORE_E2E_RECOVERY = 'false'
    $random = New-Object byte[] 32; $rng = [Security.Cryptography.RandomNumberGenerator]::Create(); $rng.GetBytes($random); $rng.Dispose(); $env:TRACECORE_AUTH_SECRET_BASE64 = [Convert]::ToBase64String($random)
    $env:TRACECORE_BOOTSTRAP_ENABLED = 'true'; $env:TRACECORE_COMPANY_LEGAL_NAME = 'TraceCore Isolated Test'; $env:TRACECORE_COMPANY_NAME = 'TraceCore Isolated'; $env:TRACECORE_ADMIN_NAME = 'Admin Prueba'; $env:TRACECORE_ADMIN_EMAIL = 'admin@example.test'; $env:TRACECORE_ADMIN_PASSWORD = 'IsolatedAdmin123!'
    $jar = Join-Path $backendRoot 'target/alpha-0.0.1-SNAPSHOT.jar'
    $backend = Start-Process -FilePath 'java' -ArgumentList @('-jar', ('"' + $jar + '"'), ('--server.port=' + $apiPort), '--server.address=127.0.0.1') -WorkingDirectory $backendRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $testRoot 'backend.log') -RedirectStandardError (Join-Path $testRoot 'backend.err.log')
    $ready = $false; $deadline = [DateTime]::UtcNow.AddSeconds(60)
    while ([DateTime]::UtcNow -lt $deadline -and -not $backend.HasExited) {
        try { Invoke-WebRequest ('http://127.0.0.1:' + $apiPort + '/api/v1/auth/context') -UseBasicParsing -TimeoutSec 2 | Out-Null } catch { if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 401) { $ready = $true; break } }
        Start-Sleep -Milliseconds 500
    }
    if (-not $ready) { throw ('Backend did not become ready. See ' + $testRoot) }
    $proxy = Join-Path $testRoot 'proxy.json'; @{ '/api/**' = @{ target = ('http://127.0.0.1:' + $apiPort); secure = $false; changeOrigin = $false } } | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $proxy -Encoding UTF8
    $env:TRACECORE_E2E_PROXY = $proxy; $env:TRACECORE_E2E_ISOLATED = 'true'; $env:TRACECORE_E2E_FRONT_PORT = [string]$frontPort; $env:TRACECORE_E2E_FRONT_URL = 'http://127.0.0.1:' + $frontPort
    Push-Location $frontendRoot
    try { & node node_modules/@playwright/test/cli.js test --config playwright.live.config.ts; if ($LASTEXITCODE -ne 0) { throw 'Live frontend/API test failed.' } } finally { Pop-Location }
    # Keep the disposable database/files; replace the complete API process to prove persistence.
    $backend.Kill(); $backend.WaitForExit(10000) | Out-Null
    $env:TRACECORE_BOOTSTRAP_ENABLED = "false"
    $backend = Start-Process -FilePath 'java' -ArgumentList @('-jar', ('"' + $jar + '"'), ('--server.port=' + $apiPort), '--server.address=127.0.0.1') -WorkingDirectory $backendRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $testRoot 'backend-restarted.log') -RedirectStandardError (Join-Path $testRoot 'backend-restarted.err.log')
    $ready = $false; $deadline = [DateTime]::UtcNow.AddSeconds(60)
    while ([DateTime]::UtcNow -lt $deadline -and -not $backend.HasExited) {
        try { Invoke-WebRequest ('http://127.0.0.1:' + $apiPort + '/api/v1/auth/context') -UseBasicParsing -TimeoutSec 2 | Out-Null } catch { if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 401) { $ready = $true; break } }
        Start-Sleep -Milliseconds 500
    }
    if (-not $ready) { throw ('Restarted backend did not become ready. See ' + $testRoot) }
    $env:TRACECORE_E2E_RECOVERY = 'true'
    Push-Location $frontendRoot
    try { & node node_modules/@playwright/test/cli.js test --config playwright.live.config.ts; if ($LASTEXITCODE -ne 0) { throw 'Quality/commercial persistence after restart failed.' } } finally { Pop-Location }
} finally {
    if ($backend -and -not $backend.HasExited) { $backend.Kill(); $backend.WaitForExit(10000) | Out-Null }
    if ($started) { Invoke-PgControl @('-D', ('"' + $clusterPath + '"'), '-m', 'fast', '-w', '-t', '30', 'stop') 'stop' }
    foreach ($key in $variables) { [Environment]::SetEnvironmentVariable($key, $previous[$key], 'Process') }
}

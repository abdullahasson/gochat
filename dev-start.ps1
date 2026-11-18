# GoChat - local development launcher (Windows)
# Starts the portable MySQL 8 instance if needed, then runs the app with dev settings.

$ErrorActionPreference = 'Stop'

$MySqlBase = 'C:\Users\hp\gochat-mysql\mysql-8.0.44-winx64'
$MySqlExe  = Join-Path $MySqlBase 'bin\mysqld.exe'

# Start MySQL only if nothing is listening on 3306
$listening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
             Where-Object { $_.LocalPort -eq 3306 }
if (-not $listening) {
    Write-Host 'Starting local MySQL on 127.0.0.1:3306 ...'
    Start-Process -FilePath $MySqlExe -ArgumentList @(
        "--basedir=$MySqlBase",
        "--datadir=$MySqlBase\data",
        '--port=3306',
        '--bind-address=127.0.0.1',
        '--console'
    ) -WindowStyle Hidden `
      -RedirectStandardOutput (Join-Path $MySqlBase 'mysql.out.log') `
      -RedirectStandardError  (Join-Path $MySqlBase 'mysql.err.log')
    Start-Sleep -Seconds 6
}

$env:GOCHAT_PORT    = '3443'
$env:GOCHAT_DB_HOST = '127.0.0.1'
$env:GOCHAT_DB_USER = 'gochat'
$env:GOCHAT_DB_PASS = 'gochat'
$env:GOCHAT_DB_NAME = 'gochat'
$env:GOCHAT_DB_PORT = '3306'

Set-Location -Path $PSScriptRoot
Write-Host ''
Write-Host 'GoChat dev server: https://localhost:3443'
Write-Host '(accept the self-signed certificate warning in your browser)'
Write-Host 'Editing public/*.js, *.css or server.js auto-reloads / auto-restarts.'
Write-Host ''

node --watch server.js

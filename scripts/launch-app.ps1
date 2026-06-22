param(
  [Parameter(Mandatory = $true)]
  [string]$StandaloneDir,

  [Parameter(Mandatory = $true)]
  [string]$AppLog,

  [Parameter(Mandatory = $true)]
  [string]$Port
)

$ErrorActionPreference = 'Stop'

$serverJs = Join-Path $StandaloneDir 'server.js'
if (-not (Test-Path -LiteralPath $serverJs)) {
  throw "server.js was not found at $serverJs"
}

$command = @(
  "cd /d `"$StandaloneDir`"",
  "set PORT=$Port",
  "node server.js >> `"$AppLog`" 2>&1"
) -join ' && '

Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', $command) -WindowStyle Hidden | Out-Null

param(
  [Parameter(Mandatory = $true)]
  [string]$NgrokExe,

  [Parameter(Mandatory = $true)]
  [string]$TargetUrl,

  [Parameter(Mandatory = $true)]
  [string]$UrlLog,

  [Parameter(Mandatory = $true)]
  [string]$OutLog,

  [Parameter(Mandatory = $true)]
  [string]$ErrLog,

  [Parameter(Mandatory = $false)]
  [string]$StatusLog
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $NgrokExe)) {
  throw "ngrok.exe was not found at $NgrokExe"
}

function Write-Status {
  param([string]$Message)
  if ($StatusLog) {
    Add-Content -LiteralPath $StatusLog -Value ('[{0}] {1}' -f (Get-Date), $Message)
  }
}

$outDir = Split-Path -Parent $OutLog
$errDir = Split-Path -Parent $ErrLog
if ($outDir) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }
if ($errDir) { New-Item -ItemType Directory -Force -Path $errDir | Out-Null }

$args = @('http', $TargetUrl, '--log=stdout', '--log-level=debug', '--log-format=logfmt')
Write-Status "Starting ngrok process for $TargetUrl"
$process = Start-Process -FilePath $NgrokExe -ArgumentList $args -WindowStyle Hidden -RedirectStandardOutput $OutLog -RedirectStandardError $ErrLog -PassThru

$deadline = (Get-Date).AddSeconds(60)
$publicUrl = $null

while ((Get-Date) -lt $deadline) {
  if ($process.HasExited) {
    Write-Status "ngrok exited before publishing a URL"
    throw "ngrok exited before publishing a URL. ExitCode=$($process.ExitCode)"
  }
  try {
    $response = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 2
    $tunnels = @($response.tunnels)
    $publicUrl = $tunnels | Where-Object { $_.public_url } | Select-Object -First 1 -ExpandProperty public_url
    if ($publicUrl) {
      break
    }
  } catch {
    Write-Status 'Waiting for ngrok inspector on 4040'
    Start-Sleep -Seconds 1
    continue
  }

  Start-Sleep -Seconds 1
}

if (-not $publicUrl) {
  if (-not $process.HasExited) {
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  }
  Write-Status 'ngrok URL not available yet'
  throw 'ngrok URL not available yet.'
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $UrlLog) | Out-Null
$entry = '{0} {1}' -f (Get-Date).ToString('yyyy-MM-dd HH:mm:ss'), $publicUrl
Set-Content -LiteralPath $UrlLog -Value $entry
Write-Status "ngrok published $publicUrl"
Write-Host ''
Write-Host "NGROK URL READY: $publicUrl"
Write-Host ''
Set-Clipboard -Value $publicUrl
Start-Process $TargetUrl
Start-Process $publicUrl
Write-Host "Current ngrok URL: $publicUrl"
Write-Host 'Copied ngrok URL to clipboard.'

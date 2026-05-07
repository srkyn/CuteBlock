$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$package = Get-Content (Join-Path $root "package.json") | ConvertFrom-Json
$dist = Join-Path $root "dist"
$staging = Join-Path $dist "CuteBlock"
$zip = Join-Path $dist ("CuteBlock-{0}.zip" -f $package.version)

if (Test-Path $staging) { Remove-Item -LiteralPath $staging -Recurse -Force }
New-Item -ItemType Directory -Force -Path $staging | Out-Null

$files = @(
  "manifest.json",
  "content.css",
  "content.js",
  "popup.css",
  "popup.html",
  "popup.js",
  "PRIVACY.md",
  "THIRD_PARTY_NOTICES.md"
)

foreach ($file in $files) {
  Copy-Item -LiteralPath (Join-Path $root $file) -Destination (Join-Path $staging $file)
}

foreach ($dir in "assets", "filters") {
  Copy-Item -LiteralPath (Join-Path $root $dir) -Destination (Join-Path $staging $dir) -Recurse
}

if (Test-Path $zip) { Remove-Item -LiteralPath $zip -Force }
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zip -Force
Write-Host "Packaged $zip"

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$assetRoot = Join-Path $projectRoot 'dist'
$manifest = Get-Content (Join-Path $PSScriptRoot 'dependencies.json') -Raw | ConvertFrom-Json
foreach ($asset in $manifest) {
 $assetPath = Join-Path (Join-Path $assetRoot 'vendor') $asset.path
 if (!(Test-Path -LiteralPath $assetPath)) { throw 'Missing dependencies. Run npm run setup first.' }
 if ((Get-FileHash -LiteralPath $assetPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $asset.sha256) { throw "Checksum mismatch: $($asset.path)" }
}
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (!(Test-Path -LiteralPath $compiler)) { $compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
if (!(Test-Path -LiteralPath $compiler)) { throw 'Windows .NET Framework C# compiler not found.' }
$buildRoot = Join-Path $projectRoot 'build'
New-Item -ItemType Directory -Force $buildRoot | Out-Null
$compilerArgs = @('/nologo','/target:winexe','/platform:anycpu','/optimize+',('/out:'+(Join-Path $buildRoot 'Mia.exe')),'/reference:System.Windows.Forms.dll','/reference:System.Drawing.dll')
Get-ChildItem -LiteralPath $assetRoot -File -Recurse | ForEach-Object {
 $resource = $_.FullName.Substring($assetRoot.Length + 1).Replace('\','/')
 $compilerArgs += ('/resource:' + $_.FullName + ',' + $resource)
}
$compilerArgs += (Join-Path $projectRoot 'src/MiaLauncher.cs')
& $compiler @compilerArgs
if ($LASTEXITCODE -ne 0) { throw 'Compilation failed.' }
Write-Output (Join-Path $buildRoot 'Mia.exe')

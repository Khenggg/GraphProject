[CmdletBinding()]
param(
  [string]$RootPath = '',
  [string]$SourcePath = 'src',
  [string]$OutputPath = 'project-map.md',
  [string]$IgnorePath = 'projectmapignore'
)

if ([string]::IsNullOrWhiteSpace($RootPath)) {
  $RootPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..'
}

$root = (Resolve-Path -LiteralPath $RootPath).Path
$sourceRoot = (Resolve-Path -LiteralPath (Join-Path $root $SourcePath)).Path
$outputFullPath = [System.IO.Path]::GetFullPath((Join-Path $root $OutputPath))
$ignoreFullPath = [System.IO.Path]::GetFullPath((Join-Path $root $IgnorePath))

function Get-RelativeProjectPath {
  param([string]$FullPath)

  $relative = $FullPath.Substring($root.Length).TrimStart([char[]]('/\'))
  return $relative.Replace('\', '/')
}

function Read-IgnorePatterns {
  if (-not (Test-Path -LiteralPath $ignoreFullPath)) {
    return @()
  }

  return @(
    Get-Content -LiteralPath $ignoreFullPath -Encoding UTF8 |
      ForEach-Object { $_.Trim() } |
      Where-Object { $_ -and -not $_.StartsWith('#') } |
      ForEach-Object { $_.Replace('\', '/').TrimStart('./') }
  )
}

function Test-ProjectMapIgnored {
  param(
    [string]$RelativePath,
    [string[]]$Patterns
  )

  $normalized = $RelativePath.Replace('\', '/')
  $fileName = [System.IO.Path]::GetFileName($normalized)

  foreach ($pattern in $Patterns) {
    if ($pattern.EndsWith('/')) {
      $directoryPrefix = $pattern.TrimEnd('/')
      if ($normalized -eq $directoryPrefix -or $normalized.StartsWith($directoryPrefix + '/')) {
        return $true
      }
    } elseif ($normalized -like $pattern -or $fileName -like $pattern) {
      return $true
    }
  }

  return $false
}

function Get-MarkdownLanguage {
  param([string]$Path)

  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    '.ts' { return 'typescript' }
    '.tsx' { return 'tsx' }
    '.js' { return 'javascript' }
    '.jsx' { return 'jsx' }
    '.css' { return 'css' }
    '.scss' { return 'scss' }
    '.html' { return 'html' }
    '.json' { return 'json' }
    default { return 'text' }
  }
}

$patterns = Read-IgnorePatterns
$sourceExtensions = @('.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.html', '.json')
$files = @(
  Get-ChildItem -LiteralPath $sourceRoot -Recurse -File |
    ForEach-Object {
      $relativePath = Get-RelativeProjectPath $_.FullName
      if ($sourceExtensions -contains $_.Extension.ToLowerInvariant() -and -not (Test-ProjectMapIgnored $relativePath $patterns)) {
        [PSCustomObject]@{
          File = $_
          RelativePath = $relativePath
        }
      }
    } |
    Sort-Object RelativePath
)

$builder = [System.Text.StringBuilder]::new()
[void]$builder.AppendLine('# Project Map')
[void]$builder.AppendLine()
[void]$builder.AppendLine(('> Generated: {0}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')))
[void]$builder.AppendLine('> Generator: `scripts/export-project-map.ps1`')
[void]$builder.AppendLine()
[void]$builder.AppendLine('This file contains the project architecture and a direct source-code snapshot. The snapshot is generated from the source tree and filtered by `projectmapignore`.')
[void]$builder.AppendLine()
[void]$builder.AppendLine('## Architecture')
[void]$builder.AppendLine()
[void]$builder.AppendLine('- Runtime: React + TypeScript + Vite, client-only.')
[void]$builder.AppendLine('- State: Zustand in `src/store/featureTreeStore.ts`.')
[void]$builder.AppendLine('- Local persistence: Dexie/IndexedDB in `src/db/dexieDb.ts`.')
[void]$builder.AppendLine('- Domain logic: types, tree reconstruction, inheritance/readiness and Markdown export under `src/domain/`.')
[void]$builder.AppendLine('- UI: layout, sidebar, tree and detail editors under `src/components/`.')
[void]$builder.AppendLine('- Seed data: `src/seed/parkingBuildingSeed.ts`.')
[void]$builder.AppendLine(('- Included source files: {0}.' -f $files.Count))
[void]$builder.AppendLine()
[void]$builder.AppendLine('```text')
[void]$builder.AppendLine('src/main.tsx -> src/App.tsx')
[void]$builder.AppendLine('  -> components/layout/LeftSidebar.tsx')
[void]$builder.AppendLine('  -> components/tree/TreeToolbar.tsx')
[void]$builder.AppendLine('  -> components/tree/FeatureTree.tsx')
[void]$builder.AppendLine('  -> components/layout/RightDetailPanel.tsx')
[void]$builder.AppendLine('  -> store/featureTreeStore.ts -> db/dexieDb.ts -> IndexedDB')
[void]$builder.AppendLine('```')
[void]$builder.AppendLine()
[void]$builder.AppendLine('## Code File Index')
[void]$builder.AppendLine()
[void]$builder.AppendLine('| File | Bytes |')
[void]$builder.AppendLine('| --- | ---: |')
foreach ($entry in $files) {
  [void]$builder.AppendLine(('| `{0}` | {1} |' -f $entry.RelativePath, $entry.File.Length))
}
[void]$builder.AppendLine()
[void]$builder.AppendLine('## Direct Source Code')

foreach ($entry in $files) {
  $content = [System.IO.File]::ReadAllText($entry.File.FullName)
  $language = Get-MarkdownLanguage $entry.RelativePath
  [void]$builder.AppendLine()
  [void]$builder.AppendLine(('### `{0}`' -f $entry.RelativePath))
  [void]$builder.AppendLine()
  [void]$builder.AppendLine(('`````{0}' -f $language))
  [void]$builder.Append($content.TrimEnd([char]13, [char]10))
  [void]$builder.AppendLine()
  [void]$builder.AppendLine('`````')
}

[void]$builder.AppendLine()
[void]$builder.AppendLine('## Ignore Rules')
[void]$builder.AppendLine()
[void]$builder.AppendLine('See `projectmapignore` for excluded dependencies, generated output, assets and configuration files.')

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outputFullPath, $builder.ToString(), $utf8NoBom)
Write-Output ('Exported {0} source files to {1}' -f $files.Count, $outputFullPath)

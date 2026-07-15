[CmdletBinding()]
param(
  [string]$RootPath = '',
  [string]$OutputPath = 'ai-context'
)

if ([string]::IsNullOrWhiteSpace($RootPath)) {
  $RootPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..'
}

$root = (Resolve-Path -LiteralPath $RootPath).Path
$outputDirectory = [System.IO.Path]::GetFullPath((Join-Path $root $OutputPath))

New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

$schemaSource = Join-Path $root 'src/domain/featureNode.types.ts'
$factorySource = Join-Path $root 'src/domain/featureNodeFactory.ts'
$seedSource = Join-Path $root 'src/seed/parkingBuildingSeed.ts'
$migrationSource = Join-Path $root 'src/seed/parkingTaxonomyMigration.ts'

foreach ($sourcePath in @($schemaSource, $factorySource, $seedSource, $migrationSource)) {
  if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
    throw "Source file not found: $sourcePath"
  }
}

Copy-Item -LiteralPath $schemaSource -Destination (Join-Path $outputDirectory 'schema.ts') -Force

$seedLines = @(Get-Content -LiteralPath $seedSource -Encoding UTF8)
$seedBody = ($seedLines | Select-Object -Skip 3) -join [Environment]::NewLine
$factoryLines = @(Get-Content -LiteralPath $factorySource -Encoding UTF8)
$factoryBody = ($factoryLines | Select-Object -Skip 1) -join [Environment]::NewLine
$migrationBody = Get-Content -LiteralPath $migrationSource -Raw -Encoding UTF8
$migrationBody = [regex]::Replace(
  $migrationBody,
  '(?s)^import type \{.*?\} from "\.\./domain/featureNode\.types";\r?\n\r?\n',
  ''
)

$sampleData = @"
// Generated AI context. This file is self-contained when paired with schema.ts.
import type { ClientType, FeatureNode, FeatureNodeType, TestCase, DoneCriterion, ContractField } from "./schema";

// ===== src/domain/featureNodeFactory.ts =====
$factoryBody

// ===== src/seed/parkingTaxonomyMigration.ts =====
$migrationBody

// ===== src/seed/parkingBuildingSeed.ts =====
$seedBody
"@

Set-Content -LiteralPath (Join-Path $outputDirectory 'sample-data.ts') -Value $sampleData -Encoding UTF8

Write-Output ('Exported schema and sample data to {0}' -f $outputDirectory)

[CmdletBinding()]
param(
  [string]$ArticleId,
  [string]$ArticleTitle,
  [string]$LeadLabel,
  [switch]$Preview
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$siteRoot = Split-Path -Parent $PSScriptRoot
$templatePath = Join-Path $siteRoot 'templates\review-article\article.html'
$reviewsPath = Join-Path $siteRoot 'reviews'
$reviewAssetsPath = Join-Path $siteRoot 'assets\reviews'

function Read-Value {
  param(
    [string]$Prompt,
    [string]$Default = ''
  )

  $suffix = if ($Default) { " [$Default]" } else { '' }
  $value = Read-Host "$Prompt$suffix"
  if ([string]::IsNullOrWhiteSpace($value)) {
    return $Default
  }
  return $value.Trim()
}

if (-not (Test-Path -LiteralPath $templatePath)) {
  throw "テンプレートが見つかりません: $templatePath"
}

if ([string]::IsNullOrWhiteSpace($ArticleId)) {
  $ArticleId = Read-Value '記事IDを入力してください（例: 03-作品名）'
}
$ArticleId = $ArticleId.Trim()

if ([string]::IsNullOrWhiteSpace($ArticleId)) {
  throw '記事IDが空です。作成を中止しました。'
}
if ($ArticleId -match '[\\/:*?"<>|]' -or $ArticleId -match '\.\.') {
  throw '記事IDには、\\ / : * ? " < > | や .. は使えません。'
}

$defaultTitle = $ArticleId -replace '^\d+[-_ ]*', ''
if ([string]::IsNullOrWhiteSpace($ArticleTitle)) {
  $ArticleTitle = Read-Value '記事タイトルを入力してください' $defaultTitle
}
if ([string]::IsNullOrWhiteSpace($ArticleTitle)) {
  throw '記事タイトルが空です。作成を中止しました。'
}

if ($null -eq $LeadLabel) {
  $LeadLabel = Read-Value '導入ラベルを入力してください（後からHTMLで変更できます）' '言語化ヘタクソ派'
}

$articlePath = Join-Path $reviewsPath ($ArticleId + '.html')
$articleAssetsPath = Join-Path $reviewAssetsPath $ArticleId

if ((Test-Path -LiteralPath $articlePath) -or (Test-Path -LiteralPath $articleAssetsPath)) {
  throw "同じ記事IDのファイルまたは素材フォルダが既にあります。上書きはしません: $ArticleId"
}

if ($Preview) {
  Write-Host "作成確認: $articlePath"
  Write-Host "素材フォルダ: $articleAssetsPath"
  return
}

$sideTitle = if ($LeadLabel) { "$LeadLabel　　　$ArticleTitle" } else { $ArticleTitle }
$template = [System.IO.File]::ReadAllText($templatePath)
$replacements = [ordered]@{
  '{{ARTICLE_ID}}' = $ArticleId
  '{{ARTICLE_TITLE}}' = $ArticleTitle
  '{{LEAD_LABEL}}' = $LeadLabel
  '{{SIDE_TITLE_LEFT}}' = ''
  '{{SIDE_TITLE_RIGHT}}' = $sideTitle
  '{{POSTER_IMAGE}}' = 'poster.jpg'
  '{{CHARACTER_1_IMAGE}}' = 'tenmen/tachie-1.png'
  '{{CHARACTER_1_NAME}}' = 'テンメンちゃん'
  '{{CHARACTER_1_INTRO}}' = 'プロフィール文をここへ入力します。'
  '{{CHARACTER_2_IMAGE}}' = 'yamamoto/tachie-1.png'
  '{{CHARACTER_2_NAME}}' = '山本ディレッタント'
  '{{CHARACTER_2_INTRO}}' = 'プロフィール文をここへ入力します。'
  '{{PROFILE_HEADING}}' = '天下無双のれびゅあ～ず'
  '{{PROFILE_1_IMAGE}}' = 'テンメンアイコン.png'
  '{{PROFILE_1_NAME}}' = 'テンメンちゃん'
  '{{PROFILE_2_IMAGE}}' = '山本アイコン.png'
  '{{PROFILE_2_NAME}}' = '山本ディレッタント'
}

foreach ($replacement in $replacements.GetEnumerator()) {
  $template = $template.Replace($replacement.Key, $replacement.Value)
}

New-Item -ItemType Directory -Force -Path $articleAssetsPath | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $articleAssetsPath 'poster'), (Join-Path $articleAssetsPath 'photos'), (Join-Path $articleAssetsPath 'bg') | Out-Null
[System.IO.File]::WriteAllText($articlePath, $template, [System.Text.UTF8Encoding]::new($false))

Write-Host ''
Write-Host '新しいレビュー記事を作成しました。' -ForegroundColor Green
Write-Host "HTML:   $articlePath"
Write-Host "素材:   $articleAssetsPath"
Write-Host 'poster、photos、bg フォルダへ作品固有の素材を入れてください。'
Write-Host 'reviews/index.html への一覧リンクは、記事ができてから追加します。'

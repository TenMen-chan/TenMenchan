$ErrorActionPreference = 'Stop'

$siteRoot = $PSScriptRoot
$imageDirectory = Join-Path $siteRoot 'assets\pages\home\bg'
$indexPath = Join-Path $siteRoot 'index.html'
$supportedExtensions = @('.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif')

try {
    if (-not (Test-Path -LiteralPath $imageDirectory -PathType Container)) {
        throw "Background image folder was not found: $imageDirectory"
    }
    if (-not (Test-Path -LiteralPath $indexPath -PathType Leaf)) {
        throw "index.html was not found: $indexPath"
    }

    $images = @(
        Get-ChildItem -LiteralPath $imageDirectory -File |
            Where-Object { $supportedExtensions -contains $_.Extension.ToLowerInvariant() } |
            Sort-Object Name
    )

    if ($images.Count -eq 0) {
        throw 'No supported background images were found.'
    }

    $photoLines = foreach ($image in $images) {
        $escapedName = $image.Name.Replace([string][char]39, ([string][char]92 + [char]39))
        "    'assets/pages/home/bg/$escapedName',"
    }

    $newBlock = @(
        '  // BG_PHOTOS_START (managed by update-background-list.ps1)'
        '  const PHOTOS = ['
        $photoLines
        '  ];'
        '  // BG_PHOTOS_END'
    ) -join "`r`n"

    $html = [System.IO.File]::ReadAllText($indexPath)
    $pattern = '(?s)  // BG_PHOTOS_START.*?  // BG_PHOTOS_END'
    $matches = [regex]::Matches($html, $pattern)
    if ($matches.Count -ne 1) {
        throw "Could not identify exactly one photo-list block. Found: $($matches.Count)"
    }

    $blockRegex = New-Object System.Text.RegularExpressions.Regex($pattern)
    $updatedHtml = $blockRegex.Replace($html, [System.Text.RegularExpressions.MatchEvaluator]{ param($match) $newBlock }, 1)
    $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($indexPath, $updatedHtml, $utf8WithoutBom)

    Write-Host "Background list updated. Images: $($images.Count)" -ForegroundColor Green
    Write-Host "Folder: $imageDirectory"
}
catch {
    Write-Host "Update failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

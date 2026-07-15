# Generates public/og-image.png (1200x630) — the social-share preview image.
# One-off asset generation, not wired into the build. Re-run manually if the
# brand colors or wordmark ever change.
Add-Type -AssemblyName System.Drawing

$width = 1200
$height = 630
$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Solid dark background
$bgColor = [System.Drawing.Color]::FromArgb(255, 17, 18, 20)
$g.Clear($bgColor)

# Radial glow using a PathGradientBrush (plain concentric circles band visibly)
$glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$glowPath.AddEllipse(-200, -250, 1600, 1400)
$glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
$glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(140, 232, 52, 42)
$glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 17, 18, 20))
$g.FillPath($glowBrush, $glowPath)

$glowPath2 = New-Object System.Drawing.Drawing2D.GraphicsPath
$glowPath2.AddEllipse(700, -100, 900, 900)
$glowBrush2 = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath2)
$glowBrush2.CenterColor = [System.Drawing.Color]::FromArgb(90, 27, 108, 235)
$glowBrush2.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 17, 18, 20))
$g.FillPath($glowBrush2, $glowPath2)

# Logo badge (rounded square with paw print, matching public/favicon.svg colors)
function New-RoundedRect($x, $y, $w, $h, $r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($x, $y, $r, $r, 180, 90)
  $path.AddArc($x + $w - $r, $y, $r, $r, 270, 90)
  $path.AddArc($x + $w - $r, $y + $h - $r, $r, $r, 0, 90)
  $path.AddArc($x, $y + $h - $r, $r, $r, 90, 90)
  $path.CloseFigure()
  return $path
}

$badgeSize = 110
$badgeX = 100
$badgeY = 210
$badgePath = New-RoundedRect $badgeX $badgeY $badgeSize $badgeSize 32
$badgeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 232, 52, 42))
$g.FillPath($badgeBrush, $badgePath)

$pawBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$cx = $badgeX + $badgeSize / 2
$cy = $badgeY + $badgeSize / 2
$g.FillEllipse($pawBrush, $cx - 24, $cy + 2, 48, 40)
$g.FillEllipse($pawBrush, $cx - 40, $cy - 30, 20, 26)
$g.FillEllipse($pawBrush, $cx + 20, $cy - 30, 20, 26)
$g.FillEllipse($pawBrush, $cx - 18, $cy - 42, 18, 24)
$g.FillEllipse($pawBrush, $cx + 0, $cy - 42, 18, 24)

# Wordmark
$wordFont = New-Object System.Drawing.Font("Segoe UI", 76, [System.Drawing.FontStyle]::Bold)
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.DrawString("KINDO", $wordFont, $whiteBrush, 240, 218)

# Tagline
$taglineFont = New-Object System.Drawing.Font("Segoe UI", 30, [System.Drawing.FontStyle]::Regular)
$mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 200, 200, 206))
$g.DrawString("Tout pour vos compagnons - Livraison 58 wilayas", $taglineFont, $mutedBrush, 100, 400)

# Color dots (brand palette)
$dotY = 470
$dotColors = @(
  [System.Drawing.Color]::FromArgb(255, 232, 52, 42),
  [System.Drawing.Color]::FromArgb(255, 27, 108, 235),
  [System.Drawing.Color]::FromArgb(255, 32, 158, 91),
  [System.Drawing.Color]::FromArgb(255, 255, 199, 41)
)
$dotX = 100
foreach ($color in $dotColors) {
  $brush = New-Object System.Drawing.SolidBrush($color)
  $g.FillEllipse($brush, $dotX, $dotY, 28, 28)
  $dotX += 44
  $brush.Dispose()
}

$outPath = Join-Path $PSScriptRoot "..\public\og-image.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
$badgeBrush.Dispose()
$pawBrush.Dispose()
$whiteBrush.Dispose()
$mutedBrush.Dispose()
$glowBrush.Dispose()
$glowBrush2.Dispose()

Write-Host "Wrote $outPath"

# Generates public/og-image.png (1200x630) — the social-share preview image
# (Open Graph / Twitter card). Composites the real brand logo (public/logo.png)
# on a bright, on-brand background that matches the storefront's playful look.
# One-off asset generation, not wired into the build. Re-run manually if the
# brand, tagline or domain ever change:
#   powershell -ExecutionPolicy Bypass -File scripts/gen-og-image.ps1
Add-Type -AssemblyName System.Drawing

$width = 1200
$height = 630
$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Brand palette (matches src design tokens)
$cream  = [System.Drawing.Color]::FromArgb(255, 255, 248, 239)
$ink    = [System.Drawing.Color]::FromArgb(255, 26, 27, 30)
$muted  = [System.Drawing.Color]::FromArgb(255, 110, 112, 120)
$red    = [System.Drawing.Color]::FromArgb(255, 232, 52, 42)
$blue   = [System.Drawing.Color]::FromArgb(255, 27, 108, 235)
$green  = [System.Drawing.Color]::FromArgb(255, 32, 158, 91)
$yellow = [System.Drawing.Color]::FromArgb(255, 255, 199, 41)

# --- Background: warm cream base ---
$g.Clear($cream)

# --- Soft colour blobs (radial glows), matching the hero "mesh" background ---
function Add-Glow($cx, $cy, $r, $color, $alpha) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddEllipse($cx - $r, $cy - $r, $r * 2, $r * 2)
  $brush = New-Object System.Drawing.Drawing2D.PathGradientBrush($path)
  $brush.CenterColor = [System.Drawing.Color]::FromArgb($alpha, $color.R, $color.G, $color.B)
  $brush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, $cream.R, $cream.G, $cream.B))
  $g.FillPath($brush, $path)
  $brush.Dispose(); $path.Dispose()
}
Add-Glow -80  -40  520 $red    70
Add-Glow 1260 60   480 $blue   60
Add-Glow 1180 680  520 $yellow 90
Add-Glow -60  700  460 $green  60

# --- Scattered paw prints for playful texture ---
function Add-Paw($x, $y, $s, $color, $alpha) {
  $b = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($alpha, $color.R, $color.G, $color.B))
  $g.FillEllipse($b, $x - 24 * $s, $y + 2 * $s, 48 * $s, 40 * $s)   # pad
  $g.FillEllipse($b, $x - 40 * $s, $y - 30 * $s, 20 * $s, 26 * $s)  # toes
  $g.FillEllipse($b, $x + 20 * $s, $y - 30 * $s, 20 * $s, 26 * $s)
  $g.FillEllipse($b, $x - 18 * $s, $y - 44 * $s, 18 * $s, 24 * $s)
  $g.FillEllipse($b, $x + 0  * $s, $y - 44 * $s, 18 * $s, 24 * $s)
  $b.Dispose()
}
Add-Paw 140  120 1.0 $red    26
Add-Paw 1070 150 0.8 $blue   26
Add-Paw 1010 500 1.1 $green  24
Add-Paw 190  520 0.9 $yellow 42
Add-Paw 600  90  0.6 $ink    12

# --- Real brand logo, centered near the top ---
$logoPath = Join-Path $PSScriptRoot "..\public\logo.png"
$logo = [System.Drawing.Image]::FromFile($logoPath)
$logoW = 470
$logoH = [int]($logoW * $logo.Height / $logo.Width)
$logoX = [int](($width - $logoW) / 2)
$logoY = 92
$g.DrawImage($logo, $logoX, $logoY, $logoW, $logoH)
$logo.Dispose()

# --- Centered text helper ---
$center = New-Object System.Drawing.StringFormat
$center.Alignment = [System.Drawing.StringAlignment]::Center
function Draw-Centered($text, $font, $brush, $y) {
  $rect = New-Object System.Drawing.RectangleF(0, $y, $width, 100)
  $g.DrawString($text, $font, $brush, $rect, $center)
}

# Tagline
$taglineFont = New-Object System.Drawing.Font("Segoe UI", 34, [System.Drawing.FontStyle]::Bold)
$inkBrush = New-Object System.Drawing.SolidBrush($ink)
Draw-Centered "Tout pour vos compagnons" $taglineFont $inkBrush 340

# Subtitle
$subFont = New-Object System.Drawing.Font("Segoe UI", 21, [System.Drawing.FontStyle]::Regular)
$mutedBrush = New-Object System.Drawing.SolidBrush($muted)
Draw-Centered "Chiens  -  Chats  -  Oiseaux  -  Poissons" $subFont $mutedBrush 402

# --- Trust pills (centered row) ---
function New-RoundedRect($x, $y, $w, $h, $r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($x, $y, $r, $r, 180, 90)
  $path.AddArc($x + $w - $r, $y, $r, $r, 270, 90)
  $path.AddArc($x + $w - $r, $y + $h - $r, $r, $r, 0, 90)
  $path.AddArc($x, $y + $h - $r, $r, $r, 90, 90)
  $path.CloseFigure()
  return $path
}

$pillFont = New-Object System.Drawing.Font("Segoe UI", 19, [System.Drawing.FontStyle]::Bold)
$pillH = 56
$padX = 30
$dot = 16
$gapDotText = 14
$gapPills = 22

# Build accented strings from code points so the output is unaffected by the
# script file's text encoding (PowerShell 5.1 can misread non-BOM UTF-8).
$a_grave = [char]0x00E0  # à
$pills = @(
  @{ Text = "Livraison 69 wilayas"; Color = $green },
  @{ Text = "Paiement $a_grave la livraison"; Color = $blue }
)

# Measure to compute total width, then center the group
$measured = @()
$totalW = 0
foreach ($p in $pills) {
  $tw = $g.MeasureString($p.Text, $pillFont).Width
  $pw = $padX + $dot + $gapDotText + $tw + $padX
  $measured += @{ Text = $p.Text; Color = $p.Color; W = $pw; TextW = $tw }
  $totalW += $pw
}
$totalW += $gapPills * ($pills.Count - 1)

$pillY = 470
$px = ($width - $totalW) / 2
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
foreach ($m in $measured) {
  $path = New-RoundedRect $px $pillY $m.W $pillH ($pillH)
  # white fill + coloured border
  $g.FillPath($whiteBrush, $path)
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, $m.Color.R, $m.Color.G, $m.Color.B), 2)
  $g.DrawPath($pen, $path)
  # dot
  $dotBrush = New-Object System.Drawing.SolidBrush($m.Color)
  $g.FillEllipse($dotBrush, $px + $padX, $pillY + ($pillH - $dot) / 2, $dot, $dot)
  # text
  $textBrush = New-Object System.Drawing.SolidBrush($ink)
  $tf = New-Object System.Drawing.StringFormat
  $tf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $textRect = New-Object System.Drawing.RectangleF(($px + $padX + $dot + $gapDotText), $pillY, ($m.TextW + 6), $pillH)
  $g.DrawString($m.Text, $pillFont, $textBrush, $textRect, $tf)
  $px += $m.W + $gapPills
  $pen.Dispose(); $dotBrush.Dispose(); $textBrush.Dispose(); $path.Dispose()
}

# --- Domain ---
$domainFont = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Bold)
$redBrush = New-Object System.Drawing.SolidBrush($red)
Draw-Centered "www.kindodz.com" $domainFont $redBrush 556

# --- Save ---
$outPath = Join-Path $PSScriptRoot "..\public\og-image.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose(); $bmp.Dispose()
$inkBrush.Dispose(); $mutedBrush.Dispose(); $whiteBrush.Dispose(); $redBrush.Dispose()
$taglineFont.Dispose(); $subFont.Dispose(); $pillFont.Dispose(); $domainFont.Dispose()

Write-Host "Wrote $outPath ($width x $height)"

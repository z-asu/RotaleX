param(
    [string]$Source,
    [string]$OutDir,
    [int]$Cols = 1,
    [int]$Rows = 1,
    [string]$Prefix,
    [string[]]$Names
)

Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Image]::FromFile($Source)
$cellW = [int][math]::Floor($img.Width / $Cols)
$cellH = [int][math]::Floor($img.Height / $Rows)

New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

$index = 0
for ($r = 0; $r -lt $Rows; $r++) {
    for ($c = 0; $c -lt $Cols; $c++) {
        if ($index -ge $Names.Count) { break }
        $name = $Names[$index]
        $bmp = New-Object System.Drawing.Bitmap($cellW, $cellH)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $srcRect = New-Object System.Drawing.Rectangle(($c * $cellW), ($r * $cellH), $cellW, $cellH)
        $dstRect = New-Object System.Drawing.Rectangle(0, 0, $cellW, $cellH)
        $g.DrawImage($img, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
        $out = Join-Path $OutDir "$Prefix-$name.png"
        $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
        $g.Dispose()
        $bmp.Dispose()
        Write-Output "Saved: $out"
        $index++
    }
}

$img.Dispose()
Write-Output "Done: $index icons"

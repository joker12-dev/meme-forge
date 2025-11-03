# Frontend'deki tüm localhost:3001 referanslarını getBackendURL() ile değiştir
$frontendPath = "C:\Users\Casper\Desktop\meme-token\frontend\src"
$files = Get-ChildItem -Path $frontendPath -Recurse -Include "*.js" -Exclude "*.test.js"

$count = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Eğer localhost:3001 varsa ve getBackendURL import edilmemişse, ekle
    if ($content -match 'http://localhost:3001' -and $content -notmatch 'getBackendURL') {
        # getBackendURL import'ını ekle (sadece ilk import kısmında değil, util'den al)
        if ($content -match "import.*from\s+['\"][\./]+.*utils" -or $content -match "import.*from\s+['\"][\./]+.*api") {
            # Zaten import var, skip et
        } else {
            # Eğer import kısmı varsa, getBackendURL import'ını ekle
            $content = $content -replace "(import\s+.*\s+from\s+['\"][\./]+utils/api['\"])", "`$1`nimport { getBackendURL } from '../utils/api';"
        }
    }
    
    # Tüm http://localhost:3001 referanslarını değiştir
    $newContent = $content -replace 'http://localhost:3001', '`${getBackendURL()}'
    
    if ($content -ne $newContent) {
        Set-Content $file.FullName -Value $newContent
        Write-Host "Updated: $($file.FullName)"
        $count++
    }
}

Write-Host "`nTotal files updated: $count"

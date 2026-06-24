Add-Type -AssemblyName System.IO.Compression.FileSystem

function Read-Docx {
    param([string]$path)
    $zip = [System.IO.Compression.ZipFile]::OpenRead((Convert-Path $path))
    $entry = $zip.GetEntry('word/document.xml')
    $stream = $entry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $xml = $reader.ReadToEnd()
    $reader.Close()
    $zip.Dispose()
    $text = $xml -replace '<[^>]+>', ' ' -replace '\s+', ' '
    return $text
}

$text1 = Read-Docx -path ".\Hotel_Booking_System_Dev_Doc_V2.docx"
$text2 = Read-Docx -path ".\Tai lieu He thong Quan ly Dat phong Khach san.docx"

$text1 | Out-File "doc1.txt" -Encoding utf8
$text2 | Out-File "doc2.txt" -Encoding utf8

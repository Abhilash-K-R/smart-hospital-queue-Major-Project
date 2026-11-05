$w = [System.Runtime.InteropServices.Marshal]::GetActiveObject('Word.Application')
foreach ($doc in $w.Documents) {
    Write-Output "Open doc: $($doc.FullName)"
}



try {
    Write-Output "Fetching claims..."
    $claims = Invoke-RestMethod -Uri 'http://localhost:3000/api/claims' -Method Get
    
    $sourceChain = $null
    if ($claims.Count -gt 0) {
        $sourceChain = $claims[0]
    } else {
        # Create a dummy payload if no claims exist
        $sourceChain = [PSCustomObject]@{
            holderName = "Test Holder"
            policyId = "POLICY-123"
            files = @()
            history = @()
            id = "DUMMY-100"
        }
    }

    $rnd = Get-Random
    $newId = "TEST-CLAIM-$rnd-REGRES"
    
    # Clone properly
    $regressClaim = $sourceChain | Select-Object *
    
    # Update ID
    if ($null -eq $regressClaim.id) {
         $regressClaim | Add-Member -MemberType NoteProperty -Name "id" -Value $newId
    } else {
         $regressClaim.id = $newId
    }

    # Update Type
    # Check if property exists by looking at PSObject.Properties
    if ($null -eq $regressClaim.PSObject.Properties['type']) {
        $regressClaim | Add-Member -MemberType NoteProperty -Name "type" -Value "Dosar Regres"
    } else {
        $regressClaim.type = "Dosar Regres"
    }

    # Update Status
    if ($null -eq $regressClaim.PSObject.Properties['status']) {
        $regressClaim | Add-Member -MemberType NoteProperty -Name "status" -Value "Deschis"
    } else {
        $regressClaim.status = "Deschis"
    }
    
    # Update SubmittedAt
    $now = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    if ($null -eq $regressClaim.PSObject.Properties['submittedAt']) {
         $regressClaim | Add-Member -MemberType NoteProperty -Name "submittedAt" -Value $now
    } else {
         $regressClaim.submittedAt = $now
    }
    
    # Convert to JSON
    $payload = $regressClaim | ConvertTo-Json -Depth 10
    
    Write-Output "Creating Regress Claim: $newId"
    # Write-Output "Payload: $payload"
    
    try {
        Invoke-RestMethod -Uri 'http://localhost:3000/api/claims' -Method Post -Body $payload -ContentType 'application/json'
    } catch {
        Write-Error "Failed to POST claim: $_"
        exit 1
    }
    
    Start-Sleep -Seconds 2
    
    Write-Output "Verifying..."
    $newClaims = Invoke-RestMethod -Uri 'http://localhost:3000/api/claims' -Method Get
    $found = $newClaims | Where-Object { $_.id -eq $newId }
    
    if ($found) {
        Write-Output "SUCCESS: Regress Claim Found"
        Write-Output "ID: $($found.id)"
        Write-Output "Type: $($found.type)"
        Write-Output "Status: $($found.status)"
    } else {
        Write-Error "FAILURE: Regress Claim Not Found in List"
        exit 1
    }
} catch {
    Write-Error "Unexpected Error: $($_.Exception.Message)"
    exit 1
}

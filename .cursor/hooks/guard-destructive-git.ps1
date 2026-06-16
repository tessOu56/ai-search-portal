# beforeShellExecution: block destructive git (ai-search-portal)
$raw = [Console]::In.ReadToEnd()
try { $input = $raw | ConvertFrom-Json } catch { $input = $null }
$cmd = if ($input.command) { [string]$input.command } else { '' }

if ($cmd -match 'git\s+push\b[^\n]*--force' -or $cmd -match 'git\s+reset\s+--hard') {
    @{
        permission    = 'deny'
        user_message  = 'Blocked: destructive git in ai-search-portal.'
        agent_message = 'Use safe git per user rules; no force push to main/master.'
    } | ConvertTo-Json -Compress
    exit 0
}

@{ permission = 'allow' } | ConvertTo-Json -Compress
exit 0

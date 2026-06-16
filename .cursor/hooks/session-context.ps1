# sessionStart: inject repo phase pointers (ai-search-portal)
$raw = [Console]::In.ReadToEnd()
# stdin consumed for hook contract; context is static pointers
$ctx = @'
ai-search-portal session context:
- Phase / exit criteria: docs/PROJECT-PLAN.md
- Agent playbook (skills, hooks, commands): docs/agent-collaboration.md
- Inbox tickets: docs/platform-inbox/CURRENT.md
- Skills: portal-phase-work | portal-contract-change | portal-lab-boundary
- Ecosystem orchestration belongs in platform-command, not this repo.
'@

@{ additional_context = $ctx.Trim() } | ConvertTo-Json -Compress
exit 0

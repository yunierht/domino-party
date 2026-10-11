# Review defaults to read-only. Apply/Restore require explicit user authorization and administrator rights.
param([ValidateSet('Review','Apply','Restore')][string]$Mode='Review')
$ErrorActionPreference='Stop'
$program=Join-Path (Split-Path $PSScriptRoot -Parent) 'backend\domino-online\node_modules\@cloudflare\workerd-windows-64\bin\workerd.exe'
$blockName='TCP Query User{90292FC3-8852-4EC0-AFB5-F52FB1F213F0}C:\users\yunie\.codex\worktrees\5486\dominos codex online\backend\domino-online\node_modules\@cloudflare\workerd-windows-64\bin\workerd.exe'
$allowName='NCS-DominoOnline-5486-LAN-TCP8792'
$snapshot=Join-Path (Split-Path $PSScriptRoot -Parent) '.release-audit\two-android\firewall-8792-before.json'
$rule=Get-NetFirewallRule -Name $blockName
$app=$rule|Get-NetFirewallApplicationFilter
$ports=$rule|Get-NetFirewallPortFilter
if($app.Program -ine $program -or $rule.Action.ToString() -ne 'Block' -or $rule.Direction.ToString() -ne 'Inbound' -or $rule.Profile.ToString() -ne 'Public' -or $ports.Protocol -ne 'TCP'){
 throw 'Firewall rule no longer matches the reviewed server. Abort and reassess.'
}
if($Mode -eq 'Review'){
 [pscustomobject]@{Program=$program;BlockedPorts=$ports.LocalPort;ProposedException='TCP 8792 only';AllowFrom='192.168.1.0/24';LocalAddress='192.168.1.194';Interface='Wi-Fi';Profile='Public';UdpChange=$false;FirewallChange=$false}|ConvertTo-Json
 exit
}
$principal=[Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
if(!$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'Administrator rights required for the authorized firewall change'}
if($Mode -eq 'Restore'){
 $before=Get-Content -LiteralPath $snapshot -Raw|ConvertFrom-Json
 if($before.Rule -ne $blockName -or $before.Program -ine $program){throw 'Snapshot does not match reviewed rule'}
 $existing=Get-NetFirewallRule -Name $allowName -ErrorAction SilentlyContinue
 if($existing){
  $allowedApp=$existing|Get-NetFirewallApplicationFilter
  if($allowedApp.Program -ine $program){throw 'Allow rule belongs to a different program'}
  $existing|Remove-NetFirewallRule
 }
 $rule|Set-NetFirewallRule -LocalPort @($before.LocalPort)
 Write-Output 'Restored original TCP block; UDP and other rules unchanged'
 exit
}
if(@($ports.LocalPort).Count -ne 1 -or $ports.LocalPort -ne 'Any'){throw 'Expected original Any-port block; do not overwrite a changed rule'}
if(Test-Path -LiteralPath $snapshot){throw 'Existing snapshot preserved; inspect before retry'}
if(Get-NetFirewallRule -Name $allowName -ErrorAction SilentlyContinue){throw 'Allow rule already exists; inspect before retry'}
[pscustomobject]@{Rule=$blockName;Program=$program;LocalPort=@($ports.LocalPort)}|ConvertTo-Json|Set-Content -LiteralPath $snapshot
try {
 # An explicit block overrides an allow. Keep every other TCP port blocked.
 $rule|Set-NetFirewallRule -LocalPort @('1-8791','8793-65535')
 New-NetFirewallRule -Name $allowName -DisplayName 'Domino Online test LAN TCP8792 only' -Program $program -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8792 -LocalAddress 192.168.1.194 -RemoteAddress 192.168.1.0/24 -InterfaceAlias 'Wi-Fi' -Profile Public | Out-Null
} catch {
 $rule|Set-NetFirewallRule -LocalPort 'Any'
 throw
}
Write-Output 'LAN exception applied: workerd TCP8792 from 192.168.1.0/24 on Wi-Fi only. Check /health from each phone.'

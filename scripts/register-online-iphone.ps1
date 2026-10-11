# Run in the user's interactive terminal. Never redirect this command to a transcript/log.
$ErrorActionPreference='Stop'
$workRoot=Split-Path $PSScriptRoot -Parent
$app=Get-Content (Join-Path $workRoot 'app.json') -Raw|ConvertFrom-Json
if($app.expo.extra.eas.projectId -ne '9d4cdf14-2853-4b0f-86f4-03108c445056' -or $app.expo.ios.bundleIdentifier -ne 'com.nextcodestudios.dominoonline.test'){
 throw 'Wrong Online project or iOS identity. Abort registration.'
}
$cli=Join-Path $workRoot '.release-audit\eas-cli-24.12.1\node_modules\eas-cli\bin\run'
if(!(Test-Path -LiteralPath $cli)){throw 'Isolated EAS CLI missing'}
$env:EXPO_PUBLIC_DOMINO_ONLINE_URL='http://192.168.1.194:8792'
$env:EXPO_PUBLIC_DOMINO_ONLINE_SCHEME='domino-online-test'
Push-Location -LiteralPath $workRoot
try {& node $cli device:create;if($LASTEXITCODE -ne 0){throw 'Registration not completed'}}
finally{Pop-Location}

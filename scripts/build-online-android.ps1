param(
  [Parameter(Mandatory=$true)][string]$Endpoint,
  [string]$BuildRoot='C:\do-5486',
  [ValidateSet('lan','internet')][string]$Mode='lan'
)
$ErrorActionPreference='Stop'
$resolvedBuild=(Resolve-Path -LiteralPath $BuildRoot).Path
$javaPath=Join-Path $resolvedBuild 'jdk17\jdk-17.0.20.1+1'
$sdkPath=Join-Path $resolvedBuild 'sdk'
foreach($required in @('app.json','plugins\withOnlineLan.js','node_modules\expo\bin\cli','android\gradlew.bat')){
 if(!(Test-Path -LiteralPath (Join-Path $resolvedBuild $required))){throw "Missing prepared build input: $required"}
}
if(!(Test-Path -LiteralPath (Join-Path $javaPath 'bin\java.exe'))){throw 'Missing isolated Java17'}
if(!(Test-Path -LiteralPath (Join-Path $sdkPath 'platforms\android-36'))){throw 'Missing Android SDK36'}
$env:JAVA_HOME=$javaPath
$env:ANDROID_HOME=$sdkPath
$env:ANDROID_SDK_ROOT=$sdkPath
$env:GRADLE_USER_HOME=Join-Path $resolvedBuild 'gradle-fresh'
$env:EXPO_PUBLIC_DOMINO_ONLINE_URL=$Endpoint
$env:EXPO_PUBLIC_POKER_ONLINE_URL=$Endpoint
$env:EXPO_PUBLIC_DOMINO_ONLINE_SCHEME='domino-online-test'
$env:EXPO_PUBLIC_ONLINE_MODE=$Mode
$env:ONLINE_BUILD_PLATFORM='android'
if($Mode -eq 'internet'){
 $env:EXPO_PUBLIC_ONLINE_ORIGIN=$Endpoint
 $env:EXPO_PUBLIC_DOMINO_ONLINE_INVITE_BASE=$Endpoint+'/online/invite'
 $env:EXPO_PUBLIC_POKER_ONLINE_INVITE_BASE=$Endpoint+'/online/invite'
 $env:DOMINO_ONLINE_LINKS_CONFIG='config/online-internet.json'
}else{
 Remove-Item Env:\EXPO_PUBLIC_ONLINE_ORIGIN -ErrorAction SilentlyContinue
 Remove-Item Env:\EXPO_PUBLIC_DOMINO_ONLINE_INVITE_BASE -ErrorAction SilentlyContinue
 Remove-Item Env:\EXPO_PUBLIC_POKER_ONLINE_INVITE_BASE -ErrorAction SilentlyContinue
 Remove-Item Env:\DOMINO_ONLINE_LINKS_CONFIG -ErrorAction SilentlyContinue
}
$env:EXPO_NO_TELEMETRY='1'
$env:CI='1'
Push-Location -LiteralPath $resolvedBuild
try {
 # The config plugin rejects public/credential-bearing endpoints before prebuild.
 & node node_modules/expo/bin/cli prebuild --platform android --no-install
 if($LASTEXITCODE -ne 0){throw 'Android prebuild failed'}
 [IO.File]::WriteAllText((Join-Path $resolvedBuild 'android\local.properties'),('sdk.dir='+$sdkPath.Replace('\','/')+"`n"))
 & android\gradlew.bat -p android assembleRelease --console=plain --no-daemon '-PreactNativeArchitectures=arm64-v8a,armeabi-v7a'
 if($LASTEXITCODE -ne 0){throw 'Local APK build failed'}
 Write-Output (Join-Path $resolvedBuild 'android\app\build\outputs\apk\release\app-release.apk')
}finally{Pop-Location}

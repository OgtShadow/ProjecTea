<#
.SYNOPSIS
  Import the server certificate into a local Java truststore and run JMeter (non-GUI).

.DESCRIPTION
  The script imports server/java/src/main/resources/certs/localhost.pem into a truststore
  at $env:USERPROFILE\.projecTea_truststore.jks (password: changeit) and then runs JMeter
  with that truststore configured for the Java process.
#>

param(
    [string]$CertPath = "server/java/src/main/resources/certs/localhost.pem",
    [string]$TrustStore = "$env:USERPROFILE\.projecTea_truststore.jks",
    [string]$TrustStorePass = "changeit",
    [string]$JMeterCmd = "jmeter",
    [string]$JmxFile = "server/jmeter/ProjecTea_test.jmx",
    [string]$ResultsFile = "server/jmeter/results.jtl",
    [string]$LogFile = "server/jmeter/jmeter.log",
    [string]$ReportDir = "server/jmeter/report",
    [string]$Protocol = "https",
    [int]$Port = 443
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Find-Keytool {
    if ($env:JAVA_HOME) {
        $javaHomeKeytool = Join-Path $env:JAVA_HOME 'bin\keytool.exe'
        if (Test-Path $javaHomeKeytool) {
            return $javaHomeKeytool
        }
    }

    $command = Get-Command keytool -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    return $null
}

function Ensure-EmptyDirectory {
    param(
        [Parameter(Mandatory = $true)][string]$Path
    )

    if (Test-Path $Path) {
        Get-ChildItem -LiteralPath $Path -Force | Remove-Item -Recurse -Force
        Remove-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
    }

    New-Item -ItemType Directory -Path $Path -Force | Out-Null
}

Write-Host "Repository root: $PWD"

$fullCert = Join-Path $PWD $CertPath
if (-not (Test-Path $fullCert)) {
    throw "Certificate not found: $fullCert. Run this from the repository root or pass -CertPath."
}

$keytool = Find-Keytool
if (-not $keytool) {
    throw "keytool not found. Install a JDK or set JAVA_HOME to a JDK installation."
}

Write-Host "Using keytool: $keytool"
Write-Host "Importing cert $fullCert into truststore $TrustStore"

$trustStoreDirectory = Split-Path $TrustStore -Parent
if (-not (Test-Path $trustStoreDirectory)) {
    New-Item -ItemType Directory -Path $trustStoreDirectory -Force | Out-Null
}

if (Test-Path $TrustStore) {
    Write-Host "Removing existing alias projecTea if present"
    & $keytool -delete -alias projecTea -keystore $TrustStore -storepass $TrustStorePass 2>$null
}

& $keytool -importcert -file $fullCert -alias projecTea -keystore $TrustStore -storepass $TrustStorePass -noprompt
if ($LASTEXITCODE -ne 0) {
    throw "keytool importcert failed with exit code $LASTEXITCODE"
}

Write-Host "Truststore contents:"
& $keytool -list -keystore $TrustStore -storepass $TrustStorePass

$previousJavaToolOptions = $env:JAVA_TOOL_OPTIONS
$env:JAVA_TOOL_OPTIONS = "-Djavax.net.ssl.trustStore=$TrustStore -Djavax.net.ssl.trustStorePassword=$TrustStorePass"

try {
    Ensure-EmptyDirectory -Path $ReportDir

    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $resultsDirectory = Split-Path $ResultsFile -Parent
    $logDirectory = Split-Path $LogFile -Parent
    $runResultsFile = Join-Path $resultsDirectory ("results-$timestamp.jtl")
    $runLogFile = Join-Path $logDirectory ("jmeter-$timestamp.log")

    $commandLine = "`"$JMeterCmd`" -n -t `"$JmxFile`" -Jprotocol=$Protocol -Jport=$Port -l `"$runResultsFile`" -j `"$runLogFile`" -e -o `"$ReportDir`""

    Write-Host "Running JMeter: $commandLine"
    & cmd.exe /c $commandLine
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        Write-Warning "JMeter exited with code $exitCode. See $LogFile for details."
    } else {
        Copy-Item -LiteralPath $runResultsFile -Destination $ResultsFile -Force
        Copy-Item -LiteralPath $runLogFile -Destination $LogFile -Force
        Write-Host "JMeter finished successfully. Report: $ReportDir/index.html"
    }
}
finally {
    if ($null -ne $previousJavaToolOptions) {
        $env:JAVA_TOOL_OPTIONS = $previousJavaToolOptions
    } else {
        Remove-Item Env:JAVA_TOOL_OPTIONS -ErrorAction SilentlyContinue
    }
}

Param()

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$rootDir = Join-Path $scriptDir '..'
$resourcesDir = Join-Path $rootDir 'src\main\resources'

if (-not (Test-Path $resourcesDir)) { New-Item -ItemType Directory -Path $resourcesDir -Force | Out-Null }

Push-Location $scriptDir

if (-not (Get-Command openssl -ErrorAction SilentlyContinue)) {
	Write-Error "OpenSSL is not found in PATH. Please install OpenSSL and try again."
	Pop-Location
	exit 1
}

Write-Host "Generating key and self-signed certificate (valid 365 days)..."

# create temporary openssl config to avoid missing default openssl.cnf issues on Windows
$configPath = Join-Path $scriptDir 'temp_openssl.cnf'
$configContent = @"
[req]
distinguished_name = req_distinguished_name
prompt = no
x509_extensions = v3_req

[req_distinguished_name]
CN = localhost

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
"@

$configContent | Out-File -Encoding ascii -FilePath $configPath

try {
	& openssl genrsa -out key.pem 2048
	& openssl req -new -x509 -key key.pem -out cert.pem -days 365 -config $configPath -extensions v3_req

	$keystorePath = Join-Path $resourcesDir 'keystore.p12'
	Write-Host "Creating PKCS12 keystore at $keystorePath (password: changeit)"
	& openssl pkcs12 -export -in cert.pem -inkey key.pem -out $keystorePath -name projecTea -passout pass:changeit

	Write-Host "Cleaning temporary files..."
	Remove-Item -Force key.pem, cert.pem
	Write-Host "Done. Keystore: $keystorePath (password: changeit)"
} catch {
	Write-Error "Error generating certificate: $_"
	if (Test-Path key.pem) { Remove-Item -Force key.pem -ErrorAction SilentlyContinue }
	if (Test-Path cert.pem) { Remove-Item -Force cert.pem -ErrorAction SilentlyContinue }
	Pop-Location
	exit 1
} finally {
	if (Test-Path $configPath) { Remove-Item -Force $configPath -ErrorAction SilentlyContinue }
}

Pop-Location

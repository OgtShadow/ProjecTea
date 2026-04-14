#!/usr/bin/env bash
set -euo pipefail

# Usage: run from repository root or from this folder
# This script generates a self-signed cert and exports a PKCS12 keystore
# Output: server/java/src/main/resources/keystore.p12 (password: changeit)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."
RESOURCES_DIR="$ROOT_DIR/src/main/resources"

mkdir -p "$RESOURCES_DIR"
cd "$SCRIPT_DIR"

echo "Generating key and self-signed certificate (valid 365 days)..."

if ! command -v openssl >/dev/null 2>&1; then
	echo "OpenSSL not found in PATH. Install OpenSSL and retry." >&2
	exit 1
fi

CONFIG_PATH="$SCRIPT_DIR/temp_openssl.cnf"
cat > "$CONFIG_PATH" <<'EOF'
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
EOF

openssl genrsa -out key.pem 2048
openssl req -new -x509 -key key.pem -out cert.pem -days 365 -config "$CONFIG_PATH" -extensions v3_req

echo "Creating PKCS12 keystore at $RESOURCES_DIR/keystore.p12 (password: changeit)"
openssl pkcs12 -export -in cert.pem -inkey key.pem -out "$RESOURCES_DIR/keystore.p12" -name projecTea -passout pass:changeit

CERTS_DIR="$RESOURCES_DIR/certs"
mkdir -p "$CERTS_DIR"
cp cert.pem "$CERTS_DIR/localhost.pem"
cp key.pem "$CERTS_DIR/localhost-key.pem"

echo "Cleaning temporary files..."
rm -f key.pem cert.pem "$CONFIG_PATH"

echo "Done. Keystore: $RESOURCES_DIR/keystore.p12 (password: changeit)"
echo "PEM files: $CERTS_DIR/localhost.pem, $CERTS_DIR/localhost-key.pem"

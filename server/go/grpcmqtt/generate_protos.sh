#!/usr/bin/env bash
set -euo pipefail

# Generate Go protobuf sources using a protoc Docker image.
# Requires Docker desktop running.

PWD_DIR=$(pwd)
docker run --rm -v "$PWD_DIR":/defs -w /defs znly/protoc:3.19 \
  --proto_path=proto \
  --go_out=paths=source_relative:./pb \
  --go-grpc_out=paths=source_relative:./pb \
  proto/messages.proto

echo "Generated pb files in ./pb"

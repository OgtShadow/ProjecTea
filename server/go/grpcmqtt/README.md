# gRPC + MQTT

This folder contains a minimal service demonstrating gRPC + MQTT integration in Go.

Layout
- `proto/messages.proto` – protobuf definition for the service.
- `server/` – gRPC server and MQTT bridge implementation.
- `client/` – example client that publishes and subscribes.

Overview
- The gRPC service exposes `Send(Message) -> Ack` to publish messages to an MQTT broker.
- The `Subscribe(SubscribeRequest) -> stream Message` RPC streams messages received from MQTT for a topic.

Prerequisites
- Go 1.20+
- `protoc` + `protoc-gen-go` to generate Go protobuf code.
- An MQTT broker (we use Mosquitto in the example).

Generate protobuf Go code

Run from this folder:

```bash
protoc --go_out=paths=source_relative:./pb --go-grpc_out=paths=source_relative:./pb proto/messages.proto
```

Run Mosquitto (docker)

```bash
docker run -it -p 1883:1883 eclipse-mosquitto
```

Run server

```bash
cd server/go/grpcmqtt
go run ./server
```

Run client (example)

```bash
go run ./client
```

Run with Docker Compose

From `server/go/grpcmqtt` you can run both Mosquitto and the server with Docker Compose:

```bash
docker compose up --build
```

This will build the `grpcmqtt` image and start `mosquitto` and `grpcmqtt` services. The gRPC server will be reachable on port `50051` and the broker on `1883`.

Notes
- The example subscribes to `#` on the MQTT broker to forward messages to gRPC subscribers; for production refine subscriptions and permissions.
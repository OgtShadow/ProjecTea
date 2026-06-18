FROM golang:1.20-alpine AS builder
WORKDIR /src
RUN apk add --no-cache bash git protobuf build-base
COPY go.mod ./
RUN go mod download
COPY . .

# install protoc-gen-go plugins
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.28.1
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.2.0
ENV PATH=$PATH:/root/go/bin

# generate protobuf Go sources
RUN mkdir -p pb
RUN protoc --proto_path=proto --go_out=paths=source_relative:./pb --go-grpc_out=paths=source_relative:./pb proto/messages.proto

# ensure modules are tidy (populate go.sum)
RUN go mod tidy

# build the server binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /usr/local/bin/grpcmqtt ./cmd/grpcmqtt

FROM alpine:3.18
RUN apk add --no-cache ca-certificates
COPY --from=builder /usr/local/bin/grpcmqtt /usr/local/bin/grpcmqtt
EXPOSE 50051
ENTRYPOINT ["/usr/local/bin/grpcmqtt"]
CMD ["-mqtt", "tcp://mosquitto:1883", "-addr", ":50051"]

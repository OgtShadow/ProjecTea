package main

import (
    "flag"
    "log"
    "net"

    pb "github.com/projecTea/grpcmqtt/pb"
    mqttbridge "github.com/projecTea/grpcmqtt/server/mqtt"
    message "github.com/projecTea/grpcmqtt/server/message"
    "google.golang.org/grpc"
)

var (
    mqttBroker = flag.String("mqtt", "tcp://localhost:1883", "MQTT broker url")
    grpcAddr   = flag.String("addr", ":50051", "gRPC listen address")
)

func main() {
    flag.Parse()

    // start mqtt bridge
    bridge, err := mqttbridge.NewBridge(*mqttBroker)
    if err != nil {
        log.Fatalf("mqtt bridge: %v", err)
    }

    // start gRPC server
    lis, err := net.Listen("tcp", *grpcAddr)
    if err != nil {
        log.Fatalf("failed to listen: %v", err)
    }
    s := grpc.NewServer()
    pb.RegisterMessageServiceServer(s, message.NewServer(bridge))
    log.Printf("gRPC server listening on %s", *grpcAddr)
    if err := s.Serve(lis); err != nil {
        log.Fatalf("gRPC serve: %v", err)
    }
}

package main

import (
    "context"
    "flag"
    "log"
    "net"

    pb "github.com/projecTea/grpcmqtt/pb"
    mqttbridge "github.com/projecTea/grpcmqtt/server"
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
    pb.RegisterMessageServiceServer(s, NewServer(bridge))
    log.Printf("gRPC server listening on %s", *grpcAddr)
    if err := s.Serve(lis); err != nil {
        log.Fatalf("gRPC serve: %v", err)
    }
}

// server implements pb.MessageServiceServer
type server struct {
    pb.UnimplementedMessageServiceServer
    bridge *mqttbridge.Bridge
}

func NewServer(b *mqttbridge.Bridge) pb.MessageServiceServer {
    return &server{bridge: b}
}

func (s *server) Send(ctx context.Context, m *pb.Message) (*pb.Ack, error) {
    err := s.bridge.Publish(m.Topic, []byte(m.Payload))
    if err != nil {
        return &pb.Ack{Ok: false}, err
    }
    return &pb.Ack{Ok: true}, nil
}

func (s *server) Subscribe(req *pb.SubscribeRequest, stream pb.MessageService_SubscribeServer) error {
    ch := s.bridge.Subscribe(req.Topic)
    defer s.bridge.Unsubscribe(req.Topic, ch)
    for msg := range ch {
        if err := stream.Send(&pb.Message{Topic: msg.Topic, Payload: string(msg.Payload)}); err != nil {
            return err
        }
    }
    return nil
}

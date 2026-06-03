package message

import (
    "context"

    pb "github.com/projecTea/grpcmqtt/pb"
    mqttbridge "github.com/projecTea/grpcmqtt/server/mqtt"
)

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

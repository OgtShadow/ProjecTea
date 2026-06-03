package notifications

import (
	"context"
	"encoding/json"
	"os"
	"time"

	pb "github.com/projecTea/grpcmqtt/pb"
	"google.golang.org/grpc"
)

var client pb.MessageServiceClient

func init() {
	grpcAddr := os.Getenv("GRPCMQTT_ADDR")
	if grpcAddr == "" {
		grpcAddr = "grpcmqtt:50051"
	}
	ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
	defer cancel()
	conn, err := grpc.DialContext(ctx, grpcAddr, grpc.WithInsecure(), grpc.WithBlock())
	if err != nil {
		return
	}
	client = pb.NewMessageServiceClient(conn)
}

// Notify sends a notification payload to the given topic via grpcmqtt bridge.
func Notify(topic string, payload any) error {
	if client == nil {
		return nil
	}
	b, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()
	_, err = client.Send(ctx, &pb.Message{Topic: topic, Payload: string(b)})
	return err
}

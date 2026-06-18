package main

import (
    "context"
    "flag"
    "fmt"
    "io"
    "log"
    "time"

    pb "github.com/projecTea/grpcmqtt/pb"
    "google.golang.org/grpc"
)

var (
    serverAddr = flag.String("addr", "grpcmqtt:50051", "gRPC server address")
)

func main() {
    flag.Parse()
    conn, err := grpc.Dial(*serverAddr, grpc.WithInsecure())
    if err != nil {
        log.Fatalf("dial: %v", err)
    }
    defer conn.Close()
    c := pb.NewMessageServiceClient(conn)

    // send example message
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    ack, err := c.Send(ctx, &pb.Message{Topic: "test/topic", Payload: "hello from client"})
    if err != nil {
        log.Fatalf("send: %v", err)
    }
    fmt.Println("Send ack:", ack.Ok)

    // subscribe example
    stream, err := c.Subscribe(context.Background(), &pb.SubscribeRequest{Topic: "test/topic"})
    if err != nil {
        log.Fatalf("subscribe: %v", err)
    }
    fmt.Println("Subscribed, waiting for messages (press Ctrl+C to quit)")
    for {
        m, err := stream.Recv()
        if err == io.EOF {
            break
        }
        if err != nil {
            log.Fatalf("recv: %v", err)
        }
        fmt.Printf("msg: topic=%s payload=%s\n", m.Topic, m.Payload)
    }
}

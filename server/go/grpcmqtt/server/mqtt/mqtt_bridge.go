package mqtt

import (
	"fmt"
	"sync"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

// Message is a tiny wrapper for incoming MQTT messages
type Message struct {
	Topic   string
	Payload []byte
}

// Bridge holds MQTT client and subscriber management
type Bridge struct {
	client mqtt.Client
	mu     sync.Mutex
	subs   map[string][]chan Message
}

func NewBridge(broker string) (*Bridge, error) {
	opts := mqtt.NewClientOptions().AddBroker(broker)
	opts.SetClientID("grpc-mqtt-bridge")
	b := &Bridge{subs: make(map[string][]chan Message)}
	opts.SetDefaultPublishHandler(func(client mqtt.Client, msg mqtt.Message) {
		b.dispatch(msg.Topic(), msg.Payload())
	})
	c := mqtt.NewClient(opts)
	var lastErr error
	for i := 0; i < 10; i++ {
		token := c.Connect()
		token.Wait()
		if token.Error() == nil {
			lastErr = nil
			break
		}
		lastErr = token.Error()
		time.Sleep(500 * time.Millisecond)
	}
	if lastErr != nil {
		return nil, lastErr
	}
	b.client = c
	if token := c.Subscribe("#", 0, nil); token.Wait() && token.Error() != nil {
		return nil, token.Error()
	}
	return b, nil
}

func (b *Bridge) Publish(topic string, payload []byte) error {
	token := b.client.Publish(topic, 0, false, payload)
	token.Wait()
	return token.Error()
}

func (b *Bridge) dispatch(topic string, payload []byte) {
	b.mu.Lock()
	defer b.mu.Unlock()
	for t, chans := range b.subs {
		if t == topic || t == "#" {
			for _, ch := range chans {
				select {
				case ch <- Message{Topic: topic, Payload: payload}:
				default:
				}
			}
		}
	}
}

func (b *Bridge) Subscribe(topic string) chan Message {
	ch := make(chan Message, 32)
	b.mu.Lock()
	defer b.mu.Unlock()
	b.subs[topic] = append(b.subs[topic], ch)
	return ch
}

func (b *Bridge) Unsubscribe(topic string, ch chan Message) {
	b.mu.Lock()
	defer b.mu.Unlock()
	list := b.subs[topic]
	for i := range list {
		if list[i] == ch {
			list = append(list[:i], list[i+1:]...)
			break
		}
	}
	if len(list) == 0 {
		delete(b.subs, topic)
	} else {
		b.subs[topic] = list
	}
	close(ch)
}

func (b *Bridge) Close() {
	b.client.Disconnect(250)
}

func (b *Bridge) String() string { return fmt.Sprintf("Bridge(subs=%d)", len(b.subs)) }

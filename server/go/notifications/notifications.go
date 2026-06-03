package notifications

import (
	"context"
	"sync"
	"time"
)

type Event struct {
	Type      string    `json:"type"`
	Payload   any       `json:"payload"`
	Timestamp time.Time `json:"timestamp"`
}

var (
	mu          sync.RWMutex
	subscribers = map[chan Event]struct{}{}
	buffer      = make(chan Event, 64)
	oncePump    sync.Once
)

func init() {
	oncePump.Do(func() {
		go pump()
	})
}

func pump() {
	for event := range buffer {
		mu.RLock()
		for subscriber := range subscribers {
			select {
			case subscriber <- event:
			default:
			}
		}
		mu.RUnlock()
	}
}

func Notify(eventType string, payload any) error {
	event := Event{Type: eventType, Payload: payload, Timestamp: time.Now().UTC()}
	select {
	case buffer <- event:
	default:
		// drop oldest style: if buffer is full, don't block request handlers
	}
	return nil
}

func Subscribe(ctx context.Context) <-chan Event {
	ch := make(chan Event, 16)
	mu.Lock()
	subscribers[ch] = struct{}{}
	mu.Unlock()

	go func() {
		<-ctx.Done()
		mu.Lock()
		delete(subscribers, ch)
		mu.Unlock()
		close(ch)
	}()

	return ch
}

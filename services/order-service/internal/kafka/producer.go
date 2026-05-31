package kafka

import (
"context"
"encoding/json"
"log"
"time"

"github.com/segmentio/kafka-go"
)

// OrderCreatedEvent is the message published to Kafka when an order is placed.
// notification-service consumes this event to send a confirmation email.
type OrderCreatedEvent struct {
OrderID   string  `json:"order_id"`
UserID    string  `json:"user_id"`
Total     float64 `json:"total"`
Status    string  `json:"status"`
CreatedAt string  `json:"created_at"`
}

type Producer struct {
writer *kafka.Writer
}

func NewProducer(brokers string) *Producer {
writer := &kafka.Writer{
Addr:         kafka.TCP(brokers),
Topic:        "order.created",
Balancer:     &kafka.LeastBytes{},
WriteTimeout: 10 * time.Second,
ReadTimeout:  10 * time.Second,
// RequiredAcks: all replicas must acknowledge — ensures no message loss
RequiredAcks: kafka.RequireOne,
}
return &Producer{writer: writer}
}

func (p *Producer) PublishOrderCreated(ctx context.Context, event OrderCreatedEvent) error {
payload, err := json.Marshal(event)
if err != nil {
return err
}

err = p.writer.WriteMessages(ctx, kafka.Message{
Key:   []byte(event.OrderID),
Value: payload,
})
if err != nil {
// Log but don't fail the order — Kafka unavailability should not
// block order creation. The event can be replayed later.
log.Printf("warning: failed to publish order.created event: %v", err)
}
return nil
}

func (p *Producer) Close() {
p.writer.Close()
}

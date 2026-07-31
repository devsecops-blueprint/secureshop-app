package services

import (
"context"
"database/sql"
"fmt"
"log"
"time"

"github.com/devsecops-blueprint/secureshop/order-service/internal/kafka"
pb "github.com/devsecops-blueprint/secureshop/order-service/proto"
"google.golang.org/grpc"
"google.golang.org/grpc/credentials/insecure"
)

type OrderItem struct {
ProductID   string
ProductName string
Quantity    int32
UnitPrice   float64
}

type Order struct {
ID        string
UserID    string
Status    string
Total     float64
Items     []OrderItem
CreatedAt string
}

type OrderService struct {
db            *sql.DB
producer      *kafka.Producer
productClient pb.ProductServiceClient
}

func NewOrderService(db *sql.DB, producer *kafka.Producer, productAddr string) *OrderService {
conn, err := grpc.NewClient(productAddr,
grpc.WithTransportCredentials(insecure.NewCredentials()),
)
if err != nil {
log.Printf("warning: could not connect to product-service: %v", err)
return &OrderService{db: db, producer: producer}
}
return &OrderService{
db:            db,
producer:      producer,
productClient: pb.NewProductServiceClient(conn),
}
}

func (s *OrderService) CreateOrder(ctx context.Context, userID string, items []OrderItem) (*Order, error) {
if s.productClient != nil {
for i, item := range items {
resp, err := s.productClient.GetProduct(ctx, &pb.GetProductRequest{
ProductId: item.ProductID,
})
if err != nil {
log.Printf("warning: could not fetch price for product %s: %v", item.ProductID, err)
continue
}
items[i].UnitPrice   = resp.Price
items[i].ProductName = resp.Name
}
}

var total float64
for _, item := range items {
total += float64(item.Quantity) * item.UnitPrice
}

tx, err := s.db.BeginTx(ctx, nil)
if err != nil {
return nil, fmt.Errorf("failed to begin transaction: %w", err)
}
defer tx.Rollback()

var orderID string
var createdAt time.Time
err = tx.QueryRowContext(ctx,
`INSERT INTO orders (user_id, status, total)
 VALUES ($1, 'pending', $2)
 RETURNING id, created_at`,
userID, total,
).Scan(&orderID, &createdAt)
if err != nil {
return nil, fmt.Errorf("failed to insert order: %w", err)
}

for _, item := range items {
_, err = tx.ExecContext(ctx,
`INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
 VALUES ($1, $2, $3, $4, $5)`,
orderID, item.ProductID, item.ProductName, item.Quantity, item.UnitPrice,
)
if err != nil {
return nil, fmt.Errorf("failed to insert order item: %w", err)
}
}

if err := tx.Commit(); err != nil {
return nil, fmt.Errorf("failed to commit transaction: %w", err)
}

order := &Order{
ID:        orderID,
UserID:    userID,
Status:    "pending",
Total:     total,
Items:     items,
CreatedAt: createdAt.Format(time.RFC3339),
}

go func() {
event := kafka.OrderCreatedEvent{
OrderID:   orderID,
UserID:    userID,
Total:     total,
Status:    "pending",
CreatedAt: createdAt.Format(time.RFC3339),
}
if err := s.producer.PublishOrderCreated(context.Background(), event); err != nil {
log.Printf("failed to publish order event: %v", err)
}
}()

log.Printf("Order created: %s for user %s, total: %.2f", orderID, userID, total)
return order, nil
}

func (s *OrderService) GetOrder(ctx context.Context, orderID string) (*Order, error) {
order := &Order{}
var createdAt time.Time

err := s.db.QueryRowContext(ctx,
`SELECT id, user_id, status, total, created_at
 FROM orders WHERE id = $1`,
orderID,
).Scan(&order.ID, &order.UserID, &order.Status, &order.Total, &createdAt)
if err == sql.ErrNoRows {
return nil, fmt.Errorf("order not found")
}
if err != nil {
return nil, err
}
order.CreatedAt = createdAt.Format(time.RFC3339)

rows, err := s.db.QueryContext(ctx,
`SELECT product_id, product_name, quantity, unit_price
 FROM order_items WHERE order_id = $1`,
orderID,
)
if err != nil {
return nil, err
}
defer rows.Close()

for rows.Next() {
var item OrderItem
if err := rows.Scan(&item.ProductID, &item.ProductName, &item.Quantity, &item.UnitPrice); err != nil {
return nil, err
}
order.Items = append(order.Items, item)
}
return order, nil
}

func (s *OrderService) ListOrders(ctx context.Context, userID string) ([]*Order, error) {
rows, err := s.db.QueryContext(ctx,
`SELECT id, user_id, status, total, created_at
 FROM orders WHERE user_id = $1
 ORDER BY created_at DESC`,
userID,
)
if err != nil {
return nil, err
}
defer rows.Close()

var orders []*Order
for rows.Next() {
order := &Order{}
var createdAt time.Time
if err := rows.Scan(&order.ID, &order.UserID, &order.Status, &order.Total, &createdAt); err != nil {
return nil, err
}
order.CreatedAt = createdAt.Format(time.RFC3339)
orders = append(orders, order)
}
return orders, nil
}

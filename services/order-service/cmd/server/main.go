package main

import (
"log"
"os"
"os/signal"
"syscall"

"github.com/devsecops-blueprint/secureshop/order-service/internal/config"
"github.com/devsecops-blueprint/secureshop/order-service/internal/db"
grpcserver "github.com/devsecops-blueprint/secureshop/order-service/internal/grpc"
"github.com/devsecops-blueprint/secureshop/order-service/internal/kafka"
"github.com/devsecops-blueprint/secureshop/order-service/internal/services"
)

func main() {
cfg := config.Load()

// Connect to PostgreSQL
database := db.Connect(cfg.DatabaseURL)
defer database.Close()

if err := db.Migrate(database); err != nil {
log.Fatalf("migration failed: %v", err)
}

// Connect to Kafka
producer := kafka.NewProducer(cfg.KafkaBrokers)
defer producer.Close()

// Wire service and gRPC server
orderSvc := services.NewOrderService(database, producer)
srv := grpcserver.NewServer(orderSvc)

// Start in background goroutine
go grpcserver.Start(srv, cfg.Port)

// Graceful shutdown
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit
log.Println("shutting down order-service...")
srv.GracefulStop()
log.Println("order-service stopped")
}

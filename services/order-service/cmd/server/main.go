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

database := db.Connect(cfg.DatabaseURL)
defer database.Close()

if err := db.Migrate(database); err != nil {
log.Fatalf("migration failed: %v", err)
}

producer := kafka.NewProducer(cfg.KafkaBrokers)
defer producer.Close()

// Pass product service address for price lookup
orderSvc := services.NewOrderService(database, producer, cfg.ProductServiceAddr)
srv := grpcserver.NewServer(orderSvc)

go grpcserver.Start(srv, cfg.Port)

quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit
log.Println("shutting down order-service...")
srv.GracefulStop()
log.Println("order-service stopped")
}

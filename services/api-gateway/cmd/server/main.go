package main

import (
"context"
"log"
"net/http"
"os"
"os/signal"
"syscall"
"time"

"github.com/devsecops-blueprint/secureshop/api-gateway/internal/config"
"github.com/devsecops-blueprint/secureshop/api-gateway/internal/graphql"
"github.com/devsecops-blueprint/secureshop/api-gateway/internal/middleware"
)

func main() {
cfg := config.Load()

// Wire up the GraphQL handler (which internally holds gRPC clients)
gqlHandler, err := graphql.NewHandler(cfg)
if err != nil {
log.Fatalf("failed to initialize GraphQL handler: %v", err)
}
defer gqlHandler.Close()

mux := http.NewServeMux()
mux.Handle("/graphql", middleware.Chain(
gqlHandler,
middleware.RequestID,
middleware.Logger,
middleware.CORS(cfg.AllowedOrigins),
middleware.Auth(cfg.JWTSecret),
))
mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
w.WriteHeader(http.StatusOK)
w.Write([]byte(`{"status":"ok","service":"api-gateway"}`))
})
mux.HandleFunc("/readyz", func(w http.ResponseWriter, r *http.Request) {
// TODO: ping downstream gRPC services
w.WriteHeader(http.StatusOK)
w.Write([]byte(`{"status":"ready"}`))
})

srv := &http.Server{
Addr:         ":" + cfg.Port,
Handler:      mux,
ReadTimeout:  15 * time.Second,
WriteTimeout: 15 * time.Second,
IdleTimeout:  60 * time.Second,
}

go func() {
log.Printf("api-gateway listening on :%s", cfg.Port)
if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
log.Fatalf("server error: %v", err)
}
}()

// Graceful shutdown on SIGTERM/SIGINT
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit
log.Println("shutting down api-gateway...")

ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
if err := srv.Shutdown(ctx); err != nil {
log.Fatalf("forced shutdown: %v", err)
}
log.Println("api-gateway stopped")
}

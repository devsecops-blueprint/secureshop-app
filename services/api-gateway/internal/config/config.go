package config

import (
"os"
"strings"
)

type Config struct {
Port           string
JWTSecret      string
AllowedOrigins []string

// gRPC upstream addresses
UserServiceAddr         string
ProductServiceAddr      string
OrderServiceAddr        string
PaymentServiceAddr      string
NotificationServiceAddr string
}

func Load() *Config {
return &Config{
Port:      getEnv("PORT", "8080"),
JWTSecret: getEnv("JWT_SECRET", "dev-secret-change-in-prod"),
AllowedOrigins: strings.Split(
getEnv("ALLOWED_ORIGINS", "http://localhost:3000"), ",",
),
UserServiceAddr:         getEnv("USER_SERVICE_ADDR", "user-service:50051"),
ProductServiceAddr:      getEnv("PRODUCT_SERVICE_ADDR", "product-service:50051"),
OrderServiceAddr:        getEnv("ORDER_SERVICE_ADDR", "order-service:50051"),
PaymentServiceAddr:      getEnv("PAYMENT_SERVICE_ADDR", "payment-service:50051"),
NotificationServiceAddr: getEnv("NOTIFICATION_SERVICE_ADDR", "notification-service:50051"),
}
}

func getEnv(key, fallback string) string {
if v, ok := os.LookupEnv(key); ok {
return v
}
return fallback
}

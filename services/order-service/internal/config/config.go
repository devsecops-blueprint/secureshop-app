package config

import "os"

type Config struct {
Port               string
DatabaseURL        string
KafkaBrokers       string
ProductServiceAddr string
}

func Load() *Config {
return &Config{
Port:               getEnv("PORT", "50051"),
DatabaseURL:        getEnv("DATABASE_URL", "postgresql://secureshop:dev-password@localhost:5432/orderdb?sslmode=disable"),
KafkaBrokers:       getEnv("KAFKA_BROKERS", "localhost:9092"),
ProductServiceAddr: getEnv("PRODUCT_SERVICE_ADDR", "product-service:50051"),
}
}

func getEnv(key, fallback string) string {
if v, ok := os.LookupEnv(key); ok {
return v
}
return fallback
}

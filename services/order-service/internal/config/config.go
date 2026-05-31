package config

import "os"

type Config struct {
Port        string
DatabaseURL string
KafkaBrokers string
}

func Load() *Config {
return &Config{
Port:         getEnv("PORT", "50051"),
DatabaseURL:  getEnv("DATABASE_URL", "postgresql://secureshop:dev-password@localhost:5432/orderdb"),
KafkaBrokers: getEnv("KAFKA_BROKERS", "localhost:9092"),
}
}

func getEnv(key, fallback string) string {
if v, ok := os.LookupEnv(key); ok {
return v
}
return fallback
}

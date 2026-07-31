import os

KAFKA_BROKERS  = os.getenv("KAFKA_BROKERS", "localhost:9092")
REDIS_URL      = os.getenv("REDIS_URL",     "redis://localhost:6379")
KAFKA_GROUP_ID = os.getenv("KAFKA_GROUP_ID", "notification-service")
LOG_LEVEL      = os.getenv("LOG_LEVEL",      "INFO")

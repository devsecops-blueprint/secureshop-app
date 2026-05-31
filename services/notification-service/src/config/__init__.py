import os

KAFKA_BROKERS  = os.getenv("KAFKA_BROKERS", "localhost:9092").split(",")
REDIS_URL      = os.getenv("REDIS_URL", "redis://localhost:6379")
KAFKA_GROUP_ID = os.getenv("KAFKA_GROUP_ID", "notification-service")

# Topics this service consumes
TOPICS = [
    "order.created",
    "payment.processed",
]

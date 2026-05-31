import json
import logging
from kafka import KafkaConsumer
from kafka.errors import NoBrokersAvailable
import time

from src.config import KAFKA_BROKERS, KAFKA_GROUP_ID, TOPICS
from src.services.notification_service import (
    handle_order_created,
    handle_payment_processed,
)

logger = logging.getLogger(__name__)

# Maps Kafka topic name → handler function
HANDLERS = {
    "order.created":     handle_order_created,
    "payment.processed": handle_payment_processed,
}


def create_consumer(retries: int = 10, delay: int = 5) -> KafkaConsumer:
    """
    Create Kafka consumer with retry logic.
    Kafka may not be ready immediately when the container starts —
    especially in Docker Compose where startup order isn't guaranteed.
    We retry up to 10 times with 5 second gaps.
    """
    for attempt in range(retries):
        try:
            consumer = KafkaConsumer(
                *TOPICS,
                bootstrap_servers=KAFKA_BROKERS,
                group_id=KAFKA_GROUP_ID,
                auto_offset_reset="earliest",
                enable_auto_commit=True,
                value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            )
            logger.info(f"Connected to Kafka brokers: {KAFKA_BROKERS}")
            return consumer
        except NoBrokersAvailable:
            logger.warning(f"Kafka not ready, retrying ({attempt + 1}/{retries})...")
            time.sleep(delay)

    raise RuntimeError("Could not connect to Kafka after multiple retries")


def start_consuming():
    """Main consumer loop — runs forever processing messages."""
    consumer = create_consumer()
    logger.info(f"Subscribed to topics: {TOPICS}")

    for message in consumer:
        topic   = message.topic
        payload = message.value

        logger.info(f"Received event from topic={topic}")

        handler = HANDLERS.get(topic)
        if handler:
            try:
                handler(payload)
            except Exception as e:
                # Log and continue — never crash the consumer loop.
                # A crashed consumer stops processing ALL messages.
                logger.error(f"Error handling {topic} event: {e}", exc_info=True)
        else:
            logger.warning(f"No handler registered for topic: {topic}")

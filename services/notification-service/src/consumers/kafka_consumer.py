import json
import logging
from kafka import KafkaConsumer
from kafka.errors import NoBrokersAvailable
import time

from src.config import KAFKA_BROKERS, KAFKA_GROUP_ID
from src.services.notification_service import (
    handle_order_created,
    handle_payment_processed
)

logger = logging.getLogger(__name__)

# Topics this service listens to
TOPICS = ["order.created", "payment.processed"]

# Route each topic to the right handler function
HANDLERS = {
    "order.created":      handle_order_created,
    "payment.processed":  handle_payment_processed,
}


def create_consumer() -> KafkaConsumer:
    """
    Create Kafka consumer with retry logic.
    Kafka may not be ready immediately when the container starts —
    we retry for up to 60 seconds before giving up.
    """
    retries = 0
    max_retries = 12

    while retries < max_retries:
        try:
            consumer = KafkaConsumer(
                *TOPICS,
                bootstrap_servers=KAFKA_BROKERS.split(","),
                group_id=KAFKA_GROUP_ID,
                auto_offset_reset="earliest",
                enable_auto_commit=True,
                value_deserializer=lambda m: json.loads(m.decode("utf-8")),
                # How long to wait for messages before returning an empty batch
                consumer_timeout_ms=1000,
            )
            logger.info(f"Connected to Kafka at {KAFKA_BROKERS}")
            return consumer
        except NoBrokersAvailable:
            retries += 1
            logger.warning(f"Kafka not available, retrying {retries}/{max_retries}...")
            time.sleep(5)

    raise RuntimeError("Could not connect to Kafka after maximum retries")


def start_consuming():
    """Main consumer loop — runs forever, processing messages as they arrive."""
    consumer = create_consumer()
    logger.info(f"Listening on topics: {TOPICS}")

    try:
        while True:
            # poll() fetches a batch of messages — returns immediately if none
            records = consumer.poll(timeout_ms=1000)

            for topic_partition, messages in records.items():
                topic = topic_partition.topic
                handler = HANDLERS.get(topic)

                if not handler:
                    logger.warning(f"No handler for topic: {topic}")
                    continue

                for message in messages:
                    try:
                        logger.info(f"Received message on {topic}: offset={message.offset}")
                        handler(message.value)
                    except Exception as e:
                        # Log and continue — never crash the consumer loop
                        logger.error(f"Error processing message on {topic}: {e}")

    except KeyboardInterrupt:
        logger.info("Consumer interrupted")
    finally:
        consumer.close()
        logger.info("Kafka consumer closed")

import logging
import signal
import sys

from src.consumers.kafka_consumer import start_consuming

# JSON structured logging — same as product-service
logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","msg":"%(message)s"}'
)
logger = logging.getLogger(__name__)


def handle_sigterm(*args):
    logger.info("SIGTERM received, shutting down notification-service...")
    sys.exit(0)


signal.signal(signal.SIGTERM, handle_sigterm)

if __name__ == "__main__":
    logger.info("notification-service starting...")
    start_consuming()

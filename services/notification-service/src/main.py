import logging
import signal
import sys
from src.config import LOG_LEVEL
from src.consumers.kafka_consumer import start_consuming

# Configure structured logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper(), logging.INFO),
    format='{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}'
)

logger = logging.getLogger(__name__)


def handle_sigterm(*args):
    logger.info("SIGTERM received, shutting down notification-service...")
    sys.exit(0)


signal.signal(signal.SIGTERM, handle_sigterm)

if __name__ == "__main__":
    logger.info("Starting notification-service")
    start_consuming()

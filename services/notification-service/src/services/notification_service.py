import json
import logging
import redis as redis_client
from src.config import REDIS_URL

logger = logging.getLogger(__name__)

# Connect to Redis for storing notification history.
# decode_responses=True means Redis returns strings instead of bytes.
r = redis_client.from_url(REDIS_URL, decode_responses=True)

def handle_order_created(event: dict):
    """
    Called when an order.created event arrives from Kafka.
    In production this would send an email via SendGrid or SES.
    For the blueprint we log it and store in Redis.
    """
    order_id = event.get("order_id")
    user_id  = event.get("user_id")
    total    = event.get("total")

    logger.info(f"Order confirmation notification | order={order_id} user={user_id} total={total}")

    # Store notification record in Redis with 7 day expiry
    notification = {
        "type":     "order_confirmation",
        "order_id": order_id,
        "user_id":  user_id,
        "total":    total,
        "status":   "sent"
    }

    try:
        r.setex(
            f"notification:order:{order_id}",
            604800,  # 7 days in seconds
            json.dumps(notification)
        )
        logger.info(f"Notification stored in Redis for order {order_id}")
    except Exception as e:
        logger.error(f"Failed to store notification in Redis: {e}")


def handle_payment_processed(event: dict):
    """
    Called when a payment.processed event arrives from Kafka.
    In production this would send a payment receipt email.
    """
    payment_id = event.get("payment_id")
    order_id   = event.get("order_id")
    user_id    = event.get("user_id")
    amount     = event.get("amount")
    status     = event.get("status")

    logger.info(f"Payment receipt notification | payment={payment_id} order={order_id} amount={amount} status={status}")

    notification = {
        "type":       "payment_receipt",
        "payment_id": payment_id,
        "order_id":   order_id,
        "user_id":    user_id,
        "amount":     amount,
        "status":     status
    }

    try:
        r.setex(
            f"notification:payment:{payment_id}",
            604800,
            json.dumps(notification)
        )
        logger.info(f"Notification stored in Redis for payment {payment_id}")
    except Exception as e:
        logger.error(f"Failed to store notification in Redis: {e}")

import json
import logging
import redis as redis_client
from src.config import REDIS_URL

logger = logging.getLogger(__name__)

# Connect to Redis for notification history storage
r = redis_client.from_url(REDIS_URL, decode_responses=True)

def handle_order_created(event: dict):
    """
    Called when an order.created event arrives from Kafka.
    In production this would call an email provider (SendGrid, SES).
    For the blueprint we log the notification and store it in Redis.
    """
    order_id = event.get("order_id")
    user_id  = event.get("user_id")
    total    = event.get("total")

    # Simulate sending order confirmation email
    logger.info(f"[EMAIL] Order confirmation → user={user_id} order={order_id} total={total}")

    # Store notification record in Redis with 7-day TTL
    notification = {
        "type":     "order_confirmation",
        "user_id":  user_id,
        "order_id": order_id,
        "total":    total,
        "status":   "sent",
    }
    _store_notification(user_id, notification)


def handle_payment_processed(event: dict):
    """
    Called when a payment.processed event arrives from Kafka.
    Sends a payment receipt notification.
    """
    payment_id = event.get("payment_id")
    order_id   = event.get("order_id")
    user_id    = event.get("user_id")
    amount     = event.get("amount")
    status     = event.get("status")

    logger.info(f"[EMAIL] Payment receipt → user={user_id} payment={payment_id} amount={amount} status={status}")

    notification = {
        "type":       "payment_receipt",
        "user_id":    user_id,
        "payment_id": payment_id,
        "order_id":   order_id,
        "amount":     amount,
        "status":     status,
    }
    _store_notification(user_id, notification)


def _store_notification(user_id: str, notification: dict):
    """Store notification in Redis list per user. Kept for 7 days."""
    key = f"notifications:{user_id}"
    try:
        r.lpush(key, json.dumps(notification))
        r.expire(key, 60 * 60 * 24 * 7)  # 7 days TTL
        logger.debug(f"Notification stored for user {user_id}")
    except Exception as e:
        # Redis failure should not crash the consumer
        logger.warning(f"Failed to store notification in Redis: {e}")

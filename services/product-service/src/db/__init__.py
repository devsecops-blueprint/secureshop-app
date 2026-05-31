import psycopg2
import psycopg2.pool
import logging
from src.config import DATABASE_URL

logger = logging.getLogger(__name__)

# Lazy pool — created on first use, not at import time.
# This allows the module to be imported without a live database connection,
# which is needed for syntax checks and unit tests.
_pool = None

def get_pool():
    global _pool
    if _pool is None:
        _pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=DATABASE_URL
        )
    return _pool

# Keep 'pool' as a callable for backward compatibility with service code
class _LazyPool:
    def getconn(self):
        return get_pool().getconn()
    def putconn(self, conn):
        return get_pool().putconn(conn)

pool = _LazyPool()

def migrate():
    """Create tables if they don't exist."""
    conn = get_pool().getconn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS products (
                    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                    name        VARCHAR(255) NOT NULL,
                    description TEXT         NOT NULL,
                    price       NUMERIC(10,2) NOT NULL,
                    stock       INTEGER      NOT NULL DEFAULT 0,
                    category    VARCHAR(100) NOT NULL,
                    image_url   VARCHAR(500) NOT NULL DEFAULT '/placeholder.jpg',
                    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
                );

                CREATE INDEX IF NOT EXISTS idx_products_category
                    ON products(category);
            """)

            cur.execute("SELECT COUNT(*) FROM products")
            count = cur.fetchone()[0]

            if count == 0:
                cur.execute("""
                    INSERT INTO products (name, description, price, stock, category, image_url)
                    VALUES
                        ('Wireless Headphones',    'Premium noise-cancelling headphones', 149.99, 50,  'electronics', '/images/headphones.jpg'),
                        ('Mechanical Keyboard',    'RGB backlit mechanical keyboard',      89.99, 30,  'electronics', '/images/keyboard.jpg'),
                        ('USB-C Hub',              '7-in-1 USB-C multiport adapter',       49.99, 100, 'electronics', '/images/hub.jpg'),
                        ('Running Shoes',          'Lightweight breathable running shoes', 119.99, 75,  'footwear',    '/images/shoes.jpg'),
                        ('Backpack',               'Water-resistant 30L hiking backpack',  79.99, 60,  'bags',        '/images/backpack.jpg'),
                        ('Coffee Maker',           'Programmable 12-cup coffee maker',     69.99, 40,  'kitchen',     '/images/coffee.jpg'),
                        ('Desk Lamp',              'LED desk lamp with USB charging port', 39.99, 80,  'furniture',   '/images/lamp.jpg'),
                        ('Yoga Mat',               'Non-slip eco-friendly yoga mat',       34.99, 90,  'fitness',     '/images/yoga.jpg')
                """)
                logger.info("Demo products seeded")

        conn.commit()
        logger.info("Database migration complete")
    finally:
        get_pool().putconn(conn)

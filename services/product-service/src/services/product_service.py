import logging
from src.db import pool

logger = logging.getLogger(__name__)

def get_product(product_id: str) -> dict:
    conn = pool.getconn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, name, description, price, stock, category, image_url
                   FROM products WHERE id = %s""",
                (product_id,)
            )
            row = cur.fetchone()
            if not row:
                raise ValueError(f"Product {product_id} not found")
            return _row_to_dict(row)
    finally:
        pool.putconn(conn)


def list_products(page: int, page_size: int, category: str) -> dict:
    # Default values — page 1, 20 items per page
    page      = max(1, page or 1)
    page_size = max(1, min(100, page_size or 20))
    offset    = (page - 1) * page_size

    conn = pool.getconn()
    try:
        with conn.cursor() as cur:
            if category:
                cur.execute(
                    """SELECT id, name, description, price, stock, category, image_url
                       FROM products WHERE category = %s
                       ORDER BY created_at DESC
                       LIMIT %s OFFSET %s""",
                    (category, page_size, offset)
                )
            else:
                cur.execute(
                    """SELECT id, name, description, price, stock, category, image_url
                       FROM products
                       ORDER BY created_at DESC
                       LIMIT %s OFFSET %s""",
                    (page_size, offset)
                )
            rows = cur.fetchall()

            # Get total count for pagination
            if category:
                cur.execute("SELECT COUNT(*) FROM products WHERE category = %s", (category,))
            else:
                cur.execute("SELECT COUNT(*) FROM products")
            total = cur.fetchone()[0]

            return {"products": [_row_to_dict(r) for r in rows], "total": total}
    finally:
        pool.putconn(conn)


def search_products(query: str) -> dict:
    conn = pool.getconn()
    try:
        with conn.cursor() as cur:
            # Full-text search using PostgreSQL's built-in tsvector.
            # Much faster than LIKE '%query%' on large catalogues.
            cur.execute(
                """SELECT id, name, description, price, stock, category, image_url
                   FROM products
                   WHERE to_tsvector('english', name || ' ' || description)
                         @@ plainto_tsquery('english', %s)
                   ORDER BY ts_rank(
                       to_tsvector('english', name || ' ' || description),
                       plainto_tsquery('english', %s)
                   ) DESC
                   LIMIT 50""",
                (query, query)
            )
            rows = cur.fetchall()
            return {"products": [_row_to_dict(r) for r in rows], "total": len(rows)}
    finally:
        pool.putconn(conn)


def _row_to_dict(row: tuple) -> dict:
    """Map a database row tuple to a product dictionary."""
    return {
        "id":          str(row[0]),
        "name":        row[1],
        "description": row[2],
        "price":       float(row[3]),
        "stock":       row[4],
        "category":    row[5],
        "image_url":   row[6],
    }

package db

import (
"context"
"database/sql"
"log"

_ "github.com/lib/pq"
)

func Connect(databaseURL string) *sql.DB {
db, err := sql.Open("postgres", databaseURL)
if err != nil {
log.Fatalf("failed to open database: %v", err)
}
if err := db.PingContext(context.Background()); err != nil {
log.Fatalf("failed to connect to database: %v", err)
}
db.SetMaxOpenConns(10)
db.SetMaxIdleConns(5)
return db
}

func Migrate(db *sql.DB) error {
_, err := db.Exec(`
CREATE TABLE IF NOT EXISTS orders (
id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
user_id    UUID        NOT NULL,
status     VARCHAR(50) NOT NULL DEFAULT 'pending',
total      NUMERIC(12,2) NOT NULL DEFAULT 0,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
order_id     UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
product_id   UUID          NOT NULL,
product_name VARCHAR(255)  NOT NULL,
quantity     INTEGER       NOT NULL,
unit_price   NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
`)
if err != nil {
return err
}
log.Println("Database migration complete")
return nil
}

import os

# Same pattern as every other service — environment variables with dev defaults.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://secureshop:dev-password@localhost:5432/productdb")
PORT         = int(os.getenv("PORT", "50051"))
NODE_ENV     = os.getenv("NODE_ENV", "development")

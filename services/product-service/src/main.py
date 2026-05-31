import grpc
import logging
import signal
import sys
from concurrent import futures

from src.config import PORT
from src.db import migrate
from src.grpc import products_pb2_grpc
from src.grpc.server import ProductServicer

# Configure logging — JSON format picked up by Loki
logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","msg":"%(message)s"}'
)
logger = logging.getLogger(__name__)


def serve():
    # Run DB migrations before accepting traffic
    migrate()

    # ThreadPoolExecutor — handles concurrent gRPC requests.
    # max_workers=10 means up to 10 requests handled simultaneously.
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    products_pb2_grpc.add_ProductServiceServicer_to_server(ProductServicer(), server)

    server.add_insecure_port(f"0.0.0.0:{PORT}")
    server.start()
    logger.info(f"product-service gRPC server listening on port {PORT}")

    # Graceful shutdown on SIGTERM — same pattern across all services
    def handle_sigterm(*args):
        logger.info("SIGTERM received, shutting down...")
        server.stop(grace=30)
        sys.exit(0)

    signal.signal(signal.SIGTERM, handle_sigterm)
    server.wait_for_termination()


if __name__ == "__main__":
    serve()

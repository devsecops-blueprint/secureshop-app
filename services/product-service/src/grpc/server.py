import grpc
import logging
from src.grpc import products_pb2, products_pb2_grpc
from src.services.product_service import get_product, list_products, search_products

logger = logging.getLogger(__name__)

# StatusCode maps our service errors to gRPC status codes —
# same concept as the Node.js STATUS mapping in user-service.
class ProductServicer(products_pb2_grpc.ProductServiceServicer):
    """Implements the ProductService gRPC interface defined in products.proto."""

    def GetProduct(self, request, context):
        try:
            product = get_product(request.product_id)
            return products_pb2.ProductResponse(**product)
        except ValueError as e:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(str(e))
            return products_pb2.ProductResponse()
        except Exception as e:
            logger.error(f"GetProduct error: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details("Internal server error")
            return products_pb2.ProductResponse()

    def ListProducts(self, request, context):
        try:
            result = list_products(request.page, request.page_size, request.category)
            products = [products_pb2.ProductResponse(**p) for p in result["products"]]
            return products_pb2.ListProductsResponse(
                products=products,
                total=result["total"]
            )
        except Exception as e:
            logger.error(f"ListProducts error: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details("Internal server error")
            return products_pb2.ListProductsResponse()

    def SearchProducts(self, request, context):
        try:
            result = search_products(request.query)
            products = [products_pb2.ProductResponse(**p) for p in result["products"]]
            return products_pb2.ListProductsResponse(
                products=products,
                total=result["total"]
            )
        except Exception as e:
            logger.error(f"SearchProducts error: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details("Internal server error")
            return products_pb2.ListProductsResponse()

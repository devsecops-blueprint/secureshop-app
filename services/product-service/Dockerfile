# ── Stage 1: Build — generate proto files ────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

COPY proto/ proto/
COPY src/   src/

# Generate gRPC Python code inside the image
RUN python -m grpc_tools.protoc \
    -I proto \
    --python_out=src/grpc \
    --grpc_python_out=src/grpc \
    proto/products.proto

# ── Stage 2: Final image ──────────────────────────────────────
FROM python:3.11-slim

RUN adduser --disabled-password --gecos '' appuser

WORKDIR /app

COPY --from=builder /root/.local /home/appuser/.local
COPY --from=builder /build/src   ./src
COPY requirements.txt .

ENV PATH=/home/appuser/.local/bin:$PATH

USER appuser

EXPOSE 50051

CMD ["python", "-m", "src.main"]

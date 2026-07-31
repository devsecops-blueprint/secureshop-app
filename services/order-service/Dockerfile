# ── Stage 1: Build ────────────────────────────────────────────
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates protobuf

RUN GOTOOLCHAIN=local go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.34.1 && \
    GOTOOLCHAIN=local go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0

WORKDIR /build

COPY go.mod go.sum ./
RUN GOTOOLCHAIN=local go mod download

COPY . .

RUN protoc \
    --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    proto/orders.proto

RUN GOTOOLCHAIN=local CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o /bin/order-service ./cmd/server

# ── Stage 2: Final image ──────────────────────────────────────
FROM scratch

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /bin/order-service /order-service

USER 65534:65534

EXPOSE 50051

ENTRYPOINT ["/order-service"]

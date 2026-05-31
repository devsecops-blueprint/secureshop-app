# ── Stage 1: Build ────────────────────────────────────────────
FROM golang:1.22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /build

# Cache dependency downloads separately from source code
# Docker layer caching: if go.mod/go.sum don't change, this layer is reused
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s -X main.version=$(git describe --tags --always --dirty 2>/dev/null || echo dev)" \
    -o /bin/api-gateway ./cmd/server

# ── Stage 2: Final image ──────────────────────────────────────
FROM scratch

# Bring in TLS certs and timezone data from builder
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /bin/api-gateway /api-gateway

# Non-root: scratch has no users, so we use numeric UID directly
# This satisfies Kyverno policy: containers must not run as root (UID 0)
USER 65534:65534

EXPOSE 8080

# HEALTHCHECK lets Docker and K8s liveness probes work without a shell
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["/api-gateway", "-healthcheck"]

ENTRYPOINT ["/api-gateway"]

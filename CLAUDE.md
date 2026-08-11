# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

SecureShop is a polyglot microservices e-commerce platform built as a DevSecOps reference blueprint. It's the application repo; infrastructure/GitOps lives in the separate `secureshop-infra` repo. The point of this repo is as much the security-hardened CI pipeline as the app itself — expect every service to carry a full SAST/SCA/container-scanning/signing pipeline, not just build+test.

Services (`services/`), each independently built, tested, containerized, and CI-gated by path-filtered workflows:

| Service | Language | Role | Port |
|---|---|---|---|
| `api-gateway` | Go 1.22 | GraphQL edge — the only service the frontend talks to | 8080 (HTTP/GraphQL) |
| `frontend` | React 18 + Vite | SPA, served via Nginx in prod | 3000 |
| `user-service` | Node.js 20 | Auth, JWT issuance, user CRUD | 50051 (gRPC) |
| `product-service` | Python 3.11 | Product catalog | 50051 (gRPC) |
| `order-service` | Go 1.22 | Order placement/lookup | 50051 (gRPC) |
| `payment-service` | Java 21 / Spring Boot 3.3 | Payment processing | 50051 (gRPC) |
| `notification-service` | Python 3.11 | Kafka consumer → notifications (email, etc.) | — (no server, consumer loop) |

## Architecture

**Request flow**: frontend → GraphQL (`api-gateway`) → gRPC → backend services → Postgres (one DB per service: `userdb`/`productdb`/`orderdb`/`paymentdb`). Order and payment events also flow async via Kafka to `notification-service`.

- **api-gateway is the only GraphQL/HTTP entrypoint.** All other services speak gRPC only and are never exposed externally (no ports published in `docker-compose.yml` except `api-gateway:8080` and `frontend:3000`).
- **GraphQL resolvers** (`services/api-gateway/internal/graphql/resolvers.go`) are thin: they translate GraphQL args to protobuf requests and call `Clients.<Service>` (`internal/grpc/clients.go`), which holds one `grpc.ClientConn` per backend. Per-field auth is enforced in resolvers via `userIDFromCtx`, not centrally — the `Auth` middleware only *populates* context from the JWT, it doesn't block unauthenticated requests (GraphQL introspection/login/register must stay public).
- **Middleware chain** (`services/api-gateway/internal/middleware/middleware.go`): `RequestID → Logger → CORS → Auth`, composed via `Chain()` (first arg = outermost). `Auth` validates HMAC JWTs and stashes `user_id`/`user_role` in context; it does not reject missing tokens.
- **Proto files are duplicated, not shared.** Each service that needs a `.proto` (e.g. `orders.proto`, `products.proto`) vendors its own copy under `services/<name>/proto/`, and Go services check in the generated `*.pb.go`/`*_grpc.pb.go` files. There is no shared proto package/module — when changing a message or RPC, update `.proto` **and regenerate** in every service that has a copy (grep for the filename across `services/*/proto/`).
- **Kafka topics**: `order.created` (produced by `order-service`, `services/order-service/internal/kafka/producer.go`) and `payment.processed` (produced by `payment-service`). Both are consumed by `notification-service` (`src/consumers/kafka_consumer.py`), which dispatches by topic name via a handler map. Kafka publish failures are logged and swallowed, never block the originating request (see comment in `producer.go`) — Kafka is best-effort, not transactional.
- **Config is env-var driven everywhere**, with fallback defaults in code (`internal/config/config.go` for Go; `src/config` for Node/Python; `application.properties` for Spring). `docker-compose.yml` at repo root is the source of truth for how services wire together locally (service DNS names, ports, credentials — all dev-only defaults, not for real deployments).
- **payment-service is dialed by api-gateway but not yet wired into GraphQL resolvers/schema** — `Clients.PaymentConn` exists but there's no `Clients.Payments` field or resolver using it yet.

## Common commands

Run all commands from inside the relevant `services/<name>/` directory unless noted.

### Local stack
```bash
docker compose up --build          # from repo root — builds and runs the full stack
docker compose up -d postgres-user postgres-product postgres-order postgres-payment redis kafka zookeeper  # infra only
```

### api-gateway / order-service (Go)
```bash
go build ./...
go test ./...                      # CI runs this; no test files exist yet in either service
go run ./cmd/server
```

### user-service (Node.js)
```bash
npm ci
npm run dev                        # nodemon, auto-reload
npm start                          # node src/index.js
npm test                           # CI runs this; no test script/files defined yet — will fail if invoked
npm audit --audit-level=high       # CI gate; must be clean at HIGH/CRITICAL
```

### product-service / notification-service (Python)
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m src.main                 # entrypoint for both services
```
product-service requires regenerating gRPC stubs from `proto/products.proto` before running outside Docker (the Dockerfile does this as a build step via `grpc_tools.protoc`; locally you must run the equivalent `python -m grpc_tools.protoc -I proto --python_out=src/grpc --grpc_python_out=src/grpc proto/products.proto` yourself — generated files aren't checked in for this service).

### payment-service (Java / Spring Boot)
```bash
./mvnw package -DskipTests         # protobuf-maven-plugin regenerates gRPC classes from src/main/proto during this
./mvnw spring-boot:run
./mvnw test
```

### frontend (React / Vite)
```bash
npm ci
npm run dev                        # Vite dev server
npm run build
npm run preview
```

## CI pipelines

Each service has its own path-filtered workflow (`.github/workflows/ci-<service>.yml`, triggered only when `services/<service>/**` changes) rather than one monolithic pipeline. `ci-api-gateway.yml` and `ci-order-service.yml` (Go) and `ci-user-service.yml` (Node) are fully implemented; `ci-frontend.yml`, `ci-notification-service.yml`, `ci-orchestrator.yml`, `ci-payment-service.yml`, `ci-product-service.yml` are currently empty placeholders — use the implemented ones as the template when filling these in.

The standard stage order (see `ci-api-gateway.yml` for the fullest example) is:

1. **Gitleaks** — secrets scan, hard fail, no `continue-on-error` (runs first/cheapest)
2. **Semgrep** SAST — report-only (`|| true` + `continue-on-error: true`) pending triage, uploaded to the Security tab regardless
3. **SCA** — dedicated tool per ecosystem: `npm audit --audit-level=high` (Node, hard gate) or `pip-audit`/OWASP Dep-Check (Python/Java, per comments); Go has no dedicated SCA step — coverage folded into Trivy/Grype against the built image instead
4. **CodeQL** — for Go, collapsed with the build step (`init` → `go build` → `analyze`) because CodeQL must watch a compiled build; for interpreted languages (Node) it's a standalone stage. Gated on `level=="error"` findings only — warnings are non-blocking.
5. **Docker build**
6. **Image hygiene/scanning** — Hadolint (Dockerfile lint, non-blocking), Dockle (fails only on FATAL, e.g. running as root), Trivy (hard gate on CRITICAL/HIGH), Grype (cross-check, fails only on CRITICAL — deliberately looser than Trivy, different CVE DB)
7. **SBOM** — Syft generates SPDX + CycloneDX, uploaded as a build artifact (90-day retention)
8. **Cosign** — keyless signing (OIDC), SBOM attached as an attestation, signature verified as a sanity check
9. **Push to GHCR** — only on `push` to `develop` (never on PRs), tagged `<sha>` and `develop`

All Dockerfiles are multi-stage, run as non-root (numeric UID for `scratch`-based Go images, dedicated `appuser`/`node` users elsewhere) — this is enforced by Kyverno policy at the cluster level (see comments in Dockerfiles), so don't add `USER root` or drop the non-root user when editing them.

## Branching & commits

Enterprise GitFlow (see `docs/CONTRIBUTING.md`):

- `main` = production, `develop` = integration. Active development happens on `develop`.
- Feature work: branch `feature/*` off `develop`, PR back into `develop`.
- `release/*` branches off `develop`, merges into both `main` and `develop`.
- `hotfix/*` branches off `main`, merges into both `main` and `develop`.
- Commit format: `<type>: <description>` — types are `feat`, `fix`, `chore`, `docs`, `security`, `ci`, `test`.
- **All commits must be GPG signed**; unsigned commits are rejected.

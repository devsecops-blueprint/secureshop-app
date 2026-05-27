# SecureShop — Application Repository

Enterprise-grade DevSecOps polyglot microservices e-commerce platform.

## Architecture
- **7 microservices**: Go, Node.js, Python, Java (Spring), React
- **Communication**: GraphQL (frontend→gateway) + gRPC (internal) + Kafka (async)
- **Security**: Zero-Trust mTLS, SPIFFE/SPIRE, SLSA Level 3, OWASP DevSecOps compliant

## Repository Structure

    services/          # 7 microservices
    tests/             # Integration, E2E (Playwright), performance (k6)
    .github/workflows/ # CI pipelines (Tier 1 + Tier 2)
    docs/              # Application documentation

## Related
- [secureshop-infra](https://github.com/devsecops-blueprint/secureshop-infra) — Infrastructure & GitOps

## Research
EICON 2026 — Track 4: CS, AI & Information Systems

---
*Active development happens on the `develop` branch.*
*See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for the GitFlow workflow.*

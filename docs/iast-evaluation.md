# IAST Evaluation — payment-service

**Date:** August 2026
**Status:** Excluded from CI/CD pipeline (documented decision, not an oversight)

## Why IAST was considered

`payment-service` is the highest-consequence service in SecureShop — it handles
monetary transactions. The original T1 pipeline design (see
`ci-payment-service.yml` design notes) allocated an extra security layer here
beyond what the other 6 services receive: Interactive Application Security
Testing (IAST), on top of the standard SAST (Semgrep + CodeQL) and SCA (OWASP
Dependency-Check) already in place.

IAST instruments a running application and observes real data flow during
test execution — combining SAST's code-level precision with DAST's runtime
realism, which typically produces far fewer false positives than either
approach alone. That made it a natural candidate for the one service where
false negatives carry the highest cost.

## What was evaluated

**Contrast Community Edition (CE)** was the original plan — a free-forever
IAST tool supporting Java, which matched SecureShop's OSS-only, zero-cost,
fully reproducible tooling principle used throughout the rest of the pipeline
(Gitleaks, Semgrep, Trivy, Grype, Syft, Cosign — all free, all self-hosted or
CLI-based, no vendor account required).

Investigating current availability (August 2026) surfaced:

- **Contrast Community Edition reached end-of-life on June 30, 2025.** It is
  no longer offered.
- **Contrast Assess** (the current IAST product) is now sales-gated — the
  public "free trial" signup link redirects to a "Request a Demo" form
  requiring sales contact, not self-serve account creation.
- **Contrast CVE Shield**, a newer free-tier offering (launched August 2026),
  was briefly explored as an alternative. It is **not general-purpose IAST**:
  it detects runtime exploitation attempts against a fixed list of ~60
  already-known, named CVEs (e.g. Log4Shell, Spring4Shell). It does not trace
  application-specific data flow to discover novel vulnerabilities in
  first-party code, which was the actual purpose IAST was meant to serve here.
- **Market survey**: as of a mid-2026 industry review, 0 of 7 actively
  tracked IAST tools are offered free. OWASP's own "Free for Open Source
  Application Security Tools" reference lists Contrast CE as the *only*
  historically free IAST tool — confirming this isn't a gap in research, but
  a genuine gap in the current tooling market.

## Decision

IAST is **excluded from the permanent CI/CD pipeline** for payment-service.

This preserves a principle held consistently across the whole project: every
tool in the pipeline must be free-forever and self-serve, so the blueprint
remains reproducible by anyone who clones the repo, indefinitely, without
depending on a vendor's continued goodwill or a sales relationship. A
sales-gated trial or a narrow CVE-signature tool mislabeled as "IAST" would
have violated that principle without delivering the actual capability IAST
was chosen for.

payment-service's security coverage remains:
- **SAST**: Semgrep (`p/java` + `p/owasp-top-ten`) + CodeQL (`security-extended`)
- **SCA**: OWASP Dependency-Check (CVSS ≥ 8 hard gate)
- **Container/image scanning**: Trivy (CRITICAL/HIGH) + Grype (CRITICAL cross-check)
- **Supply chain integrity**: Syft SBOM + Cosign keyless signing/attestation

## Revisit conditions

This decision should be revisited if any of the following change:
- A genuinely free, self-serve, general-purpose IAST tool emerges in the OSS
  ecosystem
- Contrast (or another vendor) reinstates a self-serve free tier for Assess
- The project's scope shifts to justify a paid tool or a sales relationship

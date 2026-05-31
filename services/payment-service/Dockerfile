# ── Stage 1: Build ────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /build

# Cache dependencies separately from source
COPY pom.xml .
RUN mvn dependency:resolve -q

COPY src/ src/
RUN mvn package -DskipTests -q

# ── Stage 2: Final image ──────────────────────────────────────
# JRE only — not the full JDK. Smaller and fewer attack vectors.
FROM eclipse-temurin:21-jre-alpine

RUN adduser -D -u 1001 appuser

WORKDIR /app

COPY --from=builder /build/target/payment-service-1.0.0.jar app.jar

USER appuser

EXPOSE 50051

# -XX:+UseContainerSupport — JVM reads CPU/memory limits from cgroups
# instead of the host machine. Critical for Kubernetes resource limits.
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-jar", "app.jar"]

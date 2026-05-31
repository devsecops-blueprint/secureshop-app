package com.secureshop.payment.config;

import com.secureshop.payment.grpc.PaymentGrpcService;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.IOException;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class GrpcServerConfig {

    @Value("${grpc.port:50051}")
    private int grpcPort;

    private final PaymentGrpcService paymentGrpcService;
    private Server grpcServer;

    // @PostConstruct runs after Spring has wired all dependencies —
    // safe to start the gRPC server here
    @PostConstruct
    public void startGrpcServer() throws IOException {
        grpcServer = ServerBuilder.forPort(grpcPort)
            .addService(paymentGrpcService)
            .build()
            .start();
        log.info("payment-service gRPC server started on port {}", grpcPort);
    }

    // @PreDestroy runs on SIGTERM — graceful shutdown
    @PreDestroy
    public void stopGrpcServer() {
        if (grpcServer != null) {
            grpcServer.shutdown();
            log.info("payment-service gRPC server stopped");
        }
    }
}

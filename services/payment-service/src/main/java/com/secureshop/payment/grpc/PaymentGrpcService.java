package com.secureshop.payment.grpc;

import com.secureshop.payment.model.Payment;
import com.secureshop.payment.service.PaymentService;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

// PaymentServiceGrpc.PaymentServiceImplBase is generated from payments.proto by Maven.
// We extend it and override the three RPC methods.
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentGrpcService extends PaymentServiceGrpc.PaymentServiceImplBase {

    private final PaymentService paymentService;

    @Override
    public void processPayment(ProcessPaymentRequest request,
                               StreamObserver<PaymentResponse> responseObserver) {
        try {
            Payment payment = paymentService.processPayment(
                request.getOrderId(),
                request.getUserId(),
                request.getAmount(),
                request.getCurrency(),
                request.getPaymentMethod()
            );
            responseObserver.onNext(toProto(payment));
            responseObserver.onCompleted();
        } catch (IllegalStateException e) {
            responseObserver.onError(Status.ALREADY_EXISTS
                .withDescription(e.getMessage()).asRuntimeException());
        } catch (Exception e) {
            log.error("ProcessPayment error", e);
            responseObserver.onError(Status.INTERNAL
                .withDescription("Internal server error").asRuntimeException());
        }
    }

    @Override
    public void getPayment(GetPaymentRequest request,
                           StreamObserver<PaymentResponse> responseObserver) {
        try {
            Payment payment = paymentService.getPayment(request.getPaymentId());
            responseObserver.onNext(toProto(payment));
            responseObserver.onCompleted();
        } catch (IllegalArgumentException e) {
            responseObserver.onError(Status.NOT_FOUND
                .withDescription(e.getMessage()).asRuntimeException());
        } catch (Exception e) {
            log.error("GetPayment error", e);
            responseObserver.onError(Status.INTERNAL
                .withDescription("Internal server error").asRuntimeException());
        }
    }

    @Override
    public void refundPayment(RefundPaymentRequest request,
                              StreamObserver<PaymentResponse> responseObserver) {
        try {
            Payment payment = paymentService.refundPayment(
                request.getPaymentId(),
                request.getReason()
            );
            responseObserver.onNext(toProto(payment));
            responseObserver.onCompleted();
        } catch (IllegalArgumentException e) {
            responseObserver.onError(Status.NOT_FOUND
                .withDescription(e.getMessage()).asRuntimeException());
        } catch (IllegalStateException e) {
            responseObserver.onError(Status.FAILED_PRECONDITION
                .withDescription(e.getMessage()).asRuntimeException());
        } catch (Exception e) {
            log.error("RefundPayment error", e);
            responseObserver.onError(Status.INTERNAL
                .withDescription("Internal server error").asRuntimeException());
        }
    }

    private PaymentResponse toProto(Payment p) {
        return PaymentResponse.newBuilder()
            .setId(p.getId())
            .setOrderId(p.getOrderId())
            .setUserId(p.getUserId())
            .setAmount(p.getAmount())
            .setCurrency(p.getCurrency())
            .setStatus(p.getStatus().name())
            .setCreatedAt(p.getCreatedAt().toString())
            .build();
    }
}

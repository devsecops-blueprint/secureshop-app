package com.secureshop.payment.service;

import com.secureshop.payment.kafka.PaymentEventProducer;
import com.secureshop.payment.model.Payment;
import com.secureshop.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentEventProducer eventProducer;

    @Transactional
    public Payment processPayment(String orderId, String userId,
                                  Double amount, String currency,
                                  String paymentMethod) {

        // Check for duplicate payment on same order
        paymentRepository.findByOrderId(orderId).ifPresent(p -> {
            throw new IllegalStateException("Payment already exists for order " + orderId);
        });

        // In a real system this would call a payment gateway (Stripe, PayPal).
        // For the blueprint we simulate success for all payments.
        Payment payment = Payment.builder()
            .orderId(orderId)
            .userId(userId)
            .amount(amount)
            .currency(currency)
            .paymentMethod(paymentMethod)
            .status(Payment.PaymentStatus.COMPLETED)
            .build();

        payment = paymentRepository.save(payment);
        log.info("Payment processed: {} for order {} amount {}{}", 
                 payment.getId(), orderId, amount, currency);

        // Publish Kafka event
        eventProducer.publishPaymentProcessed(
            payment.getId(), orderId, userId, amount, "COMPLETED"
        );

        return payment;
    }

    public Payment getPayment(String paymentId) {
        return paymentRepository.findById(paymentId)
            .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentId));
    }

    @Transactional
    public Payment refundPayment(String paymentId, String reason) {
        Payment payment = getPayment(paymentId);

        if (payment.getStatus() != Payment.PaymentStatus.COMPLETED) {
            throw new IllegalStateException("Only completed payments can be refunded");
        }

        payment.setStatus(Payment.PaymentStatus.REFUNDED);
        payment = paymentRepository.save(payment);
        log.info("Payment refunded: {} reason: {}", paymentId, reason);

        return payment;
    }
}

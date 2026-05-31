package com.secureshop.payment.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

// @Slf4j generates a logger field automatically — no need to write
// private static final Logger log = LoggerFactory.getLogger(...)
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishPaymentProcessed(String paymentId, String orderId,
                                        String userId, Double amount, String status) {
        Map<String, Object> event = Map.of(
            "payment_id", paymentId,
            "order_id",   orderId,
            "user_id",    userId,
            "amount",     amount,
            "status",     status
        );

        // Same principle as order-service — don't fail the payment if Kafka is down
        try {
            kafkaTemplate.send("payment.processed", paymentId, event);
            log.info("Published payment.processed event for payment {}", paymentId);
        } catch (Exception e) {
            log.warn("Failed to publish payment.processed event: {}", e.getMessage());
        }
    }
}

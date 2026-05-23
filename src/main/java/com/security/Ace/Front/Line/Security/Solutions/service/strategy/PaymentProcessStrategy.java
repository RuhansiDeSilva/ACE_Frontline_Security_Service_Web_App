package com.security.Ace.Front.Line.Security.Solutions.service.strategy;

import com.security.Ace.Front.Line.Security.Solutions.dto.PaymentResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.PaymentUploadRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.PaymentVerificationRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.Payment;

import java.util.List;

/**
 * Strategy interface for payment processing logic.
 * Allows different payment processing implementations (Project vs Source) to coexist.
 */
public interface PaymentProcessStrategy {

    /**
     * Upload payment proof for an invoice
     */
    PaymentResponse uploadPayment(PaymentUploadRequest request);

    /**
     * Verify payment
     */
    PaymentResponse verifyPayment(PaymentVerificationRequest request);

    /**
     * Get all payments
     */
    List<Payment> getAllPayments();

    /**
     * Get payments for a specific client
     */
    List<Payment> getPaymentsByClient(Long clientId);

    /**
     * Get payment by ID
     */
    Payment getPaymentById(Long paymentId);

    /**
     * Get strategy name for logging/debugging
     */
    String getStrategyName();
}

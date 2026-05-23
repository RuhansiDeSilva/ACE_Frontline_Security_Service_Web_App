package com.security.Ace.Front.Line.Security.Solutions.service.strategy.impl;

import com.security.Ace.Front.Line.Security.Solutions.dto.PaymentResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.PaymentUploadRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.PaymentVerificationRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.Payment;
import com.security.Ace.Front.Line.Security.Solutions.repository.PaymentRepository;
import com.security.Ace.Front.Line.Security.Solutions.service.PaymentService;
import com.security.Ace.Front.Line.Security.Solutions.service.strategy.PaymentProcessStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Project Version Implementation of Payment Processing Strategy
 * Uses the existing PaymentService logic from the project.
 */
@Component("projectPaymentStrategy")
@RequiredArgsConstructor
@Slf4j
public class ProjectPaymentServiceImpl implements PaymentProcessStrategy {

    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;

    @Override
    public PaymentResponse uploadPayment(PaymentUploadRequest request) {
        log.info("ProjectPaymentServiceImpl: Uploading payment for invoice ID: {}", request.getInvoiceId());
        return paymentService.uploadPayment(request);
    }

    @Override
    public PaymentResponse verifyPayment(PaymentVerificationRequest request) {
        log.info("ProjectPaymentServiceImpl: Verifying payment ID: {}", request.getPaymentId());
        return paymentService.verifyPayment(request);
    }

    @Override
    public List<Payment> getAllPayments() {
        log.info("ProjectPaymentServiceImpl: Getting all payments");
        return paymentRepository.findAll();
    }

    @Override
    public List<Payment> getPaymentsByClient(Long clientId) {
        log.info("ProjectPaymentServiceImpl: Getting payments for client ID: {}", clientId);
        return paymentRepository.findByClientClientIdOrderByPaymentDateDesc(clientId.intValue());
    }

    @Override
    public Payment getPaymentById(Long paymentId) {
        log.info("ProjectPaymentServiceImpl: Getting payment ID: {}", paymentId);
        return paymentRepository.findById(paymentId.intValue()).orElse(null);
    }

    @Override
    public String getStrategyName() {
        return "PROJECT_PAYMENT_STRATEGY";
    }
}

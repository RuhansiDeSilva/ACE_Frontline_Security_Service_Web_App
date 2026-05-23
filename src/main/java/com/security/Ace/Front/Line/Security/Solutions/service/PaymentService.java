package com.security.Ace.Front.Line.Security.Solutions.service;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.security.Ace.Front.Line.Security.Solutions.dto.PaymentResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.PaymentUploadRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.PaymentVerificationRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.Invoice;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.InvoiceStatus;
import com.security.Ace.Front.Line.Security.Solutions.entity.Payment;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.PaymentMethod;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.VerificationStatus;
import com.security.Ace.Front.Line.Security.Solutions.exception.InvalidOperationException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.InvoiceRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final FileStorageService fileStorageService;
    private final EmailService emailService;
    private final InvoiceService invoiceService;
    private final PdfService pdfService;

    @Transactional
    public PaymentResponse uploadPayment(PaymentUploadRequest request) {
        Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", request.getInvoiceId()));

        // Only ISSUED, PAYMENT_REJECTED, or OVERDUE invoices can receive payment proof
        if (invoice.getStatus() != InvoiceStatus.ISSUED
                && invoice.getStatus() != InvoiceStatus.PAYMENT_REJECTED
                && invoice.getStatus() != InvoiceStatus.OVERDUE) {
            throw new InvalidOperationException(
                    "Payment proof can only be uploaded for ISSUED, PAYMENT_REJECTED, or OVERDUE invoices. " +
                            "Current status: " + invoice.getStatus());
        }

        // Validate file type by reading magic bytes — not trusting client-declared
        // Content-Type
        try (java.io.InputStream is = request.getPaymentProof().getInputStream()) {
            byte[] header = new byte[Math.min(5, (int) request.getPaymentProof().getSize())];
            int read = is.read(header);
            if (read < 3 || !isAllowedFileType(header)) {
                throw new InvalidOperationException("Payment proof must be a valid JPG, PNG, or PDF file.");
            }
        } catch (InvalidOperationException ex) {
            throw ex;
        } catch (java.io.IOException ex) {
            throw new InvalidOperationException("Could not read payment proof to validate file type.");
        }

        String filePath = fileStorageService.storeFile(request.getPaymentProof(), "payment-proofs");

        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setClient(invoice.getClient());
        payment.setAmountPaid(request.getAmountPaid());
        payment.setPaymentDate(request.getPaymentDate());
        payment.setPaymentMethod(PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase()));
        payment.setBankName(request.getBankName());
        payment.setTransactionReference(request.getTransactionReference());
        payment.setPaymentProofPath(filePath);
        payment.setVerificationStatus(VerificationStatus.PENDING);
        payment.setRemarks(request.getRemarks());
        payment.setProofUploadedAt(LocalDateTime.now());

        paymentRepository.save(payment);

        // Update invoice status to PAYMENT_UPLOADED
        invoice.setStatus(InvoiceStatus.PAYMENT_UPLOADED);
        invoiceRepository.save(invoice);

        return mapToResponse(payment);
    }

    @Transactional
    public PaymentResponse verifyPayment(PaymentVerificationRequest request) {
        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", request.getPaymentId()));

        if (payment.getVerificationStatus() != VerificationStatus.PENDING) {
            throw new InvalidOperationException("Only PENDING payments can be verified.");
        }

        VerificationStatus newStatus = VerificationStatus.valueOf(request.getVerificationStatus().toUpperCase());
        payment.setVerificationStatus(newStatus);
        payment.setVerifiedAt(LocalDateTime.now());
        // TODO: set from authenticated accountant's userId via SecurityContextHolder
        payment.setVerifiedBy(1);

        if (newStatus == VerificationStatus.REJECTED) {
            if (request.getRejectionReason() == null || request.getRejectionReason().isBlank()) {
                throw new InvalidOperationException("Rejection reason is required.");
            }
            payment.setRejectionReason(request.getRejectionReason());
        }

        if (request.getRemarks() != null) {
            payment.setRemarks(request.getRemarks());
        }

        paymentRepository.save(payment);

        // Recalculate invoice paid/balance amounts
        invoiceService.recalculateInvoiceTotals(payment.getInvoice().getInvoiceId());

        Invoice invoice = invoiceRepository.findById(payment.getInvoice().getInvoiceId()).orElseThrow();

        if (newStatus == VerificationStatus.VERIFIED) {
            // Mark invoice as PAID if fully settled
            if (invoice.getBalanceAmount().compareTo(BigDecimal.ZERO) <= 0) {
                invoice.setStatus(InvoiceStatus.PAID);
                invoice.setVerifiedAt(LocalDateTime.now());
                invoiceRepository.save(invoice);
            }
            byte[] pdf = pdfService.generateReceiptPdf(payment.getPaymentId());
            emailService.sendPaymentVerifiedEmail(invoice.getClient(), payment, pdf);

        } else if (newStatus == VerificationStatus.REJECTED) {
            // Move invoice back to PAYMENT_REJECTED so client can re-upload
            invoice.setStatus(InvoiceStatus.PAYMENT_REJECTED);
            invoiceRepository.save(invoice);
            emailService.sendPaymentRejectedEmail(invoice.getClient(), payment);
        }

        return mapToResponse(payment);
    }

    /**
     * Accountant waives late fee — reason logged for audit trail.
     */
    @Transactional
    public PaymentResponse waiveLateFee(Integer paymentId, String waiverReason) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        if (waiverReason == null || waiverReason.isBlank()) {
            throw new InvalidOperationException("Waiver reason is required for audit trail.");
        }

        Invoice invoice = payment.getInvoice();
        invoice.setLateFee(BigDecimal.ZERO);
        invoice.setLateFeeApplied(false);
        invoice.setWaivedReason("Late fee waived: " + waiverReason);
        invoiceRepository.save(invoice);

        invoiceService.recalculateInvoiceTotals(invoice.getInvoiceId());
        return mapToResponse(payment);
    }

    /**
     * Detects file type by inspecting the first bytes (magic bytes).
     * Accepted: JPEG (FFD8FF), PNG (89504E47), PDF (%PDF = 25504446).
     */
    private boolean isAllowedFileType(byte[] header) {
        if (header == null || header.length < 3)
            return false;
        // JPEG: FF D8 FF
        if ((header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF)
            return true;
        // PNG: 89 50 4E 47
        if (header.length >= 4
                && (header[0] & 0xFF) == 0x89 && (header[1] & 0xFF) == 0x50
                && (header[2] & 0xFF) == 0x4E && (header[3] & 0xFF) == 0x47)
            return true;
        // PDF: 25 50 44 46 (%PDF)
        if (header.length >= 4
                && (header[0] & 0xFF) == 0x25 && (header[1] & 0xFF) == 0x50
                && (header[2] & 0xFF) == 0x44 && (header[3] & 0xFF) == 0x46)
            return true;
        return false;
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsPendingVerification() {
        return paymentRepository.findPaymentsPendingVerification()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getOverduePayments() {
        return paymentRepository.findOverduePayments()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentLedger(Integer clientId, Integer month,
            Integer year, String status) {
        return paymentRepository.findForLedger(clientId, month, year, status)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByClient(Integer clientId) {
        return paymentRepository.findByClientClientIdOrderByPaymentDateDesc(clientId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByInvoice(Integer invoiceId) {
        return paymentRepository.findByInvoiceInvoiceIdOrderByPaymentDateDesc(invoiceId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Integer paymentId) {
        return mapToResponse(paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId)));
    }

    private PaymentResponse mapToResponse(Payment p) {
        PaymentResponse r = new PaymentResponse();
        r.setPaymentId(p.getPaymentId());
        r.setInvoiceId(p.getInvoice().getInvoiceId());
        r.setInvoiceNumber(p.getInvoice().getInvoiceNumber());
        r.setClientId(p.getClient().getClientId());
        r.setCompanyName(p.getClient().getCompanyName());
        r.setAmountPaid(p.getAmountPaid().doubleValue());
        r.setPaymentDate(p.getPaymentDate());
        r.setPaymentMethod(p.getPaymentMethod().toString());
        r.setTransactionReference(p.getTransactionReference());
        r.setPaymentProofPath(p.getPaymentProofPath());
        r.setVerificationStatus(p.getVerificationStatus().toString());
        r.setRemarks(p.getRemarks());
        r.setRejectionReason(p.getRejectionReason());
        r.setProofUploadedAt(p.getProofUploadedAt());
        r.setVerifiedAt(p.getVerifiedAt());
        r.setVerifiedBy(p.getVerifiedBy());
        if (p.getInvoice() != null) {
            r.setInvoiceTotal(p.getInvoice().getTotalAmount() != null
                    ? p.getInvoice().getTotalAmount().doubleValue()
                    : null);
            r.setInvoiceDueDate(p.getInvoice().getDueDate());
        }
        return r;
    }
}
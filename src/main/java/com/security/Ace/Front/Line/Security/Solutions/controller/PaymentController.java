package com.security.Ace.Front.Line.Security.Solutions.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.security.Ace.Front.Line.Security.Solutions.service.PdfService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.security.Ace.Front.Line.Security.Solutions.dto.ApiResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.PaymentResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.PaymentUploadRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.PaymentVerificationRequest;
import com.security.Ace.Front.Line.Security.Solutions.service.FileStorageService;
import com.security.Ace.Front.Line.Security.Solutions.service.PaymentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final FileStorageService fileStorageService;
    private final PdfService pdfService;

    // ── Client: Upload Payment Proof ─────────────────────────────────────────

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PaymentResponse>> uploadPayment(
            @RequestParam("invoiceId") Integer invoiceId,
            @RequestParam("amountPaid") BigDecimal amountPaid,
            @RequestParam("paymentDate") String paymentDate,
            @RequestParam("paymentMethod") String paymentMethod,
            @RequestParam(value = "bankName", required = false) String bankName,
            @RequestParam(value = "transactionReference", required = false) String transactionReference,
            @RequestParam(value = "remarks", required = false) String remarks,
            @RequestParam("paymentProof") MultipartFile paymentProof) {

        PaymentUploadRequest request = new PaymentUploadRequest();
        request.setInvoiceId(invoiceId);
        request.setAmountPaid(amountPaid);
        request.setPaymentDate(LocalDate.parse(paymentDate));
        request.setPaymentMethod(paymentMethod);
        request.setBankName(bankName);
        request.setTransactionReference(transactionReference);
        request.setRemarks(remarks);
        request.setPaymentProof(paymentProof);

        PaymentResponse response = paymentService.uploadPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment proof uploaded successfully", response));
    }

    // ── Accountant: Verify Payment ───────────────────────────────────────────

    @PutMapping("/verify")
    public ResponseEntity<ApiResponse<PaymentResponse>> verifyPayment(
            @Valid @RequestBody PaymentVerificationRequest request) {
        PaymentResponse updatedPayment = paymentService.verifyPayment(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Payment status updated successfully", updatedPayment));
    }

    /**
     * Accountant waives late fee for a payment — reason logged for audit trail.
     */
    @PutMapping("/{paymentId}/waive-late-fee")
    public ResponseEntity<ApiResponse<PaymentResponse>> waiveLateFee(
            @PathVariable Integer paymentId,
            @RequestParam String waiverReason) {
        PaymentResponse response = paymentService.waiveLateFee(paymentId, waiverReason);
        return ResponseEntity.ok(ApiResponse.success("Late fee waived successfully", response));
    }

    // ── Queries ─────��────────────────────────────────────────────────────────

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPendingPayments() {
        List<PaymentResponse> payments = paymentService.getPaymentsPendingVerification();
        return ResponseEntity.ok(ApiResponse.success("Pending payments retrieved successfully", payments));
    }

    /**
     * Overdue dashboard — all overdue clients with days overdue,
     * original amount, late fee accrued, total now owed.
     */
    @GetMapping("/overdue")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getOverduePayments() {
        List<PaymentResponse> payments = paymentService.getOverduePayments();
        return ResponseEntity.ok(ApiResponse.success("Overdue payments retrieved successfully", payments));
    }

    /**
     * Accountant payment ledger — all invoices across all clients.
     * Supports filtering by clientId, month/year, status.
     */
    @GetMapping("/ledger")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPaymentLedger(
            @RequestParam(required = false) Integer clientId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String status) {
        List<PaymentResponse> ledger = paymentService.getPaymentLedger(clientId, month, year, status);
        return ResponseEntity.ok(ApiResponse.success("Payment ledger retrieved successfully", ledger));
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentById(
            @PathVariable Integer paymentId) {
        PaymentResponse payment = paymentService.getPaymentById(paymentId);
        return ResponseEntity.ok(ApiResponse.success("Payment retrieved successfully", payment));
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPaymentsByClient(
            @PathVariable Integer clientId) {
        List<PaymentResponse> payments = paymentService.getPaymentsByClient(clientId);
        return ResponseEntity.ok(ApiResponse.success("Client payments retrieved successfully", payments));
    }

    @GetMapping("/invoice/{invoiceId}")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPaymentsByInvoice(
            @PathVariable Integer invoiceId) {
        List<PaymentResponse> payments = paymentService.getPaymentsByInvoice(invoiceId);
        return ResponseEntity.ok(ApiResponse.success("Invoice payments retrieved successfully", payments));
    }

    /**
     * GET /api/payments/{paymentId}/proof
     * Serves the payment proof file (JPG/PNG/PDF) stored on disk.
     * Used by the accountant portal to view the uploaded receipt.
     */
    @GetMapping("/{paymentId}/proof")
    public ResponseEntity<Resource> downloadPaymentProof(@PathVariable Integer paymentId) {
        PaymentResponse payment = paymentService.getPaymentById(paymentId);
        if (payment.getPaymentProofPath() == null) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = fileStorageService.loadFileAsResource(payment.getPaymentProofPath());
        String filename = payment.getPaymentProofPath();
        String contentType = "application/octet-stream";
        if (filename.endsWith(".pdf"))  contentType = "application/pdf";
        else if (filename.endsWith(".png"))  contentType = "image/png";
        else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) contentType = "image/jpeg";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"payment-proof-" + paymentId + "\"")
                .body(resource);
    }

    /**
     * GET /api/payments/{paymentId}/receipt
     * Serves the PDF receipt for a specific payment.
     */
    @GetMapping("/{paymentId}/receipt")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable Integer paymentId) {
        byte[] pdfBytes = pdfService.generateReceiptPdf(paymentId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "receipt-" + paymentId + ".pdf");
        headers.setContentLength(pdfBytes.length);

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    /**
     * GET /api/payments
     * Full payment ledger — all payments across all clients (accountant view).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getAllPayments() {
        List<PaymentResponse> payments = paymentService.getPaymentLedger(null, null, null, null);
        return ResponseEntity.ok(ApiResponse.success("All payments retrieved successfully", payments));
    }
}

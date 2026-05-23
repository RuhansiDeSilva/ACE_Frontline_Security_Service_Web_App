package com.security.Ace.Front.Line.Security.Solutions.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.security.Ace.Front.Line.Security.Solutions.service.PdfService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class PdfController {

    private final PdfService pdfService;

    /**
     * GET /api/pdf/invoice/{invoiceId}
     * Returns a downloadable PDF for the given invoice.
     * Used by both the client portal and accountant dashboard.
     */
    @GetMapping("/invoice/{invoiceId}")
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Integer invoiceId) {
        byte[] pdfBytes = pdfService.generateInvoicePdf(invoiceId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData(
                "attachment",
                "invoice-" + invoiceId + ".pdf"
        );
        headers.setContentLength(pdfBytes.length);

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    /**
     * GET /api/pdf/receipt/{paymentId}
     * Returns a downloadable PDF receipt for a given verified payment.
     */
    @GetMapping("/receipt/{paymentId}")
    public ResponseEntity<byte[]> downloadReceiptPdf(@PathVariable Integer paymentId) {
        byte[] pdfBytes = pdfService.generateReceiptPdf(paymentId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData(
                "attachment",
                "receipt-" + paymentId + ".pdf"
        );
        headers.setContentLength(pdfBytes.length);

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
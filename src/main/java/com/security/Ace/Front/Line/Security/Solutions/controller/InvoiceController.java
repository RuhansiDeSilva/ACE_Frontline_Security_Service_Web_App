package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    // ── Create / Generate ────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoice(
            @Valid @RequestBody InvoiceCreateRequest request) {
        InvoiceResponse response = invoiceService.createInvoice(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Invoice created successfully", response));
    }

    /** Manual trigger for admin to generate monthly invoices for all active clients */
    @PostMapping("/generate-monthly")
    public ResponseEntity<ApiResponse<String>> generateMonthlyInvoices(
            @RequestParam int month,
            @RequestParam int year) {
        invoiceService.generateMonthlyInvoices(month, year);
        return ResponseEntity.ok(ApiResponse.success(
                "Monthly invoices generated for " + month + "/" + year, null));
    }

    /** Create a manual invoice from the accountant portal */
    @PostMapping("/manual")
    public ResponseEntity<ApiResponse<InvoiceResponse>> createManualInvoice(
            @RequestBody ManualInvoiceCreateRequest request) {
        InvoiceResponse response = invoiceService.createManualInvoice(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Manual invoice created successfully", response));
    }

    /** Returns all DRAFT + APPROVED invoices for the accountant review queue */
    @GetMapping("/queue")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getInvoiceQueue(
            @RequestParam(required = false) String period) {
        List<InvoiceResponse> invoices = invoiceService.getDraftInvoices();
        return ResponseEntity.ok(ApiResponse.success("Invoice queue retrieved successfully", invoices));
    }

    /** Batch approve-and-issue multiple invoices */
    @PutMapping("/approve-batch")
    public ResponseEntity<ApiResponse<String>> approveBatch(
            @RequestBody Map<String, List<Integer>> request) {
        List<Integer> ids = request.get("ids");
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("No invoice IDs provided"));
        }
        invoiceService.approveBatch(ids);
        return ResponseEntity.ok(ApiResponse.success(
                "Batch approved and issued successfully", null));
    }

    /** Update invoice notes (internal notes visible to accountant/admin only) */
    @PutMapping("/{invoiceId}/notes")
    public ResponseEntity<ApiResponse<InvoiceResponse>> updateInvoiceNotes(
            @PathVariable Integer invoiceId,
            @RequestBody Map<String, String> body) {
        String notes = body.getOrDefault("notes", "");
        InvoiceResponse response = invoiceService.updateInvoiceNotes(invoiceId, notes);
        return ResponseEntity.ok(ApiResponse.success("Invoice notes updated", response));
    }

    // ── State Transitions ────────────────────────────────────────────────────

    /** DRAFT → APPROVED: Accountant reviews and locks the invoice */
    @PutMapping("/{invoiceId}/approve")
    public ResponseEntity<ApiResponse<InvoiceResponse>> approveInvoice(
            @PathVariable Integer invoiceId,
            @RequestParam(required = false, defaultValue = "0") Integer accountantUserId) {
        InvoiceResponse response = invoiceService.approveInvoice(invoiceId, accountantUserId);
        return ResponseEntity.ok(ApiResponse.success("Invoice approved successfully", response));
    }

    /** APPROVED → ISSUED: Accountant issues invoice, PDF generated & emailed to client */
    @PutMapping("/{invoiceId}/issue")
    public ResponseEntity<ApiResponse<InvoiceResponse>> issueInvoice(
            @PathVariable Integer invoiceId) {
        InvoiceResponse response = invoiceService.issueInvoice(invoiceId);
        return ResponseEntity.ok(ApiResponse.success("Invoice issued successfully", response));
    }

    /** Any status → CANCELLED: Admin cancels with reason. Cannot be reinstated. */
    @PutMapping("/{invoiceId}/cancel")
    public ResponseEntity<ApiResponse<InvoiceResponse>> cancelInvoice(
            @PathVariable Integer invoiceId,
            @RequestParam String cancellationReason) {
        InvoiceResponse response = invoiceService.cancelInvoice(invoiceId, cancellationReason);
        return ResponseEntity.ok(ApiResponse.success("Invoice cancelled successfully", response));
    }

    /** Flag invoice as DISPUTED — late fees frozen pending resolution */
    @PutMapping("/{invoiceId}/dispute")
    public ResponseEntity<ApiResponse<InvoiceResponse>> disputeInvoice(
            @PathVariable Integer invoiceId,
            @RequestParam String disputeReason) {
        InvoiceResponse response = invoiceService.disputeInvoice(invoiceId, disputeReason);
        return ResponseEntity.ok(ApiResponse.success("Invoice marked as disputed", response));
    }

    /** Accountant waives outstanding amount — reason logged for audit trail */
    @PutMapping("/{invoiceId}/waive")
    public ResponseEntity<ApiResponse<InvoiceResponse>> waiveInvoice(
            @PathVariable Integer invoiceId,
            @RequestParam String waivedReason,
            @RequestParam Double waivedAmount) {
        InvoiceResponse response = invoiceService.waiveInvoice(invoiceId, waivedReason, waivedAmount);
        return ResponseEntity.ok(ApiResponse.success("Invoice waived successfully", response));
    }

    // ── Queries ──────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getAllInvoices() {
        List<InvoiceResponse> invoices = invoiceService.getAllInvoices();
        return ResponseEntity.ok(ApiResponse.success("Invoices retrieved successfully", invoices));
    }

    /** Returns all DRAFT invoices — used in accountant smart-review queue */
    @GetMapping("/draft")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getDraftInvoices() {
        List<InvoiceResponse> invoices = invoiceService.getDraftInvoices();
        return ResponseEntity.ok(ApiResponse.success("Draft invoices retrieved successfully", invoices));
    }

    @GetMapping("/{invoiceId}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceById(
            @PathVariable Integer invoiceId) {
        InvoiceResponse invoice = invoiceService.getInvoiceById(invoiceId);
        return ResponseEntity.ok(ApiResponse.success("Invoice retrieved successfully", invoice));
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getInvoicesByClient(
            @PathVariable Integer clientId) {
        List<InvoiceResponse> invoices = invoiceService.getInvoicesByClient(clientId);
        return ResponseEntity.ok(ApiResponse.success("Client invoices retrieved successfully", invoices));
    }

    /** Client payment history page — all invoices with status, payment dates, amounts */
    @GetMapping("/client/{clientId}/history")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getClientInvoiceHistory(
            @PathVariable Integer clientId) {
        List<InvoiceResponse> invoices = invoiceService.getClientInvoiceHistory(clientId);
        return ResponseEntity.ok(ApiResponse.success("Invoice history retrieved successfully", invoices));
    }

    @GetMapping("/client/{clientId}/pending")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getPendingInvoicesByClient(
            @PathVariable Integer clientId) {
        List<InvoiceResponse> invoices = invoiceService.getPendingInvoicesByClient(clientId);
        return ResponseEntity.ok(ApiResponse.success("Pending invoices retrieved successfully", invoices));
    }

    @GetMapping("/overdue")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getOverdueInvoices() {
        List<InvoiceResponse> invoices = invoiceService.getOverdueInvoices();
        return ResponseEntity.ok(ApiResponse.success("Overdue invoices retrieved successfully", invoices));
    }

    @DeleteMapping("/{invoiceId}")
    public ResponseEntity<ApiResponse<String>> deleteInvoice(@PathVariable Integer invoiceId) {
        invoiceService.deleteInvoice(invoiceId);
        return ResponseEntity.ok(ApiResponse.success("Invoice deleted successfully", null));
    }

    @PutMapping("/{invoiceId}/recalculate")
    public ResponseEntity<ApiResponse<String>> recalculateInvoice(
            @PathVariable Integer invoiceId) {
        invoiceService.recalculateInvoiceTotals(invoiceId);
        return ResponseEntity.ok(ApiResponse.success("Invoice recalculated successfully", null));
    }
}
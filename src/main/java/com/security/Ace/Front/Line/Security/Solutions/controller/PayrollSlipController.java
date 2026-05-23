package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.ApiResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.PayrollSlipResponse;
import com.security.Ace.Front.Line.Security.Solutions.service.PayrollSlipService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/payroll-slips")
@RequiredArgsConstructor
public class PayrollSlipController {

    private final PayrollSlipService payrollSlipService;

    /**
     * Get all payroll slips for the authenticated user
     */
    @GetMapping("/my-slips")
    public ResponseEntity<ApiResponse<List<PayrollSlipResponse>>> getMySlips(Authentication authentication) {
        List<PayrollSlipResponse> slips = payrollSlipService.getUserSlips(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Payroll slips retrieved", slips));
    }

    /**
     * Get all payroll slips for a specific user (admin access)
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'DIRECTOR', 'ACCOUNTANT', 'CHAIRMAN')")
    public ResponseEntity<ApiResponse<List<PayrollSlipResponse>>> getUserSlips(@PathVariable Long userId) {
        List<PayrollSlipResponse> slips = payrollSlipService.getUserSlipsById(userId);
        return ResponseEntity.ok(ApiResponse.success("User payroll slips retrieved", slips));
    }

    /**
     * Get a specific payroll slip by ID
     */
    @GetMapping("/{slipId}")
    public ResponseEntity<ApiResponse<PayrollSlipResponse>> getSlip(@PathVariable Long slipId) {
        PayrollSlipResponse slip = payrollSlipService.getSlipById(slipId);
        return ResponseEntity.ok(ApiResponse.success("Payroll slip retrieved", slip));
    }

    /**
     * View a payroll slip (marks as viewed)
     */
    @PostMapping("/{slipId}/view")
    public ResponseEntity<ApiResponse<PayrollSlipResponse>> viewSlip(@PathVariable Long slipId) {
        PayrollSlipResponse slip = payrollSlipService.viewSlip(slipId);
        return ResponseEntity.ok(ApiResponse.success("Payroll slip viewed", slip));
    }

    /**
     * Download a payroll slip
     */
    @PostMapping("/{slipId}/download")
    public ResponseEntity<ApiResponse<PayrollSlipResponse>> downloadSlip(@PathVariable Long slipId) {
        PayrollSlipResponse slip = payrollSlipService.downloadSlip(slipId);
        return ResponseEntity.ok(ApiResponse.success("Payroll slip marked as downloaded", slip));
    }

    /**
     * Export payroll slip to Excel
     */
    @GetMapping("/{slipId}/export-excel")
    public void exportSlipToExcel(@PathVariable Long slipId, HttpServletResponse response) throws IOException {
        payrollSlipService.exportSlipToExcel(slipId, response);
    }

    /**
     * Get slips for a specific month
     */
    @GetMapping("/month/{payMonth}")
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'DIRECTOR', 'ACCOUNTANT', 'CHAIRMAN')")
    public ResponseEntity<ApiResponse<List<PayrollSlipResponse>>> getSlipsForMonth(@PathVariable String payMonth) {
        List<PayrollSlipResponse> slips = payrollSlipService.getSlipsForMonth(payMonth);
        return ResponseEntity.ok(ApiResponse.success("Slips for month retrieved", slips));
    }

    /**
     * Get latest payroll slip for authenticated user
     */
    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<PayrollSlipResponse>> getLatestSlip(Authentication authentication) {
        PayrollSlipResponse slip = payrollSlipService.getLatestSlip(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Latest payroll slip retrieved", slip));
    }

    /**
     * Get full payroll slip history for authenticated user
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<PayrollSlipResponse>>> getSlipHistory(Authentication authentication) {
        // Get user from auth, then fetch their history
        // We need to first resolve the user ID
        List<PayrollSlipResponse> slips = payrollSlipService.getUserSlips(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Payroll slip history retrieved", slips));
    }
}

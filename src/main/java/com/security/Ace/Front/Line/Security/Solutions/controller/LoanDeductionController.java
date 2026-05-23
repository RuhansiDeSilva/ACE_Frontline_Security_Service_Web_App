package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.ApiResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.LoanDeduction;
import com.security.Ace.Front.Line.Security.Solutions.service.LoanDeductionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loan-deductions")
@RequiredArgsConstructor
public class LoanDeductionController {

    private final LoanDeductionService loanDeductionService;

    /**
     * Generate deduction schedule for an approved loan.
     * Called after Executive Officer approves a loan.
     */
    @PostMapping("/generate/{loanId}")
    @PreAuthorize("hasAnyRole('EXECUTIVE_OFFICER', 'ACCOUNT_EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<LoanDeduction>>> generateSchedule(@PathVariable Long loanId) {
        List<LoanDeduction> schedule = loanDeductionService.generateSchedule(loanId);
        return ResponseEntity.ok(ApiResponse.success("Deduction schedule generated", schedule));
    }

    /**
     * Get schedule for a specific loan.
     */
    @GetMapping("/loan/{loanId}")
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'EXECUTIVE_OFFICER', 'SECURITY_OFFICER')")
    public ResponseEntity<ApiResponse<List<LoanDeduction>>> getScheduleForLoan(@PathVariable Long loanId) {
        List<LoanDeduction> schedule = loanDeductionService.getScheduleForLoan(loanId);
        return ResponseEntity.ok(ApiResponse.success("Deduction schedule retrieved", schedule));
    }

    /**
     * Get all deductions for the authenticated user (security officer).
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('SECURITY_OFFICER')")
    public ResponseEntity<ApiResponse<List<LoanDeduction>>> getMyDeductions(Authentication authentication) {
        List<LoanDeduction> deductions = loanDeductionService.getDeductionsForUser(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Your deductions retrieved", deductions));
    }

    /**
     * Get all pending deductions across all loans (for accountant).
     */
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'EXECUTIVE_OFFICER')")
    public ResponseEntity<ApiResponse<List<LoanDeduction>>> getAllPendingDeductions() {
        List<LoanDeduction> deductions = loanDeductionService.getAllPendingDeductions();
        return ResponseEntity.ok(ApiResponse.success("Pending deductions retrieved", deductions));
    }

    /**
     * Get pending deductions for a specific month (e.g., "2026-03").
     */
    @GetMapping("/pending/{month}")
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'EXECUTIVE_OFFICER')")
    public ResponseEntity<ApiResponse<List<LoanDeduction>>> getPendingDeductionsForMonth(@PathVariable String month) {
        List<LoanDeduction> deductions = loanDeductionService.getPendingDeductionsForMonth(month);
        return ResponseEntity.ok(ApiResponse.success("Pending deductions for month retrieved", deductions));
    }

    /**
     * Get all deductions (pending + paid) for all loans.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'EXECUTIVE_OFFICER', 'DIRECTOR', 'CHAIRMAN')")
    public ResponseEntity<ApiResponse<List<LoanDeduction>>> getAllDeductions() {
        List<LoanDeduction> deductions = loanDeductionService.getAllDeductions();
        return ResponseEntity.ok(ApiResponse.success("All deductions retrieved", deductions));
    }

    /**
     * Get all deductions (pending + paid) for a specific month.
     * Used by payroll generation page to auto-fill loan deductions.
     */
    @GetMapping("/month/{month}")
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'EXECUTIVE_OFFICER', 'DIRECTOR', 'CHAIRMAN')")
    public ResponseEntity<ApiResponse<List<LoanDeduction>>> getDeductionsForMonth(@PathVariable String month) {
        List<LoanDeduction> deductions = loanDeductionService.getDeductionsForMonth(month);
        return ResponseEntity.ok(ApiResponse.success("Deductions for month retrieved", deductions));
    }

    /**
     * Mark a deduction as paid (accountant processes payroll).
     */
    @PatchMapping("/{id}/pay")
    @PreAuthorize("hasRole('ACCOUNT_EXECUTIVE')")
    public ResponseEntity<ApiResponse<LoanDeduction>> markAsPaid(
            Authentication authentication,
            @PathVariable Long id) {
        LoanDeduction deduction = loanDeductionService.markAsPaid(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Deduction marked as paid", deduction));
    }

    /**
     * Get remaining balance for a loan.
     */
    @GetMapping("/balance/{loanId}")
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'EXECUTIVE_OFFICER', 'SECURITY_OFFICER')")
    public ResponseEntity<ApiResponse<Double>> getRemainingBalance(@PathVariable Long loanId) {
        Double balance = loanDeductionService.getRemainingBalance(loanId);
        return ResponseEntity.ok(ApiResponse.success("Remaining balance retrieved", balance));
    }

    /**
     * Get loan deduction statistics for director dashboard.
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'DIRECTOR', 'CHAIRMAN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLoanStatistics() {
        Map<String, Object> stats = loanDeductionService.getLoanStatistics();
        return ResponseEntity.ok(ApiResponse.success("Loan statistics retrieved", stats));
    }
}

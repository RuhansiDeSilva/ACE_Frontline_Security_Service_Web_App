package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.LoanRequestDto;
import com.security.Ace.Front.Line.Security.Solutions.dto.ReviewRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.ApiResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.LoanRequest;
import com.security.Ace.Front.Line.Security.Solutions.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @PostMapping
    @PreAuthorize("hasRole('SECURITY_OFFICER')")
    public ResponseEntity<ApiResponse<LoanRequest>> requestLoan(
            Authentication authentication,
            @Valid @RequestBody LoanRequestDto dto) {
        LoanRequest loan = loanService.requestLoan(authentication.getName(), dto);
        return ResponseEntity.ok(ApiResponse.success("Loan request submitted", loan));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('SECURITY_OFFICER')")
    public ResponseEntity<ApiResponse<List<LoanRequest>>> getMyLoans(Authentication authentication) {
        List<LoanRequest> loans = loanService.getMyLoans(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Loan history retrieved", loans));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'EXECUTIVE_OFFICER', 'DIRECTOR', 'CHAIRMAN')")
    public ResponseEntity<ApiResponse<List<LoanRequest>>> getAllLoans() {
        List<LoanRequest> loans = loanService.getAllLoans();
        return ResponseEntity.ok(ApiResponse.success("All loans retrieved", loans));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('EXECUTIVE_OFFICER')")
    public ResponseEntity<ApiResponse<List<LoanRequest>>> getPendingLoans() {
        List<LoanRequest> loans = loanService.getPendingLoans();
        return ResponseEntity.ok(ApiResponse.success("Pending loans retrieved", loans));
    }

    @GetMapping("/approved")
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'DIRECTOR', 'CHAIRMAN')")
    public ResponseEntity<ApiResponse<List<LoanRequest>>> getApprovedLoans() {
        List<LoanRequest> loans = loanService.getApprovedLoans();
        return ResponseEntity.ok(ApiResponse.success("Approved loans retrieved", loans));
    }

    @PatchMapping("/{id}/review")
    @PreAuthorize("hasRole('EXECUTIVE_OFFICER')")
    public ResponseEntity<ApiResponse<LoanRequest>> reviewLoan(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody ReviewRequest reviewRequest) {
        LoanRequest loan = loanService.reviewLoan(id, authentication.getName(), reviewRequest);
        return ResponseEntity.ok(ApiResponse.success("Loan reviewed", loan));
    }
}
package com.security.Ace.Front.Line.Security.Solutions.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.security.Ace.Front.Line.Security.Solutions.dto.ApiResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.DeductionRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.DeductionResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.RejectDeductionRequest;
import com.security.Ace.Front.Line.Security.Solutions.service.DeductionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/deductions")
@RequiredArgsConstructor
public class DeductionController {
    
    private final DeductionService deductionService;
    
    @PostMapping
    public ResponseEntity<ApiResponse<DeductionResponse>> createDeduction(
            @Valid @RequestBody DeductionRequest request) {
        
        DeductionResponse response = deductionService.createDeduction(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Deduction created successfully", response));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<DeductionResponse>>> getAllDeductions() {
        List<DeductionResponse> deductions = deductionService.getAllDeductions();
        return ResponseEntity.ok(ApiResponse.success("Deductions retrieved successfully", deductions));
    }
    
    @GetMapping("/{deductionId}")
    public ResponseEntity<ApiResponse<DeductionResponse>> getDeductionById(@PathVariable Integer deductionId) {
        DeductionResponse deduction = deductionService.getDeductionById(deductionId);
        return ResponseEntity.ok(ApiResponse.success("Deduction retrieved successfully", deduction));
    }
    
    @GetMapping("/client/{clientId}")
    public ResponseEntity<ApiResponse<List<DeductionResponse>>> getDeductionsByClient(@PathVariable Integer clientId) {
        List<DeductionResponse> deductions = deductionService.getDeductionsByClient(clientId);
        return ResponseEntity.ok(ApiResponse.success("Client deductions retrieved successfully", deductions));
    }
    
    @GetMapping("/client/{clientId}/unapplied")
    public ResponseEntity<ApiResponse<List<DeductionResponse>>> getUnappliedDeductionsByClient(@PathVariable Integer clientId) {
        List<DeductionResponse> deductions = deductionService.getUnappliedDeductionsByClient(clientId);
        return ResponseEntity.ok(ApiResponse.success("Unapplied deductions retrieved successfully", deductions));
    }
    
    @GetMapping("/client/{clientId}/total-unapplied")
    public ResponseEntity<ApiResponse<Double>> getTotalUnappliedDeductions(@PathVariable Integer clientId) {
        Double total = deductionService.getTotalUnappliedDeductionsForClient(clientId);
        return ResponseEntity.ok(ApiResponse.success("Total unapplied deductions retrieved", total));
    }
    
    @PutMapping("/{deductionId}/approve")
    public ResponseEntity<ApiResponse<DeductionResponse>> approveDeduction(
            @PathVariable Integer deductionId) {
        DeductionResponse response = deductionService.approveDeduction(deductionId);
        return ResponseEntity.ok(ApiResponse.success("Deduction approved successfully", response));
    }

    @PutMapping("/{deductionId}/reject")
    public ResponseEntity<ApiResponse<DeductionResponse>> rejectDeduction(
            @PathVariable Integer deductionId,
            @Valid @RequestBody RejectDeductionRequest request) {
        DeductionResponse response = deductionService.rejectDeduction(deductionId, request.getReason());
        return ResponseEntity.ok(ApiResponse.success("Deduction rejected", response));
    }

    @GetMapping("/pending-approval")
    public ResponseEntity<ApiResponse<List<DeductionResponse>>> getPendingApprovalDeductions() {
        List<DeductionResponse> deductions = deductionService.getPendingApprovalDeductions();
        return ResponseEntity.ok(ApiResponse.success("Pending deductions retrieved", deductions));
    }

    @DeleteMapping("/{deductionId}")
    public ResponseEntity<ApiResponse<String>> deleteDeduction(@PathVariable Integer deductionId) {
        deductionService.deleteDeduction(deductionId);
        return ResponseEntity.ok(ApiResponse.success("Deduction deleted successfully", null));
    }
}

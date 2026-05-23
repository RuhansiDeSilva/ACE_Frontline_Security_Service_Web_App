package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.AdvanceRequestDto;
import com.security.Ace.Front.Line.Security.Solutions.dto.ReviewRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.ApiResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.AdvanceRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.service.AdvanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/advances")
@RequiredArgsConstructor
public class AdvanceController {

    private final AdvanceService advanceService;

    @PostMapping
    @PreAuthorize("hasRole('SECURITY_OFFICER')")
    public ResponseEntity<ApiResponse<AdvanceRequest>> requestAdvance(
            Authentication authentication,
            @Valid @RequestBody AdvanceRequestDto dto) {
        AdvanceRequest advance = advanceService.requestAdvance(authentication.getName(), dto);
        return ResponseEntity.ok(ApiResponse.success("Advance request submitted", advance));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('SECURITY_OFFICER')")
    public ResponseEntity<ApiResponse<List<AdvanceRequest>>> getMyAdvances(Authentication authentication) {
        List<AdvanceRequest> advances = advanceService.getMyAdvances(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Advance history retrieved", advances));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'EXECUTIVE_OFFICER', 'DIRECTOR', 'CHAIRMAN')")
    public ResponseEntity<ApiResponse<List<AdvanceRequest>>> getAllAdvances() {
        List<AdvanceRequest> advances = advanceService.getAllAdvances();
        return ResponseEntity.ok(ApiResponse.success("All advance requests retrieved", advances));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('AREA_MANAGER', 'ACCOUNT_EXECUTIVE', 'EXECUTIVE_OFFICER')")
    public ResponseEntity<ApiResponse<List<AdvanceRequest>>> getPendingAdvances(Authentication authentication) {
        // Area Manager sees only their area's pending advances
        User user = (User) authentication.getPrincipal();
        if ("AREA_MANAGER".equals(user.getRole())) {
            List<AdvanceRequest> advances = advanceService.getPendingAdvancesForArea(user.getAssignedArea());
            return ResponseEntity.ok(ApiResponse.success("Pending advance requests for your area", advances));
        }
        List<AdvanceRequest> advances = advanceService.getPendingAdvances();
        return ResponseEntity.ok(ApiResponse.success("Pending advance requests retrieved", advances));
    }

    @GetMapping("/awaiting-final-review")
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'EXECUTIVE_OFFICER')")
    public ResponseEntity<ApiResponse<List<AdvanceRequest>>> getAwaitingFinalReview() {
        List<AdvanceRequest> advances = advanceService.getAwaitingFinalReview();
        return ResponseEntity.ok(ApiResponse.success("Advances awaiting final review", advances));
    }

    @GetMapping("/approved")
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'DIRECTOR', 'CHAIRMAN')")
    public ResponseEntity<ApiResponse<List<AdvanceRequest>>> getApprovedAdvances() {
        List<AdvanceRequest> advances = advanceService.getApprovedAdvances();
        return ResponseEntity.ok(ApiResponse.success("Approved advances retrieved", advances));
    }

    @GetMapping("/area/{area}")
    @PreAuthorize("hasRole('AREA_MANAGER')")
    public ResponseEntity<ApiResponse<List<AdvanceRequest>>> getAdvancesByArea(@PathVariable String area) {
        List<AdvanceRequest> advances = advanceService.getAdvancesByArea(area);
        return ResponseEntity.ok(ApiResponse.success("Area advances retrieved", advances));
    }

    @PatchMapping("/{id}/area-review")
    @PreAuthorize("hasRole('AREA_MANAGER')")
    public ResponseEntity<ApiResponse<AdvanceRequest>> areaManagerReview(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody ReviewRequest reviewRequest) {
        AdvanceRequest advance = advanceService.areaManagerReview(id, authentication.getName(), reviewRequest);
        return ResponseEntity.ok(ApiResponse.success("Advance reviewed", advance));
    }

    @PatchMapping("/{id}/final-review")
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'EXECUTIVE_OFFICER')")
    public ResponseEntity<ApiResponse<AdvanceRequest>> finalReview(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody ReviewRequest reviewRequest) {
        AdvanceRequest advance = advanceService.finalReview(id, authentication.getName(), reviewRequest);
        return ResponseEntity.ok(ApiResponse.success("Advance finalized", advance));
    }
}
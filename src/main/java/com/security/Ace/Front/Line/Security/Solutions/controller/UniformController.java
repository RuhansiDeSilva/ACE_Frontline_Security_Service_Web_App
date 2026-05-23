package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.ReviewRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.UniformRequestDto;
import com.security.Ace.Front.Line.Security.Solutions.dto.ApiResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.UniformRequest;
import com.security.Ace.Front.Line.Security.Solutions.service.UniformService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/uniforms")
@RequiredArgsConstructor
public class UniformController {
    /**
     *uniform controller

     */
    private final UniformService uniformService;

    @PostMapping
    @PreAuthorize("hasRole('SECURITY_OFFICER')")
    public ResponseEntity<ApiResponse<UniformRequest>> requestUniform(
            Authentication authentication,
            @Valid @RequestBody UniformRequestDto dto) {
        UniformRequest request = uniformService.requestUniform(authentication.getName(), dto);
        return ResponseEntity.ok(ApiResponse.success("Uniform request submitted", request));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('SECURITY_OFFICER')")
    public ResponseEntity<ApiResponse<List<UniformRequest>>> getMyRequests(Authentication authentication) {
        List<UniformRequest> requests = uniformService.getMyRequests(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Uniform request history retrieved", requests));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('EXECUTIVE_OFFICER', 'OPERATION_MANAGER', 'DIRECTOR', 'CHAIRMAN')")
    public ResponseEntity<ApiResponse<List<UniformRequest>>> getAllRequests() {
        List<UniformRequest> requests = uniformService.getAllRequests();
        return ResponseEntity.ok(ApiResponse.success("All uniform requests retrieved", requests));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('EXECUTIVE_OFFICER', 'OPERATION_MANAGER')")
    public ResponseEntity<ApiResponse<List<UniformRequest>>> getPendingRequests() {
        List<UniformRequest> requests = uniformService.getPendingRequests();
        return ResponseEntity.ok(ApiResponse.success("Pending uniform requests retrieved", requests));
    }

    @PatchMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('EXECUTIVE_OFFICER', 'OPERATION_MANAGER')")
    public ResponseEntity<ApiResponse<UniformRequest>> reviewRequest(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody ReviewRequest reviewRequest) {
        UniformRequest request = uniformService.reviewRequest(id, authentication.getName(), reviewRequest);
        return ResponseEntity.ok(ApiResponse.success("Uniform request reviewed", request));
    }
}
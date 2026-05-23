package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.service.OfficerAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/officer-assignments")
@RequiredArgsConstructor
public class OfficerAssignmentController {
    
    private final OfficerAssignmentService officerAssignmentService;
    
    @PostMapping
    public ResponseEntity<ApiResponse<OfficerAssignmentResponse>> assignOfficer(
            @Valid @RequestBody OfficerAssignmentRequest request) {
        
        OfficerAssignmentResponse response = officerAssignmentService.assignOfficer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Officer assigned successfully", response));
    }
    
    @PutMapping("/{assignmentId}")
    public ResponseEntity<ApiResponse<OfficerAssignmentResponse>> updateAssignment(
            @PathVariable Integer assignmentId,
            @Valid @RequestBody OfficerAssignmentRequest request) {
        
        OfficerAssignmentResponse response = officerAssignmentService.updateAssignment(assignmentId, request);
        return ResponseEntity.ok(ApiResponse.success("Assignment updated successfully", response));
    }
    
    @PutMapping("/{assignmentId}/deactivate")
    public ResponseEntity<ApiResponse<String>> deactivateAssignment(@PathVariable Integer assignmentId) {
        officerAssignmentService.deactivateAssignment(assignmentId);
        return ResponseEntity.ok(ApiResponse.success("Assignment deactivated successfully", null));
    }
    
    @GetMapping("/{assignmentId}")
    public ResponseEntity<ApiResponse<OfficerAssignmentResponse>> getAssignmentById(@PathVariable Integer assignmentId) {
        OfficerAssignmentResponse assignment = officerAssignmentService.getAssignmentById(assignmentId);
        return ResponseEntity.ok(ApiResponse.success("Assignment retrieved successfully", assignment));
    }
    
    @GetMapping("/client/{clientId}")
    public ResponseEntity<ApiResponse<List<OfficerAssignmentResponse>>> getAssignmentsByClient(@PathVariable Integer clientId) {
        List<OfficerAssignmentResponse> assignments = officerAssignmentService.getAllAssignmentsByClient(clientId);
        return ResponseEntity.ok(ApiResponse.success("Client assignments retrieved successfully", assignments));
    }
    
    @GetMapping("/client/{clientId}/active")
    public ResponseEntity<ApiResponse<List<OfficerAssignmentResponse>>> getActiveAssignmentsByClient(@PathVariable Integer clientId) {
        List<OfficerAssignmentResponse> assignments = officerAssignmentService.getActiveAssignmentsByClient(clientId);
        return ResponseEntity.ok(ApiResponse.success("Active assignments retrieved successfully", assignments));
    }
    
    @GetMapping("/officer/{officerId}")
    public ResponseEntity<ApiResponse<List<OfficerAssignmentResponse>>> getAssignmentsByOfficer(@PathVariable Integer officerId) {
        List<OfficerAssignmentResponse> assignments = officerAssignmentService.getAssignmentsByOfficer(officerId);
        return ResponseEntity.ok(ApiResponse.success("Officer assignments retrieved successfully", assignments));
    }
    
    @GetMapping("/ending-soon")
    public ResponseEntity<ApiResponse<List<OfficerAssignmentResponse>>> getAssignmentsEndingSoon() {
        List<OfficerAssignmentResponse> assignments = officerAssignmentService.getAssignmentsEndingSoon();
        return ResponseEntity.ok(ApiResponse.success("Assignments ending soon retrieved successfully", assignments));
    }
    
    @GetMapping("/officer/{officerId}/is-assigned")
    public ResponseEntity<ApiResponse<Boolean>> isOfficerAssigned(@PathVariable Integer officerId) {
        boolean isAssigned = officerAssignmentService.isOfficerCurrentlyAssigned(officerId);
        return ResponseEntity.ok(ApiResponse.success("Officer assignment status retrieved", isAssigned));
    }
}

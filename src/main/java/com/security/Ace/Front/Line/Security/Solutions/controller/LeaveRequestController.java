package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.LeaveRequestStatus;
import com.security.Ace.Front.Line.Security.Solutions.service.AuthService;
import com.security.Ace.Front.Line.Security.Solutions.service.LeaveRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;
    private final AuthService authService;

    // --- SECURITY_OFFICER Endpoints ---

    @PostMapping
    @PreAuthorize("hasAnyAuthority('JSO', 'SSO', 'LSO', 'CSO', 'SECURITY_OFFICER')")
    public ResponseEntity<LeaveRequestDTO> createLeaveRequest(
            @RequestBody CreateLeaveRequestDTO dto) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(leaveRequestService.createLeaveRequest(dto, user.getId()));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyAuthority('JSO', 'SSO', 'LSO', 'CSO', 'SECURITY_OFFICER')")
    public ResponseEntity<List<LeaveRequestDTO>> getMyLeaveRequests() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(leaveRequestService.getMyLeaveRequests(user.getId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('JSO', 'SSO', 'LSO', 'CSO', 'SECURITY_OFFICER')")
    public ResponseEntity<Void> deleteLeaveRequest(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        leaveRequestService.deleteLeaveRequest(id, user.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/my/summary")
    @PreAuthorize("hasAnyAuthority('JSO', 'SSO', 'LSO', 'CSO', 'SECURITY_OFFICER')")
    public ResponseEntity<LeaveSummaryDTO> getMyLeaveSummary(
            @RequestParam Integer month,
            @RequestParam Integer year) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(leaveRequestService.getMyLeaveSummary(user.getId(), month, year));
    }

    // --- AREA_MANAGER Endpoints ---

    @GetMapping("/branch")
    @PreAuthorize("hasAuthority('AREA_MANAGER')")
    public ResponseEntity<List<LeaveRequestDTO>> getLeavesForBranch(
            @RequestParam(required = false) LeaveRequestStatus status) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(leaveRequestService.getLeavesForBranch(user.getId(), status));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('AREA_MANAGER')")
    public ResponseEntity<Void> approveLeave(
            @PathVariable Long id) {
        User user = authService.getCurrentUser();
        leaveRequestService.approveLeave(id, user.getId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('AREA_MANAGER')")
    public ResponseEntity<Void> rejectLeave(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        User user = authService.getCurrentUser();
        leaveRequestService.rejectLeave(id, user.getId(), reason);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/affected-shifts")
    @PreAuthorize("hasAuthority('AREA_MANAGER')")
    public ResponseEntity<List<AffectedShiftDTO>> getAffectedShifts(
            @PathVariable Long id) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(leaveRequestService.getAffectedShifts(id, user.getId()));
    }

    @GetMapping("/{id}/eligible-replacements/{assignmentId}")
    @PreAuthorize("hasAuthority('AREA_MANAGER')")
    public ResponseEntity<List<EligibleReplacementDTO>> getEligibleReplacements(
            @PathVariable Long id,
            @PathVariable Long assignmentId) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(leaveRequestService.getEligibleReplacements(id, assignmentId, user.getId()));
    }

    @PutMapping("/{id}/assignments/{assignmentId}/reassign")
    @PreAuthorize("hasAuthority('AREA_MANAGER')")
    public ResponseEntity<Void> reassignShift(
            @PathVariable Long id,
            @PathVariable Long assignmentId,
            @RequestBody ReassignShiftRequestDTO dto) {
        User user = authService.getCurrentUser();
        leaveRequestService.reassignShift(id, assignmentId, dto, user.getId());
        return ResponseEntity.ok().build();
    }
}

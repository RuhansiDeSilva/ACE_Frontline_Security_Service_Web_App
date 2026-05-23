package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.AdminLeaveRequestDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.AdminLeaveSummaryDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.CreateAdminLeaveRequestDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.service.AdminLeaveRequestService;
import com.security.Ace.Front.Line.Security.Solutions.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin-leaves")
@RequiredArgsConstructor
public class AdminLeaveRequestController {

    private final AdminLeaveRequestService adminLeaveRequestService;
    private final AuthService authService;

    private static final List<String> ADMIN_LEAVE_ROLES = List.of(
            "AREA_MANAGER", "OPERATION_MANAGER", "OPERATIONAL_MANAGER", "EXECUTIVE", "EXECUTIVE_OFFICER");

    /** App auth uses {@code X-User-Email}, not Spring Security roles — enforce role from DB here. */
    private static void requireAdminLeaveUser(User user) {
        if (user.getRole() == null || !ADMIN_LEAVE_ROLES.contains(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized for admin leave");
        }
    }

    private static void requireDirector(User user) {
        if (!"DIRECTOR".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Director only");
        }
    }

    // --- Admin Endpoints ---

    @PostMapping
    public ResponseEntity<AdminLeaveRequestDTO> createRequest(@RequestBody CreateAdminLeaveRequestDTO dto) {
        User user = authService.getCurrentUser();
        requireAdminLeaveUser(user);
        return ResponseEntity.ok(adminLeaveRequestService.createRequest(user.getId(), dto));
    }

    @GetMapping("/my")
    public ResponseEntity<List<AdminLeaveRequestDTO>> getMyRequests() {
        User user = authService.getCurrentUser();
        requireAdminLeaveUser(user);
        return ResponseEntity.ok(adminLeaveRequestService.getMyLeaveRequests(user.getId()));
    }

    @GetMapping("/my/summary")
    public ResponseEntity<AdminLeaveSummaryDTO> getMySummary(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {

        if (month == null || year == null) {
            LocalDate now = LocalDate.now();
            month = now.getMonthValue();
            year = now.getYear();
        }

        User user = authService.getCurrentUser();
        requireAdminLeaveUser(user);
        return ResponseEntity.ok(adminLeaveRequestService.getMyLeaveSummary(user.getId(), month, year));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLeave(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        requireAdminLeaveUser(user);
        adminLeaveRequestService.deleteRequest(id, user.getId());
        return ResponseEntity.ok().build();
    }

    // --- Director Endpoints ---

    @GetMapping("/director")
    public ResponseEntity<List<AdminLeaveRequestDTO>> getForDirector(
            @RequestParam(required = false) com.security.Ace.Front.Line.Security.Solutions.entity.enums.AdminLeaveRequestStatus status,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        User user = authService.getCurrentUser();
        requireDirector(user);
        return ResponseEntity.ok(adminLeaveRequestService.getForDirector(status, month, year));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Void> approveLeave(@PathVariable Long id) {
        User director = authService.getCurrentUser();
        requireDirector(director);
        adminLeaveRequestService.approveLeave(id, director.getId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Void> rejectLeave(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        User director = authService.getCurrentUser();
        requireDirector(director);
        adminLeaveRequestService.rejectLeave(id, director.getId(), payload.get("reason"));
        return ResponseEntity.ok().build();
    }
}

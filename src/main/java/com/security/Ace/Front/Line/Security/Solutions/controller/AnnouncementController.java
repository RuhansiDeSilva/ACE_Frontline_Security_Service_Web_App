package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.AnnouncementDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.ApiResponseDTO;
import com.security.Ace.Front.Line.Security.Solutions.service.AnnouncementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    @Autowired
    private AnnouncementService announcementService;

    /**
     * Create announcements for selected interviewer roles after scheduling an interview.
     * Body: { "interviewerRoles": [...], "vacancyTitle": "...", "interviewDate": "2026-03-10",
     *         "interviewTime": "10:00", "interviewLocation": "...", "numberOfInterviewees": 5 }
     */
    @PostMapping("/interview-scheduled")
    @PreAuthorize("hasRole('OPERATIONAL_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<Void>> createInterviewAnnouncements(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) body.get("interviewerRoles");
        String vacancyTitle = (String) body.get("vacancyTitle");
        String dateStr = (String) body.get("interviewDate");
        String timeStr = (String) body.get("interviewTime");
        String location = (String) body.get("interviewLocation");
        int count = body.get("numberOfInterviewees") instanceof Number
                ? ((Number) body.get("numberOfInterviewees")).intValue() : 0;

        LocalDate date = LocalDate.parse(dateStr);
        LocalTime time = LocalTime.parse(timeStr);

        announcementService.createAnnouncements(roles, vacancyTitle, date, time, location, count);
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Announcements created for interviewers"));
    }

    /**
     * Get announcements for a specific role
     */
    @GetMapping("/role/{role}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponseDTO<List<AnnouncementDTO>>> getByRole(@PathVariable String role) {
        List<AnnouncementDTO> list = announcementService.getAnnouncementsByRole(role);
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Announcements retrieved", list));
    }

    /**
     * Get unread count for a role
     */
    @GetMapping("/role/{role}/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponseDTO<Long>> getUnreadCount(@PathVariable String role) {
        long count = announcementService.getUnreadCount(role);
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Unread count", count));
    }

    /**
     * Mark a single announcement as read
     */
    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponseDTO<Void>> markAsRead(@PathVariable Long id) {
        announcementService.markAsRead(id);
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Marked as read"));
    }

    /**
     * Mark all announcements for a role as read
     */
    @PutMapping("/role/{role}/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponseDTO<Void>> markAllAsRead(@PathVariable String role) {
        announcementService.markAllAsRead(role);
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "All marked as read"));
    }
}

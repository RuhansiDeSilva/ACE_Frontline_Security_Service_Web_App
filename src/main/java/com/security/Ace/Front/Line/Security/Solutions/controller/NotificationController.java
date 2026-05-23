package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.ApiResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.NotificationDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.service.AuthService;
import com.security.Ace.Front.Line.Security.Solutions.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthService authService;

    /** Identity via {@code X-User-Email} (same as other APIs); do not require Spring authenticated principal. */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<NotificationDTO>>> getMyNotifications() {
        User user = authService.getCurrentUser();
        List<NotificationDTO> notifs = notificationService.getMyNotifications(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved", notifs));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        notificationService.markAsRead(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
    }
}

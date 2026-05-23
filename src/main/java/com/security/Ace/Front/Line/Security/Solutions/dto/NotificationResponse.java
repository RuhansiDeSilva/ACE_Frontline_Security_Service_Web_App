package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private Long userId;      // null for broadcasts
    private String targetRole; // null for direct/global broadcasts
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
}
/**
 * notification

 */
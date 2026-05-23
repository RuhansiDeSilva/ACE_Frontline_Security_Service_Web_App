package com.security.Ace.Front.Line.Security.Solutions.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationDTO {
    private Long id;
    private String message;
    /** Serialized as {@code isRead} for the frontend */
    @JsonProperty("read")
    private boolean read;
    private LocalDateTime createdAt;
}

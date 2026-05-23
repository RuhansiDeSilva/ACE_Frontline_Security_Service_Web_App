package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.Data;

@Data
public class SendNotificationRequest {
    private Long userId;       // target user id (null for broadcast)
    private String targetRole; // target role (null unless role-broadcast)
    private String message;
}

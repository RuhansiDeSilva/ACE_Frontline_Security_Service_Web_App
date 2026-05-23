package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * Response after successful OTP verification during forgot password flow
 * Returns user details for confirmation before password reset
 */
@Data
@Builder
@AllArgsConstructor
public class OtpVerificationResponse {

    private Long userId;
    private String username;
    private String fullName;
    private String email;
}

package com.security.Ace.Front.Line.Security.Solutions.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request to verify OTP during forgot password flow
 */
@Data
public class OtpVerificationRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "OTP is required")
    private String otp;
}

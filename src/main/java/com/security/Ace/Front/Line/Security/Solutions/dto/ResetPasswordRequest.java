package com.security.Ace.Front.Line.Security.Solutions.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Request to reset password using OTP from forgot password flow
 * Password must be strong: 8+ chars, uppercase, lowercase, number, special char
 */
@Data
public class ResetPasswordRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "OTP is required")
    private String otp;

    @NotBlank(message = "New password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
            message = "Password must contain uppercase, lowercase, number, and special character (@$!%*?&)")
    private String newPassword;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;
}

package com.security.Ace.Front.Line.Security.Solutions.util;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import java.util.regex.Pattern;

/**
 * Utility class for password validation
 * Enforces strong password requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character (@$!%*?&)
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class PasswordValidator {

    private static final String PASSWORD_PATTERN = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
    private static final Pattern pattern = Pattern.compile(PASSWORD_PATTERN);

    /**
     * Validates if password meets strength requirements
     */
    public static boolean isValid(String password) {
        if (password == null || password.isEmpty()) {
            return false;
        }
        return pattern.matcher(password).matches();
    }

    /**
     * Gets validation error message for invalid password
     */
    public static String getValidationError(String password) {
        if (password == null || password.isEmpty()) {
            return "Password cannot be empty";
        }
        if (password.length() < 8) {
            return "Password must be at least 8 characters long";
        }
        if (!password.matches(".*[A-Z].*")) {
            return "Password must contain at least one uppercase letter";
        }
        if (!password.matches(".*[a-z].*")) {
            return "Password must contain at least one lowercase letter";
        }
        if (!password.matches(".*\\d.*")) {
            return "Password must contain at least one digit";
        }
        if (!password.matches(".*[@$!%*?&].*")) {
            return "Password must contain at least one special character (@$!%*?&)";
        }
        return "Password does not meet requirements";
    }
}

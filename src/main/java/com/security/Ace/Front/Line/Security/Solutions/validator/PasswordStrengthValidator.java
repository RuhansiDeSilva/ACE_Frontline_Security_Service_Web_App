package com.security.Ace.Front.Line.Security.Solutions.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class PasswordStrengthValidator implements ConstraintValidator<ValidPasswordStrength, String> {
    
    // Password must contain:
    // - At least 8 characters
    // - At least one uppercase letter
    // - At least one lowercase letter
    // - At least one digit
    // - At least one special character
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
        "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$"
    );

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isEmpty()) {
            return true; // Let @NotBlank handle null/empty validation
        }

        return PASSWORD_PATTERN.matcher(value).matches();
    }
}

package com.security.Ace.Front.Line.Security.Solutions.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class NICNumberValidator implements ConstraintValidator<ValidNICNumber, String> {
    
    // Sri Lankan NIC patterns:
    // Old format: 9 digits followed by X or V (e.g., 123456789X)
    // New format: 12 digits (e.g., 123456789012)
    private static final Pattern NIC_PATTERN = Pattern.compile(
        "^(?:\\d{9}[Xx]|\\d{12})$"
    );

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.trim().isEmpty()) {
            return true; // Let @NotBlank handle null/empty validation
        }

        String cleanedNIC = value.replaceAll("\\s+", "").toUpperCase();
        return NIC_PATTERN.matcher(cleanedNIC).matches();
    }
}

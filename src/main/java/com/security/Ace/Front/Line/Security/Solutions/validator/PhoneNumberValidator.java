package com.security.Ace.Front.Line.Security.Solutions.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class PhoneNumberValidator implements ConstraintValidator<ValidPhoneNumber, String> {
    
    // Sri Lankan phone number patterns:
    // +94 followed by 9 digits (country code format)
    // 0 followed by 9 digits (local format)
    // 7 or 9 followed by 8 digits (mobile, no prefix)
    private static final Pattern PHONE_PATTERN = Pattern.compile(
        "^(?:\\+94|0)?[1-9]\\d{8}$"
    );

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.trim().isEmpty()) {
            return true; // Let @NotBlank handle null/empty validation
        }

        // Remove any whitespace
        String cleanedPhone = value.replaceAll("\\s+", "");
        return PHONE_PATTERN.matcher(cleanedPhone).matches();
    }
}

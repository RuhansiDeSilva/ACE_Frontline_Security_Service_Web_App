package com.security.Ace.Front.Line.Security.Solutions.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class BankAccountValidator implements ConstraintValidator<ValidBankAccount, String> {
    
    // Bank account must be 8-18 numeric digits only
    private static final Pattern BANK_ACCOUNT_PATTERN = Pattern.compile("^\\d{8,18}$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.trim().isEmpty()) {
            return true; // Bank account is optional, let @NotNull/@NotBlank handle required validation
        }

        String cleanedAccount = value.replaceAll("\\s+", "");
        return BANK_ACCOUNT_PATTERN.matcher(cleanedAccount).matches();
    }
}

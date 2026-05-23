package com.security.Ace.Front.Line.Security.Solutions.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = BankAccountValidator.class)
public @interface ValidBankAccount {
    String message() default "Bank account number must be between 8 and 18 digits";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

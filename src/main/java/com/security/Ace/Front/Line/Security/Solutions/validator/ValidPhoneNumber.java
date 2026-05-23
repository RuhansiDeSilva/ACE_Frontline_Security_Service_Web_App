package com.security.Ace.Front.Line.Security.Solutions.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PhoneNumberValidator.class)
public @interface ValidPhoneNumber {
    String message() default "Invalid phone number format. Must be valid Sri Lankan format (+94, 0, or full number)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

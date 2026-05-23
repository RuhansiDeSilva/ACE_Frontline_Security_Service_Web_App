package com.security.Ace.Front.Line.Security.Solutions.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = NICNumberValidator.class)
public @interface ValidNICNumber {
    String message() default "Invalid NIC number format. Must be either 9 digits + letter (old format) or 12 digits (new format)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

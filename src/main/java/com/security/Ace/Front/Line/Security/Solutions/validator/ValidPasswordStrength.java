package com.security.Ace.Front.Line.Security.Solutions.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordStrengthValidator.class)
public @interface ValidPasswordStrength {
    String message() default "Password must be at least 8 characters and contain uppercase letter, lowercase letter, number, and special character";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

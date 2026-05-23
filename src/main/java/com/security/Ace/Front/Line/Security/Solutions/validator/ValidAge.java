package com.security.Ace.Front.Line.Security.Solutions.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = AgeValidator.class)
public @interface ValidAge {
    String message() default "Age must be between 18 and 65 years";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    
    int minAge() default 18;
    int maxAge() default 65;
}

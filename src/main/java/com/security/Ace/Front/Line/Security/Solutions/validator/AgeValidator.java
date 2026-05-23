package com.security.Ace.Front.Line.Security.Solutions.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.time.LocalDate;
import java.time.Period;

public class AgeValidator implements ConstraintValidator<ValidAge, LocalDate> {
    
    private int minAge;
    private int maxAge;

    @Override
    public void initialize(ValidAge annotation) {
        this.minAge = annotation.minAge();
        this.maxAge = annotation.maxAge();
    }

    @Override
    public boolean isValid(LocalDate dateOfBirth, ConstraintValidatorContext context) {
        if (dateOfBirth == null) {
            return true; // Let @NotNull handle null validation
        }

        int age = Period.between(dateOfBirth, LocalDate.now()).getYears();
        return age >= minAge && age <= maxAge;
    }
}

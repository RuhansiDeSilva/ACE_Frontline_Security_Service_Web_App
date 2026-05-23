package com.security.Ace.Front.Line.Security.Solutions.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.security.Ace.Front.Line.Security.Solutions.repository.DeductionRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DeductionAppliedBackfillRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DeductionAppliedBackfillRunner.class);

    private final DeductionRepository deductionRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        try {
            int updated = deductionRepository.markAppliedForLinkedApprovedDeductions();
            if (updated > 0) {
                log.info("Backfilled appliedToInvoice=true for {} linked approved deductions", updated);
            }
        } catch (Exception ex) {
            // Best-effort only; should never block app startup
            log.warn("Deduction appliedToInvoice backfill failed: {}", ex.getMessage());
        }
    }
}

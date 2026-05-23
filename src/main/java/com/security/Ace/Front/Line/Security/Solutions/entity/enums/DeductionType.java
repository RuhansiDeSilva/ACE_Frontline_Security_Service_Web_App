package com.security.Ace.Front.Line.Security.Solutions.entity.enums;

/**
 * Deduction types per AFLSS guide Phase 12.
 *
 * ABSENCE                  — Officer absent without replacement
 * MISCONDUCT               — Reported behavioral issues
 * SLA_BREACH               — Failure to meet service level agreement
 * EQUIPMENT_NON_COMPLIANCE — Equipment or uniform non-compliance
 * CUSTOM                   — Admin enters custom amount and reason
 */
public enum DeductionType {
    ABSENCE,
    MISCONDUCT,
    SLA_BREACH,
    EQUIPMENT_NON_COMPLIANCE,
    CUSTOM
}
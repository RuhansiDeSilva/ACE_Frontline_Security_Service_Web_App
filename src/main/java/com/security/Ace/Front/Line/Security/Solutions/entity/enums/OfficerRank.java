package com.security.Ace.Front.Line.Security.Solutions.entity.enums;

/**
 * OIC — Officer-in-Charge. Higher rate per shift.
 * JSO — Junior Security Officer. Standard rate per shift.
 *
 * Used in AssignedOfficer and in invoice calculation (OIC line vs JSO line).
 */
public enum OfficerRank {
    OIC,
    JSO,
    ENTRY_LEVEL,
    MID_LEVEL,
    SPECIALIZED,
    SUPERVISOR,
}
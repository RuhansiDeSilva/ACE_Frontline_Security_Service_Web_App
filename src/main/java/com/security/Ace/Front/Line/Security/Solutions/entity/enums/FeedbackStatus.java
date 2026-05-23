package com.security.Ace.Front.Line.Security.Solutions.entity.enums;

public enum FeedbackStatus {
    PENDING,      // Just submitted, not yet reviewed
    APPROVED,     // Published (to homepage if displayOnHomepage=true)
    REJECTED,     // Not published, stored internally
    FLAGGED       // ← ADD: inappropriate content — guide Phase 15
}
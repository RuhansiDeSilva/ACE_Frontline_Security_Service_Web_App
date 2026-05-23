package com.security.Ace.Front.Line.Security.Solutions.dto;

public class AdvanceResponseDTO {
    private Long id;
    private OfficerDTO officer;
    private String requestedDate;
    private String reason;
    private Double requestedAmount;
    private String status;
    private String advanceMonth;
    private String paymentDate;
    private boolean deducted;

    public static class OfficerDTO {
        private String fullName;
        private String officerId;

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getOfficerId() {
            return officerId;
        }

        public void setOfficerId(String officerId) {
            this.officerId = officerId;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public OfficerDTO getOfficer() {
        return officer;
    }

    public void setOfficer(OfficerDTO officer) {
        this.officer = officer;
    }

    public String getRequestedDate() {
        return requestedDate;
    }

    public void setRequestedDate(String requestedDate) {
        this.requestedDate = requestedDate;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Double getRequestedAmount() {
        return requestedAmount;
    }

    public void setRequestedAmount(Double requestedAmount) {
        this.requestedAmount = requestedAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAdvanceMonth() {
        return advanceMonth;
    }

    public void setAdvanceMonth(String advanceMonth) {
        this.advanceMonth = advanceMonth;
    }

    public String getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(String paymentDate) {
        this.paymentDate = paymentDate;
    }

    public boolean isDeducted() {
        return deducted;
    }

    public void setDeducted(boolean deducted) {
        this.deducted = deducted;
    }
}


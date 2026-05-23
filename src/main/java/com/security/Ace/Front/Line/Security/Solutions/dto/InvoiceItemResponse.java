package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class InvoiceItemResponse {

    private Integer itemId;
    private String itemType;
    private String description;
    private Double quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;
    private BigDecimal taxPercentage;
}
package com.security.Ace.Front.Line.Security.Solutions.entity;

import java.math.BigDecimal;

import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ItemType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "invoice_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id")
    private Integer itemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 30)
    private ItemType itemType;

    @Column(name = "description", nullable = false, length = 500)
    private String description;

    // Number of shifts (for OIC/JSO) or hours (for OT)
    @Column(name = "quantity", nullable = false)
    private Double quantity;

    // Rate per shift or per hour
    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    // Persisted line total for audit integrity (quantity × unitPrice)
    @Column(name = "line_total", precision = 12, scale = 2)
    private BigDecimal lineTotal = BigDecimal.ZERO;

    @Column(name = "tax_percentage", precision = 5, scale = 2)
    private BigDecimal taxPercentage = BigDecimal.ZERO;
}
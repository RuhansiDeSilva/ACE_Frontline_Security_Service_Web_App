package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.InvoiceItem;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ItemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, Integer> {

    List<InvoiceItem> findByInvoiceInvoiceId(Integer invoiceId);

    List<InvoiceItem> findByInvoiceInvoiceIdAndItemType(Integer invoiceId, ItemType itemType);
}
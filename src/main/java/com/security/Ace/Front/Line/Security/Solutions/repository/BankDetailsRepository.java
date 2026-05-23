package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.BankDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankDetailsRepository extends JpaRepository<BankDetails, Integer> {

    List<BankDetails> findByIsActiveTrueOrderByCreatedAtDesc();

    // Primary active bank account — used for invoice PDF generation
    Optional<BankDetails> findFirstByIsActiveTrueOrderByCreatedAtAsc();

    Optional<BankDetails> findByAccountNumber(String accountNumber);
}
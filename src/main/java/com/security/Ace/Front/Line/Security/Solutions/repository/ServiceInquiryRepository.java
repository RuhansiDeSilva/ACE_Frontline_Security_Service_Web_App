package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.ServiceInquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceInquiryRepository extends JpaRepository<ServiceInquiry, Long> {
    List<ServiceInquiry> findBySentToAdminTrue();
}
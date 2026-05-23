package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.RequestHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequestHistoryRepository extends JpaRepository<RequestHistory, Long> {
    List<RequestHistory> findByInquiryIdAndInquiryTypeOrderByCreatedAtAsc(Long inquiryId, String inquiryType);
    List<RequestHistory> findByInquiryIdOrderByCreatedAtAsc(Long inquiryId);
}

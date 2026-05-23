package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.ClientCompany;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClientCompanyRepository extends JpaRepository<ClientCompany, Long> {
    Optional<ClientCompany> findByCompanyName(String name);
    Optional<ClientCompany> findByCompanyNameIgnoreCase(String name);
    Optional<ClientCompany> findByCompanyNameAndBranch_Id(String name, Long branchId);
}

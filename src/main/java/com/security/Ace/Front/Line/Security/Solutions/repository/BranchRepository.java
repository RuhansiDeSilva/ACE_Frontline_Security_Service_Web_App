package com.security.Ace.Front.Line.Security.Solutions.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.Branch;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
    Optional<Branch> findByBranchName(String branchName);
}
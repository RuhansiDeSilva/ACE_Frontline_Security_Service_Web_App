package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByEmailIn(java.util.Collection<String> emails);
    Optional<User> findByUsername(String username);
    List<User> findByRole(String role);
    List<User> findByRoleIn(List<String> roles);
    List<User> findByRoleAndClient_ClientId(String role, Integer clientId);
    List<User> findByRoleAndBranch_Id(String role, Long branchId);
    List<User> findByRoleAndDesignationAndClient_ClientId(String role, String designation, Integer clientId);
}
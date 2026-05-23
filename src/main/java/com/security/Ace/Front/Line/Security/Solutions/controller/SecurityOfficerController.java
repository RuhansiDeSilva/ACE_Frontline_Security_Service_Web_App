package com.security.Ace.Front.Line.Security.Solutions.controller;
import com.security.Ace.Front.Line.Security.Solutions.entity.SecurityOfficer;
import com.security.Ace.Front.Line.Security.Solutions.repository.SecurityOfficerRepository;
//import com.lk.security.management.Project.entity.DTO.AttendanceDTO;
//import lk.acefrontline.model.SecurityOfficer;
//import lk.acefrontline.repository.SecurityOfficerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/security-officers")
public class SecurityOfficerController {

    @Autowired
    private SecurityOfficerRepository securityOfficerRepository;

    @GetMapping
    public ResponseEntity<List<SecurityOfficer>> getAllOfficers() {
        return ResponseEntity.ok(securityOfficerRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SecurityOfficer> getOfficerById(@PathVariable Long id) {
        return securityOfficerRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<SecurityOfficer>> getOfficersByManager(@PathVariable Long managerId) {
        return ResponseEntity.ok(securityOfficerRepository.findActiveOfficersByManager(managerId));
    }

    @GetMapping("/manager/{managerId}/companies")
    public ResponseEntity<List<String>> getCompaniesByManager(@PathVariable Long managerId) {
        return ResponseEntity.ok(securityOfficerRepository.findDistinctCompaniesByManager(managerId));
    }

    @GetMapping("/manager/{managerId}/by-company")
    public ResponseEntity<List<SecurityOfficer>> getOfficersByManagerAndCompany(
            @PathVariable Long managerId,
            @RequestParam String companyName) {
        return ResponseEntity.ok(
                securityOfficerRepository.findActiveByManagerAndCompany(managerId, companyName)
        );
    }
}


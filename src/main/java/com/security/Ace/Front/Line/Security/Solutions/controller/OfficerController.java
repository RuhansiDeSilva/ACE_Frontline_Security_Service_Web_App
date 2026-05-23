package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/officers")
public class OfficerController {

    private static final String SECURITY_OFFICER_ROLE = "SECURITY_OFFICER";

    private final UserRepository userRepository;

    public OfficerController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/list")
    public ResponseEntity<?> getAllOfficers() {
        try {
            List<java.util.Map<String, Object>> officers = userRepository.findByRole(SECURITY_OFFICER_ROLE).stream()
                .map(u -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", u.getId());
                    map.put("fullName", u.getFullName());
                    map.put("role", u.getRole());
                    map.put("designation", u.getDesignation());
                    map.put("assignedCompany", u.getAssignedCompany());
                    map.put("bankAccountNumber", u.getBankAccountNumber());
                    map.put("bankName", u.getBankName());
                    map.put("bankBranch", u.getBankBranch());
                    map.put("basicSalary", u.getBasicSalary());
                    return map;
                })
                .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(officers);
        } catch (Exception e) {
            String trace = java.util.Arrays.stream(e.getStackTrace())
                                .map(StackTraceElement::toString)
                                .collect(java.util.stream.Collectors.joining("\n"));
            return ResponseEntity.status(500).body("Error: " + e.getMessage() + "\nTrace:\n" + trace);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getOfficerDetails(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

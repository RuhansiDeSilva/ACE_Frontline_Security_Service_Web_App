package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.UserInfoDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.Client;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.repository.ClientRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;

    @GetMapping("/{id}")
    public ResponseEntity<UserInfoDTO> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Integer clientId = null;
        String clientName = null;

        // Resolve client from active model using assignedCompany
        if (user.getAssignedCompany() != null && !user.getAssignedCompany().isBlank()) {
            Optional<Client> client = clientRepository.findByCompanyNameIgnoreCase(user.getAssignedCompany().trim());
            if (client.isPresent()) {
                clientId = client.get().getClientId();
                clientName = client.get().getCompanyName();
            }
        }

        UserInfoDTO dto = new UserInfoDTO(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getDesignation(),
                clientId,
                clientName,
                user.getBranch() != null ? user.getBranch().getId() : null,
                user.getBranch() != null ? user.getBranch().getBranchName() : null
        );

        return ResponseEntity.ok(dto);
    }
}
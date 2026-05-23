package com.security.Ace.Front.Line.Security.Solutions.service;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.concurrent.CompletableFuture;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.security.Ace.Front.Line.Security.Solutions.dto.ClientLoginRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.ClientLoginResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.Client;
import com.security.Ace.Front.Line.Security.Solutions.exception.AuthenticationException;
import com.security.Ace.Front.Line.Security.Solutions.repository.ClientRepository;
import com.security.Ace.Front.Line.Security.Solutions.util.JwtUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ClientAuthService {

        private final ClientRepository clientRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtUtil jwtUtil;
        private final EmailService emailService;

    @Transactional
    public ClientLoginResponse login(ClientLoginRequest request) {

        Client client = clientRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AuthenticationException("Invalid credentials"));

                boolean passwordMatches = false;
                String stored = client.getPasswordHash();

                // Preferred secure check for bcrypt hashes
                if (isBcryptHash(stored) && passwordEncoder.matches(request.getPassword(), stored)) {
                        passwordMatches = true;
                }
                // Legacy compatibility: if old plain-text password is stored, allow once and upgrade
                else if (stored != null && stored.equals(request.getPassword())) {
                        client.setPasswordHash(passwordEncoder.encode(request.getPassword()));
                        passwordMatches = true;
                }

                if (!passwordMatches) {
            throw new AuthenticationException("Invalid credentials");
        }

        // ── Status checks ─────────────────────────────────────────────────────
        switch (client.getStatus()) {
            case SUSPENDED  -> throw new AuthenticationException(
                    "Your account has been suspended. Please contact Ace Front Line Security.");
            case TERMINATED -> throw new AuthenticationException(
                    "Your account has been terminated.");
            case EXPIRED    -> throw new AuthenticationException(
                    "Your contract has expired. Please contact us to renew your service.");
            default         -> { /* ACTIVE — continue */ }
        }

        // ── Update last login ─────────────────────────────────────────────────
        client.setLastLoginAt(LocalDateTime.now());
        clientRepository.save(client);

        // ── Generate JWT — subject = "CLIENT:<clientId>" ──────────────────────
        String token = jwtUtil.generateClientToken(client.getClientId(), "CLIENT");

        return new ClientLoginResponse(
                "Login successful",
                "CLIENT",
                "/client/dashboard",
                token,
                client.getClientId(),
                client.getCompanyName(),
                client.getIsFirstLogin()
        );
    }

        @Transactional
        public void sendTemporaryPassword(String username) {
                Client client = clientRepository.findByUsername(username)
                                .orElseThrow(() -> new AuthenticationException("No client account found for that username."));

                String tempPassword = generateRandomPassword();
                client.setPasswordHash(passwordEncoder.encode(tempPassword));
                client.setIsFirstLogin(true);
                client.setUpdatedAt(LocalDateTime.now());
                clientRepository.save(client);

                CompletableFuture.runAsync(() -> emailService.sendClientPasswordResetEmail(client, tempPassword));
        }

        private String generateRandomPassword() {
                String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
                Random random = new Random();
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < 10; i++) {
                        sb.append(chars.charAt(random.nextInt(chars.length())));
                }
                return sb.toString();
        }

        private boolean isBcryptHash(String value) {
                return value != null && (value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$"));
        }
}
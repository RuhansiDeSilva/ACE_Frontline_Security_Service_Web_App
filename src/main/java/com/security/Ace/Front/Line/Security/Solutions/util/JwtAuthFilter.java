package com.security.Ace.Front.Line.Security.Solutions.util;

import com.security.Ace.Front.Line.Security.Solutions.repository.ClientRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT Authentication Filter — runs once per request.
 *
 * Handles two principal types:
 *   1. Staff users  (User entity)   — role prefix: ROLE_  e.g. ROLE_ACCOUNTANT
 *   2. Client users (Client entity) — role: ROLE_CLIENT
 *
 * Token format expected in header:
 *   Authorization: Bearer <jwt_token>
 *
 * Token subject format:
 *   Staff:  email      e.g. "accountant@ace.com"
 *   Client: "CLIENT:<clientId>"  e.g. "CLIENT:7"
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // No Authorization header — skip, let Spring Security handle as anonymous
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        // Validate token — if invalid/expired, reject immediately
        if (!jwtUtil.isTokenValid(jwt)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\":false,\"message\":\"Invalid or expired token\",\"data\":null}");
            return;
        }

        final String subject = jwtUtil.extractSubject(jwt);

        // Skip if authentication is already set in this request's context
        if (subject == null || SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        if (subject.startsWith("CLIENT:")) {
            // ── Client authentication ────────────────────────────────────────
            authenticateClient(subject, request);
        } else {
            // ── Staff authentication ─────────────────────────────────────────
            authenticateStaff(subject, request);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Authenticates a staff user (User entity) by their email or username (JWT subject).
     * Grants authority: ROLE_<ROLE> e.g. ROLE_ACCOUNTANT, ROLE_OPERATIONAL_MANAGER
     */
    private void authenticateStaff(String subject, HttpServletRequest request) {
        // Try email first (if contains @), otherwise try username
        var userOpt = subject.contains("@")
                ? userRepository.findByEmail(subject)
                : userRepository.findByUsername(subject);

        userOpt.ifPresent(user -> {

            // Reject disabled staff accounts
            if (Boolean.FALSE.equals(user.getIsActive())) {
                return;
            }

            List<SimpleGrantedAuthority> authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_" + user.getRole())
            );

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(user, null, authorities);
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authToken);
        });
    }

    /**
     * Authenticates a client user (Client entity) by their clientId (JWT subject = "CLIENT:<id>").
     * Grants authority: ROLE_CLIENT
     */
    private void authenticateClient(String subject, HttpServletRequest request) {
        try {
            Integer clientId = Integer.parseInt(subject.substring(7)); // "CLIENT:7" → 7

            clientRepository.findById(clientId).ifPresent(client -> {

                // Reject suspended, terminated, or expired client accounts
                switch (client.getStatus()) {
                    case SUSPENDED:
                    case TERMINATED:
                    case EXPIRED:
                        return;
                    default:
                        break;
                }

                List<SimpleGrantedAuthority> authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_CLIENT")
                );

                // Principal is the Client entity — service layer can cast and read clientId
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(client, null, authorities);
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authToken);
            });

        } catch (NumberFormatException e) {
            // Malformed subject — do not authenticate
            logger.warn("Malformed client JWT subject: " + subject);
        }
    }
}
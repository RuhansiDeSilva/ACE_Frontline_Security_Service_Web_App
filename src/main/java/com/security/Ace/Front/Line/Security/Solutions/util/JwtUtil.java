package com.security.Ace.Front.Line.Security.Solutions.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms:86400000}")
    private long expirationMs;

    // ── Token Generation ─────────────────────────────────────────────────────

    /** Staff token — subject = email */
    public String generateStaffToken(String email, String role) {
        return buildToken(email, role);
    }

    /** Client token — subject = "CLIENT:<clientId>" */
    public String generateClientToken(Integer clientId, String role) {
        return buildToken("CLIENT:" + clientId, role);
    }

    /** Generic — kept for backwards compatibility */
    public String generateToken(String subject, String role) {
        return buildToken(subject, role);
    }

    // ── Token Validation ─────────────────────────────────────────────────────

    public boolean isTokenValid(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String extractSubject(String token) {
        try {
            return getClaims(token).getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    public String extractRole(String token) {
        try {
            return getClaims(token).get("role", String.class);
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    public Date extractExpiration(String token) {
        return getClaims(token).getExpiration();
    }

    // ── Private Helpers ──────────────────────────────────────────────────────

    private String buildToken(String subject, String role) {
        Date now    = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .setSubject(subject)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
}
package edu.hcmute.peergradehub.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.hcmute.peergradehub.entity.User;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class JwtTokenProvider {

    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;
    private final String secret;
    private final long expirationMs;
    private final long rememberMeExpirationMs;
    private byte[] secretBytes;

    public JwtTokenProvider(
            ObjectMapper objectMapper,
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs,
            @Value("${app.jwt.remember-me-expiration-ms:${app.jwt.expiration-ms}}") long rememberMeExpirationMs
    ) {
        this.objectMapper = objectMapper;
        this.secret = secret;
        this.expirationMs = expirationMs;
        this.rememberMeExpirationMs = rememberMeExpirationMs;
    }

    @PostConstruct
    void initialize() {
        this.secretBytes = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String generateToken(User user, boolean rememberMe) {
        long now = Instant.now().toEpochMilli();
        long expiresAt = now + getExpirationMs(rememberMe);

        Map<String, Object> header = new LinkedHashMap<>();
        header.put("alg", "HS256");
        header.put("typ", "JWT");

        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("sub", user.getUsername());
        claims.put("userId", user.getId());
        claims.put("email", user.getEmail());
        claims.put("role", user.getUserRole().name());
        claims.put("iat", now / 1000);
        claims.put("exp", expiresAt / 1000);

        String headerPayload = encodeJson(header) + "." + encodeJson(claims);
        return headerPayload + "." + sign(headerPayload);
    }

    public boolean validateToken(String token) {
        try {
            String[] parts = splitToken(token);
            String headerPayload = parts[0] + "." + parts[1];
            if (!constantTimeEquals(sign(headerPayload), parts[2])) {
                return false;
            }

            Map<String, Object> claims = decodeJson(parts[1]);
            Number expiration = (Number) claims.get("exp");
            return expiration != null && Instant.now().getEpochSecond() < expiration.longValue();
        } catch (RuntimeException exception) {
            return false;
        }
    }

    public String getUsername(String token) {
        Map<String, Object> claims = decodeJson(splitToken(token)[1]);
        Object subject = claims.get("sub");
        if (subject == null) {
            throw new IllegalArgumentException("JWT subject is missing.");
        }
        return subject.toString();
    }

    public long getExpirationMs(boolean rememberMe) {
        return rememberMe ? rememberMeExpirationMs : expirationMs;
    }

    private String encodeJson(Map<String, Object> value) {
        try {
            return base64UrlEncode(objectMapper.writeValueAsBytes(value));
        } catch (Exception exception) {
            throw new IllegalStateException("Could not write JWT JSON.", exception);
        }
    }

    private Map<String, Object> decodeJson(String value) {
        try {
            return objectMapper.readValue(Base64.getUrlDecoder().decode(value), MAP_TYPE);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Could not read JWT JSON.", exception);
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(secretBytes, HMAC_SHA256));
            return base64UrlEncode(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Could not sign JWT.", exception);
        }
    }

    private String[] splitToken(String token) {
        if (token == null) {
            throw new IllegalArgumentException("JWT is missing.");
        }
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("JWT must have three parts.");
        }
        return parts;
    }

    private String base64UrlEncode(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private boolean constantTimeEquals(String left, String right) {
        return MessageDigestUtils.constantTimeEquals(left.getBytes(StandardCharsets.UTF_8), right.getBytes(StandardCharsets.UTF_8));
    }

    private static final class MessageDigestUtils {
        private MessageDigestUtils() {
        }

        private static boolean constantTimeEquals(byte[] left, byte[] right) {
            if (left.length != right.length) {
                return false;
            }
            int result = 0;
            for (int i = 0; i < left.length; i++) {
                result |= left[i] ^ right[i];
            }
            return result == 0;
        }
    }
}

package edu.hcmute.peergradehub.dto.response.auth;

public record LoginResponse(
        String token,
        String tokenType,
        long expiresIn,
        CurrentUserResponse user,
        String dashboardPath
) {
}

package edu.hcmute.peergradehub.dto.request.auth;

public record LoginRequest(
        String usernameOrEmail,
        String password,
        Boolean rememberMe
) {

    public boolean rememberMeOrDefault() {
        return Boolean.TRUE.equals(rememberMe);
    }
}

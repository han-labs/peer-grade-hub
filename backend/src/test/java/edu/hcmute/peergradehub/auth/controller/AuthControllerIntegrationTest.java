package edu.hcmute.peergradehub.auth.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.hcmute.peergradehub.dao.UserDao;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.UserStatus;
import edu.hcmute.peergradehub.exception.ErrorCode;
import edu.hcmute.peergradehub.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.blankOrNullString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserDao userDao;

    @Test
    void login_IsPublic_AndReturnsJwtToken() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "usernameOrEmail": "student01",
                                  "password": "Student@123",
                                  "rememberMe": false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Login successful."))
                .andExpect(jsonPath("$.data.token", not(blankOrNullString())))
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.expiresIn").value(86400000))
                .andExpect(jsonPath("$.data.user.username").value("student01"))
                .andExpect(jsonPath("$.data.user.role").value("STUDENT"));
    }

    @Test
    void login_WithRememberMe_ReturnsLongerExpiration() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "usernameOrEmail": "student01",
                                  "password": "Student@123",
                                  "rememberMe": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.expiresIn").value(604800000));
    }

    @Test
    void login_ByEmail_ReturnsJwtToken() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "usernameOrEmail": "lecturer01@peergrade.test",
                                  "password": "Lecturer@123",
                                  "rememberMe": false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token", not(blankOrNullString())))
                .andExpect(jsonPath("$.data.user.username").value("lecturer01"))
                .andExpect(jsonPath("$.data.user.role").value("LECTURER"));
    }

    @Test
    void login_MissingCredentials_ReturnsExactMessage() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "usernameOrEmail": "",
                                  "password": ""
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(AuthServiceImpl.MISSING_CREDENTIALS_MESSAGE));
    }

    @Test
    void login_InvalidPassword_ReturnsExactMessage() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "usernameOrEmail": "student01",
                                  "password": "wrong"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(AuthServiceImpl.INVALID_CREDENTIALS_MESSAGE));
    }

    @Test
    void login_WhenAccountLocked_ReturnsExactForbiddenMessage() throws Exception {
        User student = userDao.findByUsername("student01").orElseThrow();
        UserStatus originalStatus = student.getStatus();

        try {
            student.setStatus(UserStatus.LOCKED);
            userDao.saveAndFlush(student);

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "usernameOrEmail": "student01",
                                      "password": "Student@123"
                                    }
                                    """))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value(ErrorCode.FORBIDDEN.getCode()))
                    .andExpect(jsonPath("$.message").value(AuthServiceImpl.LOCKED_OR_INACTIVE_MESSAGE));
        } finally {
            student.setStatus(originalStatus);
            userDao.saveAndFlush(student);
        }
    }

    @Test
    void me_WithBearerToken_ReturnsCurrentUser() throws Exception {
        String token = loginAndGetToken("admin01", "Admin@123");

        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("admin01"))
                .andExpect(jsonPath("$.data.role").value("ADMINISTRATOR"));
    }

    @Test
    void me_WithoutToken_ReturnsJsonUnauthorizedError() throws Exception {
        assertUnauthorizedJson(mockMvc.perform(get("/auth/me")));
    }

    @Test
    void me_WithInvalidToken_ReturnsJsonUnauthorizedError() throws Exception {
        String validToken = loginAndGetToken("student01", "Student@123");
        String invalidToken = validToken.substring(0, validToken.length() - 1) + "x";

        assertUnauthorizedJson(mockMvc.perform(get("/auth/me")
                .header("Authorization", "Bearer " + invalidToken)));
    }

    @Test
    void me_WithMalformedToken_ReturnsJsonUnauthorizedError() throws Exception {
        assertUnauthorizedJson(mockMvc.perform(get("/auth/me")
                .header("Authorization", "Bearer malformed-token")));
    }

    @Test
    void me_WithTokenIssuedBeforeAccountLocked_ReturnsJsonUnauthorizedError() throws Exception {
        assertStatusChangeRejectsExistingToken(UserStatus.LOCKED);
    }

    @Test
    void me_WithTokenIssuedBeforeAccountInactive_ReturnsJsonUnauthorizedError() throws Exception {
        assertStatusChangeRejectsExistingToken(UserStatus.INACTIVE);
    }

    private String loginAndGetToken(String usernameOrEmail, String password) throws Exception {
        String loginResponse = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginPayload(usernameOrEmail, password, false))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode responseJson = objectMapper.readTree(loginResponse);
        return responseJson.path("data").path("token").asText();
    }

    private void assertStatusChangeRejectsExistingToken(UserStatus changedStatus) throws Exception {
        String token = loginAndGetToken("student01", "Student@123");
        User student = userDao.findByUsername("student01").orElseThrow();
        UserStatus originalStatus = student.getStatus();

        try {
            student.setStatus(changedStatus);
            userDao.saveAndFlush(student);

            assertUnauthorizedJson(mockMvc.perform(get("/auth/me")
                    .header("Authorization", "Bearer " + token)));
        } finally {
            student.setStatus(originalStatus);
            userDao.saveAndFlush(student);
        }
    }

    private void assertUnauthorizedJson(org.springframework.test.web.servlet.ResultActions result) throws Exception {
        result.andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(ErrorCode.UNAUTHORIZED.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.UNAUTHORIZED.getDefaultMessage()))
                .andExpect(jsonPath("$.path").value("/auth/me"));
    }

    private record LoginPayload(String usernameOrEmail, String password, boolean rememberMe) {
    }
}

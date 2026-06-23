package edu.hcmute.peergradehub.peerreview.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.hcmute.peergradehub.dao.*;
import edu.hcmute.peergradehub.entity.*;
import edu.hcmute.peergradehub.enumeration.GroupStatus;
import edu.hcmute.peergradehub.enumeration.ReviewAssignmentStatus;
import edu.hcmute.peergradehub.enumeration.SubmissionStatus;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.enumeration.UserStatus;
import edu.hcmute.peergradehub.exception.ErrorCode;
import edu.hcmute.peergradehub.service.impl.PeerReviewServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PeerReviewControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserDao userDao;

    @Autowired
    private CourseDao courseDao;

    @Autowired
    private LessonDao lessonDao;

    @Autowired
    private AssignmentDao assignmentDao;

    @Autowired
    private StudentGroupDao studentGroupDao;

    @Autowired
    private GroupMemberDao groupMemberDao;

    @Autowired
    private AssignmentSubmissionDao assignmentSubmissionDao;

    @Autowired
    private PeerReviewAssignmentDao peerReviewAssignmentDao;

    @Autowired
    private PeerReviewDao peerReviewDao;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User student;
    private User lecturer;
    private Course course;
    private Assignment assignment;
    private StudentGroup reviewerGroup;
    private StudentGroup revieweeGroup;
    private PeerReviewAssignment reviewAssignment;
    private AssignmentSubmission submission;

    @BeforeEach
    void setUp() {
        student = userDao.findByUsername("student01").orElseThrow();
        lecturer = userDao.findByUsername("lecturer01").orElseThrow();

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        course = courseDao.save(Course.builder()
                .courseName("Integration Test Course")
                .classCode("INT-" + suffix)
                .semester("2026-1")
                .lecturer(lecturer)
                .build());

        Lesson lesson = lessonDao.save(Lesson.builder()
                .title("Peer Review Module")
                .course(course)
                .build());

        assignment = assignmentDao.save(Assignment.builder()
                .title("Peer Review Task")
                .description("Please review target submission.")
                .submissionDeadline(LocalDateTime.now().minusDays(1))
                .reviewDeadline(LocalDateTime.now().plusDays(3))
                .lesson(lesson)
                .build());

        reviewerGroup = studentGroupDao.save(StudentGroup.builder()
                .groupName("Reviewers")
                .maxMembers(5)
                .course(course)
                .groupStatus(GroupStatus.READY)
                .build());

        revieweeGroup = studentGroupDao.save(StudentGroup.builder()
                .groupName("Reviewees")
                .maxMembers(5)
                .course(course)
                .groupStatus(GroupStatus.READY)
                .build());

        // Add student to the reviewer group
        groupMemberDao.save(GroupMember.builder()
                .group(reviewerGroup)
                .user(student)
                .build());

        reviewAssignment = peerReviewAssignmentDao.save(PeerReviewAssignment.builder()
                .assignment(assignment)
                .reviewerGroup(reviewerGroup)
                .revieweeGroup(revieweeGroup)
                .assignedBy(lecturer)
                .reviewAssignmentStatus(ReviewAssignmentStatus.ASSIGNED)
                .dueAt(assignment.getReviewDeadline())
                .build());

        submission = assignmentSubmissionDao.save(AssignmentSubmission.builder()
                .assignment(assignment)
                .group(revieweeGroup)
                .submittedBy(lecturer) // target submission done by group
                .submissionStatus(SubmissionStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now().minusDays(1))
                .build());

        groupMemberDao.flush();
        peerReviewAssignmentDao.flush();
        assignmentSubmissionDao.flush();
    }

    @Test
    void getReviewTask_ReturnsDetails_Success() throws Exception {
        String token = loginAndGetToken("student01", "Student@123");

        mockMvc.perform(get("/peer-reviews/tasks/{id}", reviewAssignment.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.reviewTaskId").value(reviewAssignment.getId()))
                .andExpect(jsonPath("$.data.assignment.title").value("Peer Review Task"))
                .andExpect(jsonPath("$.data.revieweeGroup.groupName").value("Reviewees"))
                .andExpect(jsonPath("$.data.submission.id").value(submission.getId()))
                .andExpect(jsonPath("$.data.submitted").value(false))
                .andExpect(jsonPath("$.data.reviewerGroupName").doesNotExist())
                .andExpect(jsonPath("$.data.reviewerGroupId").doesNotExist());
    }

    @Test
    void getReviewTask_Forbidden_WhenNotReviewerGroupMember() throws Exception {
        // Create another student who is not in the reviewer group
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User otherStudent = userDao.saveAndFlush(User.builder()
                .username("otherStudent-" + suffix)
                .email("other-" + suffix + "@peergrade.test")
                .passwordHash(passwordEncoder.encode("Student@123"))
                .fullName("Other Student")
                .userRole(UserRole.STUDENT)
                .status(UserStatus.ACTIVE)
                .build());

        String token = loginAndGetToken(otherStudent.getUsername(), "Student@123");

        mockMvc.perform(get("/peer-reviews/tasks/{id}", reviewAssignment.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(PeerReviewServiceImpl.NOT_ASSIGNED_MESSAGE));
    }

    @Test
    void submitReview_SavesReview_Success() throws Exception {
        String token = loginAndGetToken("student01", "Student@123");

        SubmitPayload payload = new SubmitPayload(new BigDecimal("95.00"), "Excellent work, documentation is complete.");

        mockMvc.perform(put("/peer-reviews/tasks/{id}", reviewAssignment.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Peer review submitted successfully."))
                .andExpect(jsonPath("$.data.reviewId").isNotEmpty())
                .andExpect(jsonPath("$.data.submittedAt").isNotEmpty());
    }

    @Test
    void submitReview_RejectsInvalidScore() throws Exception {
        String token = loginAndGetToken("student01", "Student@123");

        SubmitPayload payload = new SubmitPayload(new BigDecimal("-5.00"), "Invalid score review comment here.");

        mockMvc.perform(put("/peer-reviews/tasks/{id}", reviewAssignment.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(ErrorCode.BAD_REQUEST.getCode()))
                .andExpect(jsonPath("$.message").value(PeerReviewServiceImpl.INVALID_SCORE_MESSAGE));
    }

    @Test
    void submitReview_RejectsShortComment() throws Exception {
        String token = loginAndGetToken("student01", "Student@123");

        SubmitPayload payload = new SubmitPayload(new BigDecimal("90.00"), "Short");

        mockMvc.perform(put("/peer-reviews/tasks/{id}", reviewAssignment.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(ErrorCode.BAD_REQUEST.getCode()))
                .andExpect(jsonPath("$.message").value(PeerReviewServiceImpl.COMMENT_TOO_SHORT_MESSAGE));
    }

    @Test
    void submitReview_RejectsAfterDeadline() throws Exception {
        reviewAssignment.setDueAt(LocalDateTime.now().minusMinutes(5));
        peerReviewAssignmentDao.saveAndFlush(reviewAssignment);

        String token = loginAndGetToken("student01", "Student@123");

        SubmitPayload payload = new SubmitPayload(new BigDecimal("90.00"), "Valid comment text is supplied here.");

        mockMvc.perform(put("/peer-reviews/tasks/{id}", reviewAssignment.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(ErrorCode.CONFLICT.getCode()))
                .andExpect(jsonPath("$.message").value(PeerReviewServiceImpl.DEADLINE_PASSED_MESSAGE));
    }

    private String loginAndGetToken(String usernameOrEmail, String password) throws Exception {
        String response = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginPayload(
                                usernameOrEmail,
                                password,
                                false
                        ))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        return json.path("data").path("token").asText();
    }

    private record SubmitPayload(BigDecimal score, String comment) {
    }

    private record LoginPayload(String usernameOrEmail, String password, boolean rememberMe) {
    }

    // Mock builder to prevent MockMvc post method imports issue
    private static org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder post(String url) {
        return org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(url);
    }
}

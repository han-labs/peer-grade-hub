package edu.hcmute.peergradehub.peerreview.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.hcmute.peergradehub.dao.AssignmentDao;
import edu.hcmute.peergradehub.dao.CourseDao;
import edu.hcmute.peergradehub.dao.LessonDao;
import edu.hcmute.peergradehub.dao.PeerReviewAssignmentDao;
import edu.hcmute.peergradehub.dao.PeerReviewDao;
import edu.hcmute.peergradehub.dao.StudentGroupDao;
import edu.hcmute.peergradehub.dao.UserDao;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.Lesson;
import edu.hcmute.peergradehub.entity.PeerReview;
import edu.hcmute.peergradehub.entity.PeerReviewAssignment;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.GroupStatus;
import edu.hcmute.peergradehub.enumeration.ReviewAssignmentStatus;
import edu.hcmute.peergradehub.enumeration.ReviewStatus;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.exception.ErrorCode;
import edu.hcmute.peergradehub.service.impl.PeerReviewAssignmentServiceImpl;
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

import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PeerReviewAssignmentControllerIntegrationTest {

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
    private PeerReviewAssignmentDao peerReviewAssignmentDao;

    @Autowired
    private PeerReviewDao peerReviewDao;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User lecturer;
    private Course course;
    private Assignment assignment;
    private StudentGroup reviewerGroup;
    private StudentGroup targetGroup;

    @BeforeEach
    void setUp() {
        lecturer = userDao.findByUsername("lecturer01").orElseThrow();
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        course = courseDao.save(Course.builder()
                .courseName("UC-14 Test Course")
                .classCode("UC14-" + suffix)
                .semester("2026-1")
                .lecturer(lecturer)
                .description("Peer review assignment integration fixture")
                .build());
        Lesson lesson = lessonDao.save(Lesson.builder()
                .title("Peer Review Week")
                .course(course)
                .build());
        assignment = assignmentDao.save(Assignment.builder()
                .title("Peer Assessment")
                .description("Review another group")
                .submissionDeadline(LocalDateTime.now().plusDays(2))
                .reviewDeadline(LocalDateTime.now().plusDays(7))
                .lesson(lesson)
                .build());
        reviewerGroup = studentGroupDao.save(StudentGroup.builder()
                .groupName("Reviewer Group")
                .maxMembers(5)
                .course(course)
                .groupStatus(GroupStatus.FORMING)
                .build());
        targetGroup = studentGroupDao.save(StudentGroup.builder()
                .groupName("Target Group")
                .maxMembers(5)
                .course(course)
                .groupStatus(GroupStatus.READY)
                .build());
        studentGroupDao.flush();
    }

    @Test
    void getPeerReviewAssignments_ReturnsDtoPageData() throws Exception {
        String token = loginAndGetToken("lecturer01", "Lecturer@123");

        mockMvc.perform(get("/assignments/{assignmentId}/peer-review-assignments", assignment.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.assignment.id").value(assignment.getId()))
                .andExpect(jsonPath("$.data.assignment.courseId").value(course.getId()))
                .andExpect(jsonPath("$.data.groups.length()").value(2))
                .andExpect(jsonPath("$.data.groupsWithoutReceivedReviews.length()").value(2))
                .andExpect(jsonPath("$.data.assignment.lesson").doesNotExist())
                .andExpect(jsonPath("$.data.groups[0].course").doesNotExist());
    }

    @Test
    void createPeerReviewAssignment_ReturnsCreatedAndTargetDto() throws Exception {
        String token = loginAndGetToken("lecturer01", "Lecturer@123");

        mockMvc.perform(post("/assignments/{assignmentId}/peer-review-assignments", assignment.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreatePayload(
                                reviewerGroup.getId(),
                                targetGroup.getId()
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Peer review assignment created successfully."))
                .andExpect(jsonPath("$.data.assignmentId").value(assignment.getId()))
                .andExpect(jsonPath("$.data.reviewerGroup.id").value(reviewerGroup.getId()))
                .andExpect(jsonPath("$.data.targetGroup.id").value(targetGroup.getId()))
                .andExpect(jsonPath("$.data.revieweeGroup").doesNotExist())
                .andExpect(jsonPath("$.data.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.data.dueAt").isNotEmpty());
    }

    @Test
    void createPeerReviewAssignment_ReturnsExactSelfReviewError() throws Exception {
        String token = loginAndGetToken("lecturer01", "Lecturer@123");

        mockMvc.perform(post("/assignments/{assignmentId}/peer-review-assignments", assignment.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreatePayload(
                                reviewerGroup.getId(),
                                reviewerGroup.getId()
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(ErrorCode.BAD_REQUEST.getCode()))
                .andExpect(jsonPath("$.message").value(PeerReviewAssignmentServiceImpl.SELF_REVIEW_MESSAGE));
    }

    @Test
    void deletePeerReviewAssignment_DeletesPhysicalTask() throws Exception {
        PeerReviewAssignment peerReviewAssignment = savePeerReviewAssignment();
        String token = loginAndGetToken("lecturer01", "Lecturer@123");

        mockMvc.perform(delete("/peer-review-assignments/{peerReviewAssignmentId}", peerReviewAssignment.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Peer review assignment deleted successfully."))
                .andExpect(jsonPath("$.data.peerReviewAssignmentId").value(peerReviewAssignment.getId()));
    }

    @Test
    void deletePeerReviewAssignment_BlocksWhenDraftReviewExists() throws Exception {
        PeerReviewAssignment peerReviewAssignment = savePeerReviewAssignment();
        peerReviewDao.saveAndFlush(PeerReview.builder()
                .peerReviewAssignment(peerReviewAssignment)
                .reviewStatus(ReviewStatus.DRAFT)
                .build());
        String token = loginAndGetToken("lecturer01", "Lecturer@123");

        mockMvc.perform(delete("/peer-review-assignments/{peerReviewAssignmentId}", peerReviewAssignment.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(ErrorCode.CONFLICT.getCode()))
                .andExpect(jsonPath("$.message").value(
                        PeerReviewAssignmentServiceImpl.DELETE_BLOCKED_MESSAGE
                ));
    }

    @Test
    void getPeerReviewAssignments_WithoutTokenReturnsJsonUnauthorized() throws Exception {
        mockMvc.perform(get("/assignments/{assignmentId}/peer-review-assignments", assignment.getId()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(ErrorCode.UNAUTHORIZED.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.UNAUTHORIZED.getDefaultMessage()));
    }

    @Test
    void getPeerReviewAssignments_WithStudentTokenReturnsForbidden() throws Exception {
        String token = loginAndGetToken("student01", "Student@123");

        mockMvc.perform(get("/assignments/{assignmentId}/peer-review-assignments", assignment.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(ErrorCode.FORBIDDEN.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.FORBIDDEN.getDefaultMessage()));
    }

    @Test
    void getPeerReviewAssignments_WithDifferentLecturerReturnsForbidden() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User otherLecturer = userDao.saveAndFlush(User.builder()
                .username("other-lecturer-" + suffix)
                .email("other-lecturer-" + suffix + "@peergrade.test")
                .passwordHash(passwordEncoder.encode("Other@123"))
                .fullName("Other Lecturer")
                .userRole(UserRole.LECTURER)
                .build());
        String token = loginAndGetToken(otherLecturer.getUsername(), "Other@123");

        mockMvc.perform(get("/assignments/{assignmentId}/peer-review-assignments", assignment.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(ErrorCode.FORBIDDEN.getDefaultMessage()));
    }

    @Test
    void getPeerReviewAssignments_WithMissingAssignmentReturnsNotFound() throws Exception {
        String token = loginAndGetToken("lecturer01", "Lecturer@123");

        mockMvc.perform(get("/assignments/{assignmentId}/peer-review-assignments", Long.MAX_VALUE)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(ErrorCode.NOT_FOUND.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.NOT_FOUND.getDefaultMessage()));
    }

    @Test
    void deletePeerReviewAssignment_WithMissingTaskReturnsNotFound() throws Exception {
        String token = loginAndGetToken("lecturer01", "Lecturer@123");

        mockMvc.perform(delete("/peer-review-assignments/{peerReviewAssignmentId}", Long.MAX_VALUE)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(ErrorCode.NOT_FOUND.getCode()));
    }

    private PeerReviewAssignment savePeerReviewAssignment() {
        return peerReviewAssignmentDao.saveAndFlush(PeerReviewAssignment.builder()
                .assignment(assignment)
                .reviewerGroup(reviewerGroup)
                .revieweeGroup(targetGroup)
                .assignedBy(lecturer)
                .reviewAssignmentStatus(ReviewAssignmentStatus.ASSIGNED)
                .dueAt(assignment.getReviewDeadline())
                .build());
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

    private record CreatePayload(Long reviewerGroupId, Long targetGroupId) {
    }

    private record LoginPayload(String usernameOrEmail, String password, boolean rememberMe) {
    }
}

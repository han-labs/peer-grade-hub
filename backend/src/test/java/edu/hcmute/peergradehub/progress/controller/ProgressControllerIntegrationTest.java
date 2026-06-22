package edu.hcmute.peergradehub.progress.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.hcmute.peergradehub.dao.AssignmentDao;
import edu.hcmute.peergradehub.dao.AssignmentSubmissionDao;
import edu.hcmute.peergradehub.dao.CourseDao;
import edu.hcmute.peergradehub.dao.LessonDao;
import edu.hcmute.peergradehub.dao.PeerReviewAssignmentDao;
import edu.hcmute.peergradehub.dao.PeerReviewDao;
import edu.hcmute.peergradehub.dao.StudentGroupDao;
import edu.hcmute.peergradehub.dao.UserDao;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.AssignmentSubmission;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.Lesson;
import edu.hcmute.peergradehub.entity.PeerReview;
import edu.hcmute.peergradehub.entity.PeerReviewAssignment;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.GroupStatus;
import edu.hcmute.peergradehub.enumeration.ReviewAssignmentStatus;
import edu.hcmute.peergradehub.enumeration.ReviewStatus;
import edu.hcmute.peergradehub.enumeration.SubmissionStatus;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.enumeration.UserStatus;
import edu.hcmute.peergradehub.exception.ErrorCode;
import edu.hcmute.peergradehub.service.impl.ProgressServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ProgressControllerIntegrationTest {

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
    private AssignmentSubmissionDao assignmentSubmissionDao;
    @Autowired
    private PeerReviewAssignmentDao peerReviewAssignmentDao;
    @Autowired
    private PeerReviewDao peerReviewDao;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private User lecturer;
    private User student;
    private User otherLecturer;
    private Course course;
    private Course otherCourse;
    private Assignment assignment;
    private StudentGroup group1;
    private StudentGroup group2;
    private StudentGroup group3;

    @BeforeEach
    void setUp() {
        lecturer = userDao.findByUsername("lecturer01").orElseThrow();
        student = userDao.findByUsername("student01").orElseThrow();
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        otherLecturer = userDao.save(User.builder()
                .username("progress-lecturer-" + suffix)
                .email("progress-lecturer-" + suffix + "@peergrade.test")
                .passwordHash(passwordEncoder.encode("Other@123"))
                .fullName("Other Lecturer")
                .userRole(UserRole.LECTURER)
                .status(UserStatus.ACTIVE)
                .build());
        course = courseDao.save(Course.builder()
                .courseName("UC-08 Test Course")
                .classCode("UC08-" + suffix)
                .semester("2026-1")
                .lecturer(lecturer)
                .groupFormationDeadline(LocalDateTime.now().plusDays(1))
                .build());
        otherCourse = courseDao.save(Course.builder()
                .courseName("UC-08 Other Course")
                .classCode("UC08-OTHER-" + suffix)
                .semester("2026-1")
                .lecturer(lecturer)
                .build());
        Lesson lesson = lessonDao.save(Lesson.builder()
                .title("Monitoring Week")
                .course(course)
                .build());
        assignment = assignmentDao.save(Assignment.builder()
                .title("Progress Assignment")
                .submissionDeadline(LocalDateTime.now().plusDays(2))
                .reviewDeadline(LocalDateTime.now().plusDays(7))
                .lesson(lesson)
                .build());
        group1 = saveGroup("Progress Group 1", GroupStatus.READY);
        group2 = saveGroup("Progress Group 2", GroupStatus.LOCKED);
        group3 = saveGroup("Progress Group 3", GroupStatus.FORMING);

        assignmentSubmissionDao.save(AssignmentSubmission.builder()
                .assignment(assignment)
                .group(group1)
                .submittedBy(student)
                .submissionStatus(SubmissionStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now().minusHours(2))
                .note("Submitted on time")
                .build());
        assignmentSubmissionDao.save(AssignmentSubmission.builder()
                .assignment(assignment)
                .group(group2)
                .submittedBy(student)
                .submissionStatus(SubmissionStatus.LATE)
                .submittedAt(LocalDateTime.now().minusHours(1))
                .note("Submitted late")
                .build());

        PeerReviewAssignment completedTask = saveReviewAssignment(
                group1,
                group2,
                ReviewAssignmentStatus.SUBMITTED
        );
        PeerReviewAssignment incompleteTask = saveReviewAssignment(
                group2,
                group1,
                ReviewAssignmentStatus.IN_PROGRESS
        );
        saveReviewAssignment(group1, group3, ReviewAssignmentStatus.CANCELLED);

        peerReviewDao.save(PeerReview.builder()
                .peerReviewAssignment(completedTask)
                .submittedBy(student)
                .reviewStatus(ReviewStatus.SUBMITTED)
                .score(new BigDecimal("82.50"))
                .comment("Complete review evidence")
                .submittedAt(LocalDateTime.now().minusMinutes(30))
                .build());
        peerReviewDao.save(PeerReview.builder()
                .peerReviewAssignment(incompleteTask)
                .submittedBy(student)
                .reviewStatus(ReviewStatus.DRAFT)
                .comment("Draft evidence")
                .build());
        peerReviewDao.flush();
    }

    @Test
    void dashboard_ReturnsApprovedStatisticsAndDtoShape() throws Exception {
        String token = loginAndGetToken("lecturer01", "Lecturer@123");

        mockMvc.perform(get("/courses/{courseId}/assignments/{assignmentId}/progress",
                        course.getId(), assignment.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.course.id").value(course.getId()))
                .andExpect(jsonPath("$.data.assignment.id").value(assignment.getId()))
                .andExpect(jsonPath("$.data.statistics.totalGroups").value(3))
                .andExpect(jsonPath("$.data.statistics.submittedCount").value(2))
                .andExpect(jsonPath("$.data.statistics.pendingCount").value(1))
                .andExpect(jsonPath("$.data.statistics.lateCount").value(1))
                .andExpect(jsonPath("$.data.statistics.submissionCompletionRate").value(66.67))
                .andExpect(jsonPath("$.data.statistics.totalReviewAssignments").value(2))
                .andExpect(jsonPath("$.data.statistics.completedReviews").value(1))
                .andExpect(jsonPath("$.data.statistics.incompleteReviews").value(1))
                .andExpect(jsonPath("$.data.statistics.peerReviewCompletionRate").value(50.00))
                .andExpect(jsonPath("$.data.statistics.groupsWithNoReceivedReview").value(1))
                .andExpect(jsonPath("$.data.statistics.groupsWithIncompleteAssignedReviews").value(1))
                .andExpect(jsonPath("$.data.groups.length()").value(3))
                .andExpect(jsonPath("$.data.groups[0].course").doesNotExist())
                .andExpect(jsonPath("$.data.assignment.lesson").doesNotExist());
    }

    @ParameterizedTest
    @CsvSource({
        "ALL,3",
        "INCOMPLETE,2",
        "NOT_SUBMITTED,1",
        "SUBMITTED,2",
        "LATE,1",
        "NOT_REVIEWED,1",
        "REVIEWED,1",
        "NO_RECEIVED_REVIEW,1"
    })
    void filter_ReturnsExpectedGroupCount(String filter, int expectedCount) throws Exception {
        String token = loginAndGetToken("lecturer01", "Lecturer@123");

        mockMvc.perform(get("/courses/{courseId}/assignments/{assignmentId}/progress/groups",
                        course.getId(), assignment.getId())
                        .param("filter", filter)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.filter").value(filter))
                .andExpect(jsonPath("$.data.groups.length()").value(expectedCount));
    }

    @Test
    void filter_RejectsUnknownValueWithJsonBadRequest() throws Exception {
        String token = loginAndGetToken("lecturer01", "Lecturer@123");

        mockMvc.perform(get("/courses/{courseId}/assignments/{assignmentId}/progress/groups",
                        course.getId(), assignment.getId())
                        .param("filter", "UNKNOWN")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(ErrorCode.BAD_REQUEST.getCode()));
    }

    @Test
    void groupDetails_ReturnsSubmissionOutgoingProgressAndEvidence() throws Exception {
        String token = loginAndGetToken("lecturer01", "Lecturer@123");

        mockMvc.perform(get("/assignments/{assignmentId}/progress/groups/{groupId}",
                        assignment.getId(), group2.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.group.id").value(group2.getId()))
                .andExpect(jsonPath("$.data.submission.status").value("LATE"))
                .andExpect(jsonPath("$.data.outgoingReviews.length()").value(1))
                .andExpect(jsonPath("$.data.outgoingReviews[0].reviewStatus").value("DRAFT"))
                .andExpect(jsonPath("$.data.receivedReviewEvidence.length()").value(1))
                .andExpect(jsonPath("$.data.receivedReviewEvidence[0].score").value(82.50))
                .andExpect(jsonPath("$.data.receivedReviewEvidence[0].peerReviewAssignment.assignment")
                        .doesNotExist());
    }

    @Test
    void groupDetails_EmptyEvidenceIsSuccessful() throws Exception {
        String token = loginAndGetToken("lecturer01", "Lecturer@123");

        mockMvc.perform(get("/assignments/{assignmentId}/progress/groups/{groupId}",
                        assignment.getId(), group3.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.submission").doesNotExist())
                .andExpect(jsonPath("$.data.outgoingReviews.length()").value(0))
                .andExpect(jsonPath("$.data.receivedReviewEvidence.length()").value(0));
    }

    @Test
    void groupDetails_MissingGroupUsesExactMessage() throws Exception {
        String token = loginAndGetToken("lecturer01", "Lecturer@123");

        mockMvc.perform(get("/assignments/{assignmentId}/progress/groups/{groupId}",
                        assignment.getId(), 999999L)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(
                        ProgressServiceImpl.GROUP_NOT_ACCESSIBLE_MESSAGE
                ));
    }

    @Test
    void dashboard_WithoutTokenReturnsJsonUnauthorized() throws Exception {
        mockMvc.perform(get("/courses/{courseId}/assignments/{assignmentId}/progress",
                        course.getId(), assignment.getId()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(ErrorCode.UNAUTHORIZED.getCode()));
    }

    @Test
    void dashboard_NonLecturerReturnsForbidden() throws Exception {
        String token = loginAndGetToken("student01", "Student@123");

        mockMvc.perform(get("/courses/{courseId}/assignments/{assignmentId}/progress",
                        course.getId(), assignment.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(ErrorCode.FORBIDDEN.getCode()));
    }

    @Test
    void dashboard_DifferentLecturerReturnsForbidden() throws Exception {
        String token = loginAndGetToken(otherLecturer.getUsername(), "Other@123");

        mockMvc.perform(get("/courses/{courseId}/assignments/{assignmentId}/progress",
                        course.getId(), assignment.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void dashboard_AssignmentCourseMismatchReturnsNotFound() throws Exception {
        String token = loginAndGetToken("lecturer01", "Lecturer@123");

        mockMvc.perform(get("/courses/{courseId}/assignments/{assignmentId}/progress",
                        otherCourse.getId(), assignment.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void dashboard_MissingAssignmentReturnsNotFound() throws Exception {
        String token = loginAndGetToken("lecturer01", "Lecturer@123");

        mockMvc.perform(get("/courses/{courseId}/assignments/{assignmentId}/progress",
                        course.getId(), 999999L)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    private StudentGroup saveGroup(String name, GroupStatus status) {
        return studentGroupDao.save(StudentGroup.builder()
                .groupName(name)
                .maxMembers(5)
                .course(course)
                .groupStatus(status)
                .build());
    }

    private PeerReviewAssignment saveReviewAssignment(
            StudentGroup reviewer,
            StudentGroup target,
            ReviewAssignmentStatus status
    ) {
        return peerReviewAssignmentDao.save(PeerReviewAssignment.builder()
                .assignment(assignment)
                .reviewerGroup(reviewer)
                .revieweeGroup(target)
                .assignedBy(lecturer)
                .reviewAssignmentStatus(status)
                .dueAt(assignment.getReviewDeadline())
                .build());
    }

    private String loginAndGetToken(String username, String password) throws Exception {
        String responseBody = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginPayload(username, password, false)
                        )))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode response = objectMapper.readTree(responseBody);
        return response.path("data").path("token").asText();
    }

    private record LoginPayload(String usernameOrEmail, String password, boolean rememberMe) {
    }
}

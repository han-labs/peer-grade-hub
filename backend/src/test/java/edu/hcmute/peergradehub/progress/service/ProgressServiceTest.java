package edu.hcmute.peergradehub.progress.service;

import edu.hcmute.peergradehub.dao.AssignmentDao;
import edu.hcmute.peergradehub.dao.AssignmentSubmissionDao;
import edu.hcmute.peergradehub.dao.PeerReviewAssignmentDao;
import edu.hcmute.peergradehub.dao.PeerReviewDao;
import edu.hcmute.peergradehub.dao.StudentGroupDao;
import edu.hcmute.peergradehub.dao.UserDao;
import edu.hcmute.peergradehub.dto.response.progress.FilteredProgressGroupsResponse;
import edu.hcmute.peergradehub.dto.response.progress.GroupMonitoringDetailResponse;
import edu.hcmute.peergradehub.dto.response.progress.ProgressDashboardResponse;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.AssignmentSubmission;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.Lesson;
import edu.hcmute.peergradehub.entity.PeerReview;
import edu.hcmute.peergradehub.entity.PeerReviewAssignment;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.GroupStatus;
import edu.hcmute.peergradehub.enumeration.ProgressFilter;
import edu.hcmute.peergradehub.enumeration.ReviewAssignmentStatus;
import edu.hcmute.peergradehub.enumeration.ReviewStatus;
import edu.hcmute.peergradehub.enumeration.SubmissionStatus;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.exception.ApiException;
import edu.hcmute.peergradehub.exception.ForbiddenException;
import edu.hcmute.peergradehub.exception.NotFoundException;
import edu.hcmute.peergradehub.mapper.ProgressMapper;
import edu.hcmute.peergradehub.service.impl.ProgressServiceImpl;
import edu.hcmute.peergradehub.service.support.ProgressStatisticsCalculator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProgressServiceTest {

    private static final Long LECTURER_ID = 2L;
    private static final Long COURSE_ID = 10L;
    private static final Long ASSIGNMENT_ID = 20L;
    private static final Long GROUP_1_ID = 30L;
    private static final Long GROUP_2_ID = 31L;

    @Mock
    private AssignmentDao assignmentDao;
    @Mock
    private StudentGroupDao studentGroupDao;
    @Mock
    private AssignmentSubmissionDao assignmentSubmissionDao;
    @Mock
    private PeerReviewAssignmentDao peerReviewAssignmentDao;
    @Mock
    private PeerReviewDao peerReviewDao;
    @Mock
    private UserDao userDao;
    @Spy
    private ProgressStatisticsCalculator calculator = new ProgressStatisticsCalculator();
    @Spy
    private ProgressMapper mapper = new ProgressMapper();
    @InjectMocks
    private ProgressServiceImpl service;

    private User lecturer;
    private Course course;
    private Assignment assignment;
    private StudentGroup group1;
    private StudentGroup group2;
    private AssignmentSubmission submission;
    private PeerReviewAssignment reviewAssignment;
    private PeerReview review;

    @BeforeEach
    void setUp() {
        lecturer = User.builder().id(LECTURER_ID).userRole(UserRole.LECTURER).build();
        course = Course.builder()
                .id(COURSE_ID)
                .courseName("OOSE")
                .classCode("OOSE-03")
                .lecturer(lecturer)
                .build();
        assignment = Assignment.builder()
                .id(ASSIGNMENT_ID)
                .title("Peer Assessment")
                .submissionDeadline(LocalDateTime.now().plusDays(2))
                .reviewDeadline(LocalDateTime.now().plusDays(7))
                .lesson(Lesson.builder().id(15L).course(course).build())
                .build();
        group1 = group(GROUP_1_ID, "Group 1");
        group2 = group(GROUP_2_ID, "Group 2");
        submission = AssignmentSubmission.builder()
                .id(40L)
                .assignment(assignment)
                .group(group1)
                .submittedBy(lecturer)
                .submissionStatus(SubmissionStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .note("Final submission")
                .build();
        reviewAssignment = PeerReviewAssignment.builder()
                .id(50L)
                .assignment(assignment)
                .reviewerGroup(group1)
                .revieweeGroup(group2)
                .reviewAssignmentStatus(ReviewAssignmentStatus.SUBMITTED)
                .assignedAt(LocalDateTime.now().minusDays(1))
                .dueAt(assignment.getReviewDeadline())
                .build();
        review = PeerReview.builder()
                .id(60L)
                .peerReviewAssignment(reviewAssignment)
                .reviewStatus(ReviewStatus.SUBMITTED)
                .score(new BigDecimal("85.00"))
                .comment("Useful evidence")
                .submittedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void getMonitoringDashboard_ReturnsAggregatedDto() {
        stubSnapshot();

        ProgressDashboardResponse response = service.getMonitoringDashboard(
                COURSE_ID,
                ASSIGNMENT_ID,
                LECTURER_ID
        );

        assertEquals(COURSE_ID, response.course().id());
        assertEquals(ASSIGNMENT_ID, response.assignment().id());
        assertEquals(2, response.statistics().totalGroups());
        assertEquals(1, response.statistics().submittedCount());
        assertEquals(1, response.statistics().pendingCount());
        assertEquals(1, response.statistics().completedReviews());
        assertEquals(2, response.groups().size());
    }

    @Test
    void getFilteredMonitoringGroups_UsesServerSideFilter() {
        stubSnapshot();

        FilteredProgressGroupsResponse response = service.getFilteredMonitoringGroups(
                COURSE_ID,
                ASSIGNMENT_ID,
                ProgressFilter.NO_RECEIVED_REVIEW,
                LECTURER_ID
        );

        assertEquals(ProgressFilter.NO_RECEIVED_REVIEW, response.filter());
        assertEquals(List.of(GROUP_1_ID), response.groups().stream()
                .map(group -> group.groupId())
                .toList());
    }

    @Test
    void getMonitoringDashboard_MapsDataFailureToExactMessage() {
        stubLecturerAndAssignment();
        when(studentGroupDao.findByCourseId(COURSE_ID))
                .thenThrow(new DataAccessResourceFailureException("offline"));

        ApiException exception = assertThrows(ApiException.class, () ->
                service.getMonitoringDashboard(COURSE_ID, ASSIGNMENT_ID, LECTURER_ID));

        assertEquals(ProgressServiceImpl.DASHBOARD_LOAD_ERROR_MESSAGE, exception.getMessage());
    }

    @Test
    void getMonitoringDashboard_RejectsNonLecturer() {
        when(userDao.findById(LECTURER_ID)).thenReturn(Optional.of(
                User.builder().id(LECTURER_ID).userRole(UserRole.STUDENT).build()
        ));

        assertThrows(ForbiddenException.class, () ->
                service.getMonitoringDashboard(COURSE_ID, ASSIGNMENT_ID, LECTURER_ID));
    }

    @Test
    void getMonitoringDashboard_RejectsDifferentLecturer() {
        stubLecturer();
        course.setLecturer(User.builder().id(99L).userRole(UserRole.LECTURER).build());
        when(assignmentDao.findByIdWithCourseAndLecturer(ASSIGNMENT_ID))
                .thenReturn(Optional.of(assignment));

        assertThrows(ForbiddenException.class, () ->
                service.getMonitoringDashboard(COURSE_ID, ASSIGNMENT_ID, LECTURER_ID));
    }

    @Test
    void getMonitoringDashboard_RejectsAssignmentCourseMismatch() {
        stubLecturerAndAssignment();

        assertThrows(NotFoundException.class, () ->
                service.getMonitoringDashboard(999L, ASSIGNMENT_ID, LECTURER_ID));
    }

    @Test
    void getMonitoringDashboard_RejectsMissingAssignment() {
        stubLecturer();
        when(assignmentDao.findByIdWithCourseAndLecturer(ASSIGNMENT_ID))
                .thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () ->
                service.getMonitoringDashboard(COURSE_ID, ASSIGNMENT_ID, LECTURER_ID));
    }

    @Test
    void getGroupMonitoringDetails_ReturnsSubmissionAndReviewEvidence() {
        stubLecturerAndAssignment();
        when(studentGroupDao.findByIdAndCourseId(GROUP_2_ID, COURSE_ID))
                .thenReturn(Optional.of(group2));
        when(assignmentSubmissionDao.findByAssignmentIdAndGroupId(ASSIGNMENT_ID, GROUP_2_ID))
                .thenReturn(Optional.empty());
        when(peerReviewAssignmentDao.findByAssignmentId(ASSIGNMENT_ID))
                .thenReturn(List.of(reviewAssignment));
        when(peerReviewDao.findByAssignmentId(ASSIGNMENT_ID)).thenReturn(List.of(review));

        GroupMonitoringDetailResponse response = service.getGroupMonitoringDetails(
                ASSIGNMENT_ID,
                GROUP_2_ID,
                LECTURER_ID
        );

        assertEquals(GROUP_2_ID, response.group().id());
        assertNull(response.submission());
        assertEquals(0, response.outgoingReviews().size());
        assertEquals(1, response.receivedReviewEvidence().size());
        assertEquals(new BigDecimal("85.00"), response.receivedReviewEvidence().get(0).score());
    }

    @Test
    void getGroupMonitoringDetails_ReturnsEmptyEvidenceWithoutError() {
        stubLecturerAndAssignment();
        when(studentGroupDao.findByIdAndCourseId(GROUP_1_ID, COURSE_ID))
                .thenReturn(Optional.of(group1));
        when(assignmentSubmissionDao.findByAssignmentIdAndGroupId(ASSIGNMENT_ID, GROUP_1_ID))
                .thenReturn(Optional.of(submission));
        when(peerReviewAssignmentDao.findByAssignmentId(ASSIGNMENT_ID)).thenReturn(List.of());
        when(peerReviewDao.findByAssignmentId(ASSIGNMENT_ID)).thenReturn(List.of());

        GroupMonitoringDetailResponse response = service.getGroupMonitoringDetails(
                ASSIGNMENT_ID,
                GROUP_1_ID,
                LECTURER_ID
        );

        assertEquals(0, response.outgoingReviews().size());
        assertEquals(0, response.receivedReviewEvidence().size());
    }

    @Test
    void getGroupMonitoringDetails_UsesExactMissingGroupMessage() {
        stubLecturerAndAssignment();
        when(studentGroupDao.findByIdAndCourseId(GROUP_1_ID, COURSE_ID))
                .thenReturn(Optional.empty());

        NotFoundException exception = assertThrows(NotFoundException.class, () ->
                service.getGroupMonitoringDetails(ASSIGNMENT_ID, GROUP_1_ID, LECTURER_ID));

        assertEquals(ProgressServiceImpl.GROUP_NOT_ACCESSIBLE_MESSAGE, exception.getMessage());
    }

    @Test
    void getGroupMonitoringDetails_MapsEvidenceFailureToExactMessage() {
        stubLecturerAndAssignment();
        when(studentGroupDao.findByIdAndCourseId(GROUP_1_ID, COURSE_ID))
                .thenReturn(Optional.of(group1));
        when(assignmentSubmissionDao.findByAssignmentIdAndGroupId(ASSIGNMENT_ID, GROUP_1_ID))
                .thenReturn(Optional.of(submission));
        when(peerReviewAssignmentDao.findByAssignmentId(ASSIGNMENT_ID))
                .thenThrow(new DataAccessResourceFailureException("offline"));

        ApiException exception = assertThrows(ApiException.class, () ->
                service.getGroupMonitoringDetails(ASSIGNMENT_ID, GROUP_1_ID, LECTURER_ID));

        assertEquals(ProgressServiceImpl.REVIEW_EVIDENCE_ERROR_MESSAGE, exception.getMessage());
    }

    private void stubSnapshot() {
        stubLecturerAndAssignment();
        when(studentGroupDao.findByCourseId(COURSE_ID)).thenReturn(List.of(group1, group2));
        when(assignmentSubmissionDao.findByAssignmentId(ASSIGNMENT_ID))
                .thenReturn(List.of(submission));
        when(peerReviewAssignmentDao.findByAssignmentId(ASSIGNMENT_ID))
                .thenReturn(List.of(reviewAssignment));
        when(peerReviewDao.findByAssignmentId(ASSIGNMENT_ID)).thenReturn(List.of(review));
    }

    private void stubLecturerAndAssignment() {
        stubLecturer();
        when(assignmentDao.findByIdWithCourseAndLecturer(ASSIGNMENT_ID))
                .thenReturn(Optional.of(assignment));
    }

    private void stubLecturer() {
        when(userDao.findById(LECTURER_ID)).thenReturn(Optional.of(lecturer));
    }

    private StudentGroup group(Long id, String name) {
        return StudentGroup.builder()
                .id(id)
                .groupName(name)
                .groupStatus(GroupStatus.READY)
                .course(course)
                .build();
    }
}

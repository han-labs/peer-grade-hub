package edu.hcmute.peergradehub.peerreview.service;

import edu.hcmute.peergradehub.dao.*;
import edu.hcmute.peergradehub.dto.request.peerreview.SubmitPeerReviewRequest;
import edu.hcmute.peergradehub.dto.response.peerreview.PeerReviewDetailResponse;
import edu.hcmute.peergradehub.dto.response.peerreview.SubmitPeerReviewResponse;
import edu.hcmute.peergradehub.entity.*;
import edu.hcmute.peergradehub.enumeration.*;
import edu.hcmute.peergradehub.exception.*;
import edu.hcmute.peergradehub.mapper.PeerReviewMapper;
import edu.hcmute.peergradehub.service.impl.PeerReviewServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PeerReviewServiceTest {

    private static final Long STUDENT_ID = 1L;
    private static final Long REVIEW_TASK_ID = 100L;
    private static final Long REVIEWER_GROUP_ID = 10L;
    private static final Long REVIEWEE_GROUP_ID = 20L;
    private static final Long ASSIGNMENT_ID = 50L;

    @Mock
    private UserDao userDao;

    @Mock
    private PeerReviewAssignmentDao peerReviewAssignmentDao;

    @Mock
    private PeerReviewDao peerReviewDao;

    @Mock
    private AssignmentSubmissionDao assignmentSubmissionDao;

    @Mock
    private SubmissionAttachmentDao submissionAttachmentDao;

    @Mock
    private LessonMaterialDao lessonMaterialDao;

    @Mock
    private GroupMemberDao groupMemberDao;

    @Spy
    private PeerReviewMapper mapper = new PeerReviewMapper();

    @InjectMocks
    private PeerReviewServiceImpl service;

    private User student;
    private PeerReviewAssignment task;
    private Assignment assignment;
    private StudentGroup reviewerGroup;
    private StudentGroup revieweeGroup;
    private AssignmentSubmission submission;

    @BeforeEach
    void setUp() {
        student = User.builder()
                .id(STUDENT_ID)
                .username("student1")
                .userRole(UserRole.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();

        reviewerGroup = StudentGroup.builder()
                .id(REVIEWER_GROUP_ID)
                .groupName("Reviewer Group")
                .build();

        revieweeGroup = StudentGroup.builder()
                .id(REVIEWEE_GROUP_ID)
                .groupName("Reviewee Group")
                .build();

        assignment = Assignment.builder()
                .id(ASSIGNMENT_ID)
                .title("Midterm Project")
                .submissionDeadline(LocalDateTime.now().minusDays(1))
                .reviewDeadline(LocalDateTime.now().plusDays(5))
                .build();

        task = PeerReviewAssignment.builder()
                .id(REVIEW_TASK_ID)
                .assignment(assignment)
                .reviewerGroup(reviewerGroup)
                .revieweeGroup(revieweeGroup)
                .reviewAssignmentStatus(ReviewAssignmentStatus.ASSIGNED)
                .dueAt(assignment.getReviewDeadline())
                .build();

        submission = AssignmentSubmission.builder()
                .id(200L)
                .assignment(assignment)
                .group(revieweeGroup)
                .submissionStatus(SubmissionStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now().minusDays(1))
                .build();
    }

    @Test
    void getReviewTask_Success() {
        stubValidStudent();
        stubValidTask();
        when(groupMemberDao.existsByGroupIdAndUserId(REVIEWER_GROUP_ID, STUDENT_ID)).thenReturn(true);
        when(assignmentSubmissionDao.findByAssignmentIdAndGroupId(ASSIGNMENT_ID, REVIEWEE_GROUP_ID))
                .thenReturn(Optional.of(submission));
        when(submissionAttachmentDao.findByAssignmentSubmissionId(200L)).thenReturn(List.of());
        when(lessonMaterialDao.findByAssignmentId(ASSIGNMENT_ID)).thenReturn(List.of());
        when(peerReviewDao.findByPeerReviewAssignmentId(REVIEW_TASK_ID)).thenReturn(Optional.empty());

        PeerReviewDetailResponse response = service.getReviewTask(REVIEW_TASK_ID, STUDENT_ID);

        assertNotNull(response);
        assertEquals(REVIEW_TASK_ID, response.reviewTaskId());
        assertEquals("Midterm Project", response.assignment().title());
        assertEquals("Reviewee Group", response.revieweeGroup().groupName());
        assertFalse(response.submitted());
        assertNull(response.score());
    }

    @Test
    void submitReview_CreatesNewReview_Success() {
        stubValidStudent();
        stubValidTask();
        when(groupMemberDao.existsByGroupIdAndUserId(REVIEWER_GROUP_ID, STUDENT_ID)).thenReturn(true);
        when(assignmentSubmissionDao.findByAssignmentIdAndGroupId(ASSIGNMENT_ID, REVIEWEE_GROUP_ID))
                .thenReturn(Optional.of(submission));
        when(peerReviewDao.findByPeerReviewAssignmentId(REVIEW_TASK_ID)).thenReturn(Optional.empty());
        when(peerReviewDao.save(any(PeerReview.class))).thenAnswer(inv -> {
            PeerReview pr = inv.getArgument(0);
            pr.setId(10L);
            pr.setSubmittedAt(LocalDateTime.now());
            return pr;
        });

        SubmitPeerReviewRequest request = new SubmitPeerReviewRequest(new BigDecimal("90.00"), "Excellent report and analysis.");
        SubmitPeerReviewResponse response = service.submitReview(REVIEW_TASK_ID, request, STUDENT_ID);

        assertNotNull(response);
        assertEquals(10L, response.reviewId());
        assertEquals(ReviewAssignmentStatus.SUBMITTED, task.getReviewAssignmentStatus());
        verify(peerReviewDao).save(any(PeerReview.class));
    }

    @Test
    void submitReview_UpdatesExistingReview_Success() {
        stubValidStudent();
        stubValidTask();
        PeerReview existing = PeerReview.builder()
                .id(10L)
                .peerReviewAssignment(task)
                .submittedBy(student)
                .reviewStatus(ReviewStatus.DRAFT)
                .build();

        when(groupMemberDao.existsByGroupIdAndUserId(REVIEWER_GROUP_ID, STUDENT_ID)).thenReturn(true);
        when(assignmentSubmissionDao.findByAssignmentIdAndGroupId(ASSIGNMENT_ID, REVIEWEE_GROUP_ID))
                .thenReturn(Optional.of(submission));
        when(peerReviewDao.findByPeerReviewAssignmentId(REVIEW_TASK_ID)).thenReturn(Optional.of(existing));
        when(peerReviewDao.save(any(PeerReview.class))).thenReturn(existing);

        SubmitPeerReviewRequest request = new SubmitPeerReviewRequest(new BigDecimal("85.50"), "Good work but needs styling update.");
        SubmitPeerReviewResponse response = service.submitReview(REVIEW_TASK_ID, request, STUDENT_ID);

        assertNotNull(response);
        assertEquals(10L, response.reviewId());
        assertEquals(new BigDecimal("85.50"), existing.getScore());
        assertEquals("Good work but needs styling update.", existing.getComment());
        assertEquals(ReviewStatus.SUBMITTED, existing.getReviewStatus());
        verify(peerReviewDao).save(existing);
    }

    @Test
    void submitReview_RejectsInvalidScore() {
        stubValidStudent();
        stubValidTask();
        when(groupMemberDao.existsByGroupIdAndUserId(REVIEWER_GROUP_ID, STUDENT_ID)).thenReturn(true);
        when(assignmentSubmissionDao.findByAssignmentIdAndGroupId(ASSIGNMENT_ID, REVIEWEE_GROUP_ID))
                .thenReturn(Optional.of(submission));

        SubmitPeerReviewRequest requestHigh = new SubmitPeerReviewRequest(new BigDecimal("100.01"), "Comment text fits requirement.");
        BadRequestException exHigh = assertThrows(BadRequestException.class, () ->
                service.submitReview(REVIEW_TASK_ID, requestHigh, STUDENT_ID));
        assertEquals(PeerReviewServiceImpl.INVALID_SCORE_MESSAGE, exHigh.getMessage());

        SubmitPeerReviewRequest requestLow = new SubmitPeerReviewRequest(new BigDecimal("-0.50"), "Comment text fits requirement.");
        BadRequestException exLow = assertThrows(BadRequestException.class, () ->
                service.submitReview(REVIEW_TASK_ID, requestLow, STUDENT_ID));
        assertEquals(PeerReviewServiceImpl.INVALID_SCORE_MESSAGE, exLow.getMessage());
    }

    @Test
    void submitReview_RejectsShortComment() {
        stubValidStudent();
        stubValidTask();
        when(groupMemberDao.existsByGroupIdAndUserId(REVIEWER_GROUP_ID, STUDENT_ID)).thenReturn(true);
        when(assignmentSubmissionDao.findByAssignmentIdAndGroupId(ASSIGNMENT_ID, REVIEWEE_GROUP_ID))
                .thenReturn(Optional.of(submission));

        SubmitPeerReviewRequest requestShort = new SubmitPeerReviewRequest(new BigDecimal("90.00"), "Short");
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                service.submitReview(REVIEW_TASK_ID, requestShort, STUDENT_ID));
        assertEquals(PeerReviewServiceImpl.COMMENT_TOO_SHORT_MESSAGE, ex.getMessage());
    }

    @Test
    void submitReview_RejectsNotAssignedStudent() {
        stubValidStudent();
        stubValidTask();
        when(groupMemberDao.existsByGroupIdAndUserId(REVIEWER_GROUP_ID, STUDENT_ID)).thenReturn(false);

        SubmitPeerReviewRequest request = new SubmitPeerReviewRequest(new BigDecimal("90.00"), "Comment text fits requirement.");
        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                service.submitReview(REVIEW_TASK_ID, request, STUDENT_ID));
        assertEquals(PeerReviewServiceImpl.NOT_ASSIGNED_MESSAGE, ex.getMessage());
    }

    @Test
    void submitReview_RejectsPassedDeadline() {
        stubValidStudent();
        task.setDueAt(LocalDateTime.now().minusMinutes(5));
        stubValidTask();
        when(groupMemberDao.existsByGroupIdAndUserId(REVIEWER_GROUP_ID, STUDENT_ID)).thenReturn(true);
        when(assignmentSubmissionDao.findByAssignmentIdAndGroupId(ASSIGNMENT_ID, REVIEWEE_GROUP_ID))
                .thenReturn(Optional.of(submission));

        SubmitPeerReviewRequest request = new SubmitPeerReviewRequest(new BigDecimal("90.00"), "Comment text fits requirement.");
        ConflictException ex = assertThrows(ConflictException.class, () ->
                service.submitReview(REVIEW_TASK_ID, request, STUDENT_ID));
        assertEquals(PeerReviewServiceImpl.DEADLINE_PASSED_MESSAGE, ex.getMessage());
    }

    @Test
    void submitReview_RejectsUnavailableSubmission() {
        stubValidStudent();
        stubValidTask();
        when(groupMemberDao.existsByGroupIdAndUserId(REVIEWER_GROUP_ID, STUDENT_ID)).thenReturn(true);
        // submission is draft
        submission.setSubmissionStatus(SubmissionStatus.DRAFT);
        when(assignmentSubmissionDao.findByAssignmentIdAndGroupId(ASSIGNMENT_ID, REVIEWEE_GROUP_ID))
                .thenReturn(Optional.of(submission));

        SubmitPeerReviewRequest request = new SubmitPeerReviewRequest(new BigDecimal("90.00"), "Comment text fits requirement.");
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                service.submitReview(REVIEW_TASK_ID, request, STUDENT_ID));
        assertEquals(PeerReviewServiceImpl.SUBMISSION_UNAVAILABLE_MESSAGE, ex.getMessage());
    }

    private void stubValidStudent() {
        when(userDao.findById(STUDENT_ID)).thenReturn(Optional.of(student));
    }

    private void stubValidTask() {
        when(peerReviewAssignmentDao.findByIdWithAssignmentCourseAndLecturer(REVIEW_TASK_ID))
                .thenReturn(Optional.of(task));
    }
}

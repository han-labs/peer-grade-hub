package edu.hcmute.peergradehub.peerreview.service;

import edu.hcmute.peergradehub.dao.AssignmentDao;
import edu.hcmute.peergradehub.dao.PeerReviewAssignmentDao;
import edu.hcmute.peergradehub.dao.PeerReviewDao;
import edu.hcmute.peergradehub.dao.StudentGroupDao;
import edu.hcmute.peergradehub.dao.UserDao;
import edu.hcmute.peergradehub.dto.request.peerreview.CreatePeerReviewAssignmentRequest;
import edu.hcmute.peergradehub.dto.response.peerreview.AssignPeerReviewPageResponse;
import edu.hcmute.peergradehub.dto.response.peerreview.DeletePeerReviewAssignmentResponse;
import edu.hcmute.peergradehub.dto.response.peerreview.PeerReviewAssignmentResponse;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.Lesson;
import edu.hcmute.peergradehub.entity.PeerReviewAssignment;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.GroupStatus;
import edu.hcmute.peergradehub.enumeration.ReviewAssignmentStatus;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.exception.ApiException;
import edu.hcmute.peergradehub.exception.BadRequestException;
import edu.hcmute.peergradehub.exception.ConflictException;
import edu.hcmute.peergradehub.exception.ErrorCode;
import edu.hcmute.peergradehub.exception.ForbiddenException;
import edu.hcmute.peergradehub.exception.NotFoundException;
import edu.hcmute.peergradehub.mapper.PeerReviewAssignmentMapper;
import edu.hcmute.peergradehub.service.impl.PeerReviewAssignmentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PeerReviewAssignmentServiceTest {

    private static final Long LECTURER_ID = 2L;
    private static final Long COURSE_ID = 10L;
    private static final Long ASSIGNMENT_ID = 20L;
    private static final Long REVIEWER_GROUP_ID = 30L;
    private static final Long TARGET_GROUP_ID = 31L;

    @Mock
    private AssignmentDao assignmentDao;

    @Mock
    private StudentGroupDao studentGroupDao;

    @Mock
    private PeerReviewAssignmentDao peerReviewAssignmentDao;

    @Mock
    private PeerReviewDao peerReviewDao;

    @Mock
    private UserDao userDao;

    @Spy
    private PeerReviewAssignmentMapper mapper = new PeerReviewAssignmentMapper();

    @InjectMocks
    private PeerReviewAssignmentServiceImpl service;

    private User lecturer;
    private Course course;
    private Assignment assignment;
    private StudentGroup reviewerGroup;
    private StudentGroup targetGroup;

    @BeforeEach
    void setUp() {
        lecturer = User.builder()
                .id(LECTURER_ID)
                .userRole(UserRole.LECTURER)
                .build();
        course = Course.builder()
                .id(COURSE_ID)
                .courseName("OOSE")
                .classCode("OOSE-03")
                .lecturer(lecturer)
                .build();
        Lesson lesson = Lesson.builder().id(15L).course(course).build();
        assignment = Assignment.builder()
                .id(ASSIGNMENT_ID)
                .title("Peer Assessment")
                .lesson(lesson)
                .submissionDeadline(LocalDateTime.now().plusDays(2))
                .reviewDeadline(LocalDateTime.now().plusDays(7))
                .build();
        reviewerGroup = StudentGroup.builder()
                .id(REVIEWER_GROUP_ID)
                .groupName("Group 1")
                .groupStatus(GroupStatus.READY)
                .course(course)
                .build();
        targetGroup = StudentGroup.builder()
                .id(TARGET_GROUP_ID)
                .groupName("Group 2")
                .groupStatus(GroupStatus.READY)
                .course(course)
                .build();
    }

    @Test
    void getAssignPeerReviewPageData_ReturnsPageDataAndWarnings() {
        StudentGroup uncoveredGroup = StudentGroup.builder()
                .id(32L)
                .groupName("Group 3")
                .groupStatus(GroupStatus.FORMING)
                .course(course)
                .build();
        PeerReviewAssignment existing = peerReviewAssignment(100L);
        stubLecturerAndAssignment();
        when(studentGroupDao.findByCourseId(COURSE_ID))
                .thenReturn(List.of(reviewerGroup, targetGroup, uncoveredGroup));
        when(peerReviewAssignmentDao.findByAssignmentId(ASSIGNMENT_ID))
                .thenReturn(List.of(existing));

        AssignPeerReviewPageResponse response =
                service.getAssignPeerReviewPageData(ASSIGNMENT_ID, LECTURER_ID);

        assertEquals(ASSIGNMENT_ID, response.assignment().id());
        assertTrue(response.assignment().reviewDeadlineOpen());
        assertEquals(3, response.groups().size());
        assertEquals(1, response.peerReviewAssignments().size());
        assertEquals(List.of(REVIEWER_GROUP_ID, 32L), response.groupsWithoutReceivedReviews()
                .stream()
                .map(group -> group.id())
                .toList());
    }

    @Test
    void createPeerReviewAssignment_SavesAssignedTask() {
        stubValidCreate();
        when(peerReviewAssignmentDao.saveAndFlush(any(PeerReviewAssignment.class)))
                .thenAnswer(invocation -> {
                    PeerReviewAssignment saved = invocation.getArgument(0);
                    saved.setId(100L);
                    return saved;
                });

        PeerReviewAssignmentResponse response = service.createPeerReviewAssignment(
                ASSIGNMENT_ID,
                validRequest(),
                LECTURER_ID
        );

        assertEquals(100L, response.id());
        assertEquals(REVIEWER_GROUP_ID, response.reviewerGroup().id());
        assertEquals(TARGET_GROUP_ID, response.targetGroup().id());
        assertEquals(ReviewAssignmentStatus.ASSIGNED, response.status());
        assertEquals(LECTURER_ID, response.assignedById());
        assertEquals(assignment.getReviewDeadline(), response.dueAt());
    }

    @Test
    void createPeerReviewAssignment_RejectsMissingReviewerGroup() {
        stubLecturer();

        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                service.createPeerReviewAssignment(
                        ASSIGNMENT_ID,
                        new CreatePeerReviewAssignmentRequest(null, TARGET_GROUP_ID),
                        LECTURER_ID
                ));

        assertEquals(PeerReviewAssignmentServiceImpl.MISSING_GROUPS_MESSAGE, exception.getMessage());
        verify(assignmentDao, never()).findByIdWithCourseAndLecturer(any());
    }

    @Test
    void createPeerReviewAssignment_RejectsMissingTargetGroup() {
        stubLecturer();

        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                service.createPeerReviewAssignment(
                        ASSIGNMENT_ID,
                        new CreatePeerReviewAssignmentRequest(REVIEWER_GROUP_ID, null),
                        LECTURER_ID
                ));

        assertEquals(PeerReviewAssignmentServiceImpl.MISSING_GROUPS_MESSAGE, exception.getMessage());
    }

    @Test
    void createPeerReviewAssignment_RejectsBothGroupsMissing() {
        stubLecturer();

        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                service.createPeerReviewAssignment(
                        ASSIGNMENT_ID,
                        new CreatePeerReviewAssignmentRequest(null, null),
                        LECTURER_ID
                ));

        assertEquals(PeerReviewAssignmentServiceImpl.MISSING_GROUPS_MESSAGE, exception.getMessage());
    }

    @Test
    void createPeerReviewAssignment_RejectsSelfReview() {
        stubLecturerAndAssignment();
        when(studentGroupDao.findByIdAndCourseId(REVIEWER_GROUP_ID, COURSE_ID))
                .thenReturn(Optional.of(reviewerGroup));

        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                service.createPeerReviewAssignment(
                        ASSIGNMENT_ID,
                        new CreatePeerReviewAssignmentRequest(REVIEWER_GROUP_ID, REVIEWER_GROUP_ID),
                        LECTURER_ID
                ));

        assertEquals(PeerReviewAssignmentServiceImpl.SELF_REVIEW_MESSAGE, exception.getMessage());
        verify(peerReviewAssignmentDao, never()).saveAndFlush(any());
    }

    @Test
    void createPeerReviewAssignment_RejectsDuplicatePair() {
        stubValidCreate();
        when(peerReviewAssignmentDao.findByAssignmentIdAndReviewerGroupIdAndRevieweeGroupId(
                ASSIGNMENT_ID,
                REVIEWER_GROUP_ID,
                TARGET_GROUP_ID
        )).thenReturn(Optional.of(peerReviewAssignment(100L)));

        ConflictException exception = assertThrows(ConflictException.class, () ->
                service.createPeerReviewAssignment(ASSIGNMENT_ID, validRequest(), LECTURER_ID));

        assertEquals(PeerReviewAssignmentServiceImpl.DUPLICATE_PAIR_MESSAGE, exception.getMessage());
        verify(peerReviewAssignmentDao, never()).saveAndFlush(any());
    }

    @Test
    void createPeerReviewAssignment_RejectsReviewerGroupOutsideCourse() {
        stubLecturerAndAssignment();
        when(studentGroupDao.findByIdAndCourseId(REVIEWER_GROUP_ID, COURSE_ID))
                .thenReturn(Optional.empty());

        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                service.createPeerReviewAssignment(ASSIGNMENT_ID, validRequest(), LECTURER_ID));

        assertEquals(PeerReviewAssignmentServiceImpl.INVALID_GROUPS_MESSAGE, exception.getMessage());
    }

    @Test
    void createPeerReviewAssignment_RejectsTargetGroupOutsideCourse() {
        stubLecturerAndAssignment();
        when(studentGroupDao.findByIdAndCourseId(REVIEWER_GROUP_ID, COURSE_ID))
                .thenReturn(Optional.of(reviewerGroup));
        when(studentGroupDao.findByIdAndCourseId(TARGET_GROUP_ID, COURSE_ID))
                .thenReturn(Optional.empty());

        BadRequestException exception = assertThrows(BadRequestException.class, () ->
                service.createPeerReviewAssignment(ASSIGNMENT_ID, validRequest(), LECTURER_ID));

        assertEquals(PeerReviewAssignmentServiceImpl.INVALID_GROUPS_MESSAGE, exception.getMessage());
    }

    @Test
    void createPeerReviewAssignment_RejectsPassedDeadline() {
        assignment.setReviewDeadline(LocalDateTime.now().minusMinutes(1));
        stubLecturerAndAssignment();
        stubGroups();

        ConflictException exception = assertThrows(ConflictException.class, () ->
                service.createPeerReviewAssignment(ASSIGNMENT_ID, validRequest(), LECTURER_ID));

        assertEquals(PeerReviewAssignmentServiceImpl.DEADLINE_PASSED_MESSAGE, exception.getMessage());
        verify(peerReviewAssignmentDao, never()).saveAndFlush(any());
    }

    @Test
    void createPeerReviewAssignment_MapsSaveFailureToExactSystemMessage() {
        stubValidCreate();
        when(peerReviewAssignmentDao.saveAndFlush(any(PeerReviewAssignment.class)))
                .thenThrow(new DataAccessResourceFailureException("database unavailable"));

        ApiException exception = assertThrows(ApiException.class, () ->
                service.createPeerReviewAssignment(ASSIGNMENT_ID, validRequest(), LECTURER_ID));

        assertEquals(ErrorCode.INTERNAL_SERVER_ERROR, exception.getErrorCode());
        assertEquals(PeerReviewAssignmentServiceImpl.SAVE_ERROR_MESSAGE, exception.getMessage());
    }

    @Test
    void createPeerReviewAssignment_MapsIdentifiedUniqueConstraintToDuplicateMessage() {
        stubValidCreate();
        when(peerReviewAssignmentDao.saveAndFlush(any(PeerReviewAssignment.class)))
                .thenThrow(new DataIntegrityViolationException("uk_peer_review_assignments_pair"));

        ConflictException exception = assertThrows(ConflictException.class, () ->
                service.createPeerReviewAssignment(ASSIGNMENT_ID, validRequest(), LECTURER_ID));

        assertEquals(PeerReviewAssignmentServiceImpl.DUPLICATE_PAIR_MESSAGE, exception.getMessage());
    }

    @Test
    void deletePeerReviewAssignment_DeletesWhenNoReviewExists() {
        PeerReviewAssignment peerReviewAssignment = peerReviewAssignment(100L);
        stubLecturer();
        when(peerReviewAssignmentDao.findByIdWithAssignmentCourseAndLecturer(100L))
                .thenReturn(Optional.of(peerReviewAssignment));
        when(peerReviewDao.existsByPeerReviewAssignmentId(100L)).thenReturn(false);

        DeletePeerReviewAssignmentResponse response =
                service.deletePeerReviewAssignment(100L, LECTURER_ID);

        assertEquals(100L, response.peerReviewAssignmentId());
        verify(peerReviewAssignmentDao).deleteById(100L);
    }

    @Test
    void deletePeerReviewAssignment_BlocksWhenAnyReviewExists() {
        PeerReviewAssignment peerReviewAssignment = peerReviewAssignment(100L);
        stubLecturer();
        when(peerReviewAssignmentDao.findByIdWithAssignmentCourseAndLecturer(100L))
                .thenReturn(Optional.of(peerReviewAssignment));
        when(peerReviewDao.existsByPeerReviewAssignmentId(100L)).thenReturn(true);

        ConflictException exception = assertThrows(ConflictException.class, () ->
                service.deletePeerReviewAssignment(100L, LECTURER_ID));

        assertEquals(PeerReviewAssignmentServiceImpl.DELETE_BLOCKED_MESSAGE, exception.getMessage());
        verify(peerReviewAssignmentDao, never()).deleteById(any());
    }

    @Test
    void getAssignPeerReviewPageData_RejectsNonLecturer() {
        User student = User.builder().id(40L).userRole(UserRole.STUDENT).build();
        when(userDao.findById(40L)).thenReturn(Optional.of(student));

        assertThrows(ForbiddenException.class, () ->
                service.getAssignPeerReviewPageData(ASSIGNMENT_ID, 40L));
        verify(assignmentDao, never()).findByIdWithCourseAndLecturer(any());
    }

    @Test
    void getAssignPeerReviewPageData_RejectsLecturerWhoDoesNotOwnCourse() {
        User otherLecturer = User.builder().id(99L).userRole(UserRole.LECTURER).build();
        when(userDao.findById(99L)).thenReturn(Optional.of(otherLecturer));
        when(assignmentDao.findByIdWithCourseAndLecturer(ASSIGNMENT_ID))
                .thenReturn(Optional.of(assignment));

        assertThrows(ForbiddenException.class, () ->
                service.getAssignPeerReviewPageData(ASSIGNMENT_ID, 99L));
    }

    @Test
    void getAssignPeerReviewPageData_ReturnsNotFoundForMissingAssignment() {
        stubLecturer();
        when(assignmentDao.findByIdWithCourseAndLecturer(ASSIGNMENT_ID))
                .thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () ->
                service.getAssignPeerReviewPageData(ASSIGNMENT_ID, LECTURER_ID));
    }

    @Test
    void deletePeerReviewAssignment_ReturnsNotFoundForMissingTask() {
        stubLecturer();
        when(peerReviewAssignmentDao.findByIdWithAssignmentCourseAndLecturer(100L))
                .thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () ->
                service.deletePeerReviewAssignment(100L, LECTURER_ID));
    }

    private void stubLecturer() {
        when(userDao.findById(LECTURER_ID)).thenReturn(Optional.of(lecturer));
    }

    private void stubLecturerAndAssignment() {
        stubLecturer();
        when(assignmentDao.findByIdWithCourseAndLecturer(ASSIGNMENT_ID))
                .thenReturn(Optional.of(assignment));
    }

    private void stubGroups() {
        when(studentGroupDao.findByIdAndCourseId(REVIEWER_GROUP_ID, COURSE_ID))
                .thenReturn(Optional.of(reviewerGroup));
        when(studentGroupDao.findByIdAndCourseId(TARGET_GROUP_ID, COURSE_ID))
                .thenReturn(Optional.of(targetGroup));
    }

    private void stubValidCreate() {
        stubLecturerAndAssignment();
        stubGroups();
        when(peerReviewAssignmentDao.findByAssignmentIdAndReviewerGroupIdAndRevieweeGroupId(
                ASSIGNMENT_ID,
                REVIEWER_GROUP_ID,
                TARGET_GROUP_ID
        )).thenReturn(Optional.empty());
    }

    private CreatePeerReviewAssignmentRequest validRequest() {
        return new CreatePeerReviewAssignmentRequest(REVIEWER_GROUP_ID, TARGET_GROUP_ID);
    }

    private PeerReviewAssignment peerReviewAssignment(Long id) {
        return PeerReviewAssignment.builder()
                .id(id)
                .assignment(assignment)
                .reviewerGroup(reviewerGroup)
                .revieweeGroup(targetGroup)
                .assignedBy(lecturer)
                .reviewAssignmentStatus(ReviewAssignmentStatus.ASSIGNED)
                .dueAt(assignment.getReviewDeadline())
                .build();
    }
}

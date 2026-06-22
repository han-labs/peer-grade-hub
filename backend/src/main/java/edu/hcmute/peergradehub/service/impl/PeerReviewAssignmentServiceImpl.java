package edu.hcmute.peergradehub.service.impl;

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
import edu.hcmute.peergradehub.entity.PeerReviewAssignment;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.ReviewAssignmentStatus;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.exception.ApiException;
import edu.hcmute.peergradehub.exception.BadRequestException;
import edu.hcmute.peergradehub.exception.ConflictException;
import edu.hcmute.peergradehub.exception.ErrorCode;
import edu.hcmute.peergradehub.exception.ForbiddenException;
import edu.hcmute.peergradehub.exception.NotFoundException;
import edu.hcmute.peergradehub.exception.UnauthorizedException;
import edu.hcmute.peergradehub.mapper.PeerReviewAssignmentMapper;
import edu.hcmute.peergradehub.service.PeerReviewAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PeerReviewAssignmentServiceImpl implements PeerReviewAssignmentService {

    public static final String MISSING_GROUPS_MESSAGE =
            "Please select both a reviewer group and a target group before assigning a peer review task.";
    public static final String SELF_REVIEW_MESSAGE =
            "A group cannot review its own submission. Please select a different target group.";
    public static final String DUPLICATE_PAIR_MESSAGE =
            "This reviewer group has already been assigned to review the selected target group. "
                    + "Please choose a different pair.";
    public static final String INVALID_GROUPS_MESSAGE =
            "Selected groups must belong to the same course as this assignment. "
                    + "Please select valid course groups.";
    public static final String DEADLINE_PASSED_MESSAGE =
            "Cannot add or modify peer review assignments because the peer review deadline has passed. "
                    + "Please extend the peer review deadline before assigning review tasks.";
    public static final String SAVE_ERROR_MESSAGE =
            "Peer review assignment could not be saved due to a system error. Please try again.";
    public static final String DELETE_BLOCKED_MESSAGE =
            "Cannot delete this peer review assignment because a review has already been submitted. "
                    + "Please keep the task or contact the system administrator for further support.";

    private static final String DUPLICATE_CONSTRAINT_NAME = "uk_peer_review_assignments_pair";

    private final AssignmentDao assignmentDao;
    private final StudentGroupDao studentGroupDao;
    private final PeerReviewAssignmentDao peerReviewAssignmentDao;
    private final PeerReviewDao peerReviewDao;
    private final UserDao userDao;
    private final PeerReviewAssignmentMapper mapper;

    @Override
    public AssignPeerReviewPageResponse getAssignPeerReviewPageData(Long assignmentId, Long lecturerId) {
        requireLecturer(lecturerId);
        Assignment assignment = requireAssignment(assignmentId);
        Course course = requireOwnedCourse(assignment, lecturerId);

        List<StudentGroup> groups = studentGroupDao.findByCourseId(course.getId());
        List<PeerReviewAssignment> peerReviewAssignments =
                peerReviewAssignmentDao.findByAssignmentId(assignmentId);
        List<StudentGroup> groupsWithoutReceivedReviews =
                findGroupsWithoutReceivedReviews(groups, peerReviewAssignments);

        return mapper.toPageResponse(
                assignment,
                course,
                assignment.isReviewOpen(LocalDateTime.now()),
                groups,
                peerReviewAssignments,
                groupsWithoutReceivedReviews
        );
    }

    @Override
    @Transactional
    public PeerReviewAssignmentResponse createPeerReviewAssignment(
            Long assignmentId,
            CreatePeerReviewAssignmentRequest request,
            Long lecturerId
    ) {
        User lecturer = requireLecturer(lecturerId);
        validateSelectedGroups(request);

        Assignment assignment = requireAssignment(assignmentId);
        Course course = requireOwnedCourse(assignment, lecturerId);
        StudentGroup reviewerGroup = requireCourseGroup(request.reviewerGroupId(), course.getId());
        StudentGroup targetGroup = requireCourseGroup(request.targetGroupId(), course.getId());

        PeerReviewAssignment peerReviewAssignment = PeerReviewAssignment.builder()
                .assignment(assignment)
                .reviewerGroup(reviewerGroup)
                .revieweeGroup(targetGroup)
                .assignedBy(lecturer)
                .reviewAssignmentStatus(ReviewAssignmentStatus.ASSIGNED)
                .dueAt(assignment.getReviewDeadline())
                .build();

        if (peerReviewAssignment.isSelfReview()) {
            throw new BadRequestException(SELF_REVIEW_MESSAGE);
        }
        if (!assignment.isReviewOpen(LocalDateTime.now())) {
            throw new ConflictException(DEADLINE_PASSED_MESSAGE);
        }
        if (peerReviewAssignmentDao
                .findByAssignmentIdAndReviewerGroupIdAndRevieweeGroupId(
                        assignmentId,
                        reviewerGroup.getId(),
                        targetGroup.getId()
                )
                .isPresent()) {
            throw new ConflictException(DUPLICATE_PAIR_MESSAGE);
        }

        try {
            return mapper.toResponse(peerReviewAssignmentDao.saveAndFlush(peerReviewAssignment));
        } catch (DataIntegrityViolationException exception) {
            if (isDuplicatePairConstraint(exception)) {
                throw new ConflictException(DUPLICATE_PAIR_MESSAGE);
            }
            throw saveException();
        } catch (DataAccessException exception) {
            throw saveException();
        }
    }

    @Override
    @Transactional
    public DeletePeerReviewAssignmentResponse deletePeerReviewAssignment(
            Long peerReviewAssignmentId,
            Long lecturerId
    ) {
        requireLecturer(lecturerId);
        PeerReviewAssignment peerReviewAssignment = peerReviewAssignmentDao
                .findByIdWithAssignmentCourseAndLecturer(peerReviewAssignmentId)
                .orElseThrow(NotFoundException::new);
        requireOwnedCourse(peerReviewAssignment.getAssignment(), lecturerId);

        if (peerReviewDao.existsByPeerReviewAssignmentId(peerReviewAssignmentId)) {
            throw new ConflictException(DELETE_BLOCKED_MESSAGE);
        }

        peerReviewAssignmentDao.deleteById(peerReviewAssignmentId);
        return new DeletePeerReviewAssignmentResponse(peerReviewAssignmentId);
    }

    private User requireLecturer(Long lecturerId) {
        if (lecturerId == null) {
            throw new UnauthorizedException();
        }

        User user = userDao.findById(lecturerId).orElseThrow(UnauthorizedException::new);
        if (user.getUserRole() != UserRole.LECTURER) {
            throw new ForbiddenException();
        }
        return user;
    }

    private Assignment requireAssignment(Long assignmentId) {
        if (assignmentId == null) {
            throw new NotFoundException();
        }
        return assignmentDao.findByIdWithCourseAndLecturer(assignmentId)
                .orElseThrow(NotFoundException::new);
    }

    private Course requireOwnedCourse(Assignment assignment, Long lecturerId) {
        if (assignment.getLesson() == null || assignment.getLesson().getCourse() == null) {
            throw new NotFoundException();
        }

        Course course = assignment.getLesson().getCourse();
        if (course.getLecturer() == null
                || course.getLecturer().getId() == null
                || !course.getLecturer().getId().equals(lecturerId)) {
            throw new ForbiddenException();
        }
        return course;
    }

    private void validateSelectedGroups(CreatePeerReviewAssignmentRequest request) {
        if (request == null || request.reviewerGroupId() == null || request.targetGroupId() == null) {
            throw new BadRequestException(MISSING_GROUPS_MESSAGE);
        }
    }

    private StudentGroup requireCourseGroup(Long groupId, Long courseId) {
        return studentGroupDao.findByIdAndCourseId(groupId, courseId)
                .orElseThrow(() -> new BadRequestException(INVALID_GROUPS_MESSAGE));
    }

    private List<StudentGroup> findGroupsWithoutReceivedReviews(
            List<StudentGroup> groups,
            List<PeerReviewAssignment> peerReviewAssignments
    ) {
        Set<Long> targetGroupIds = new HashSet<>();
        for (PeerReviewAssignment peerReviewAssignment : peerReviewAssignments) {
            if (peerReviewAssignment.getRevieweeGroup() != null
                    && peerReviewAssignment.getRevieweeGroup().getId() != null) {
                targetGroupIds.add(peerReviewAssignment.getRevieweeGroup().getId());
            }
        }

        return groups.stream()
                .filter(group -> !targetGroupIds.contains(group.getId()))
                .toList();
    }

    private boolean isDuplicatePairConstraint(Throwable exception) {
        Throwable current = exception;
        while (current != null) {
            String message = current.getMessage();
            if (message != null
                    && message.toLowerCase(Locale.ROOT).contains(DUPLICATE_CONSTRAINT_NAME)) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private ApiException saveException() {
        return new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, SAVE_ERROR_MESSAGE);
    }
}

package edu.hcmute.peergradehub.service.impl;

import edu.hcmute.peergradehub.dao.*;
import edu.hcmute.peergradehub.dto.request.peerreview.SubmitPeerReviewRequest;
import edu.hcmute.peergradehub.dto.response.peerreview.PeerReviewDetailResponse;
import edu.hcmute.peergradehub.dto.response.peerreview.SubmitPeerReviewResponse;
import edu.hcmute.peergradehub.entity.*;
import edu.hcmute.peergradehub.enumeration.ReviewAssignmentStatus;
import edu.hcmute.peergradehub.enumeration.ReviewStatus;
import edu.hcmute.peergradehub.enumeration.SubmissionStatus;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.enumeration.UserStatus;
import edu.hcmute.peergradehub.exception.*;
import edu.hcmute.peergradehub.mapper.PeerReviewMapper;
import edu.hcmute.peergradehub.service.PeerReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PeerReviewServiceImpl implements PeerReviewService {

    public static final String NOT_ASSIGNED_MESSAGE = "No peer review task is assigned to you.";
    public static final String SUBMISSION_UNAVAILABLE_MESSAGE = "The assigned submission is currently unavailable. Please contact your lecturer.";
    public static final String DEADLINE_PASSED_MESSAGE = "Peer review deadline has passed.";
    public static final String COMMENT_TOO_SHORT_MESSAGE = "Comment must be at least 10 characters.";
    public static final String INVALID_SCORE_MESSAGE = "Score must be between 0 and 100.";

    private static final BigDecimal MAX_SCORE = BigDecimal.valueOf(100);

    private final UserDao userDao;
    private final PeerReviewAssignmentDao peerReviewAssignmentDao;
    private final PeerReviewDao peerReviewDao;
    private final AssignmentSubmissionDao assignmentSubmissionDao;
    private final SubmissionAttachmentDao submissionAttachmentDao;
    private final LessonMaterialDao lessonMaterialDao;
    private final GroupMemberDao groupMemberDao;
    private final PeerReviewMapper mapper;

    @Override
    public PeerReviewDetailResponse getReviewTask(Long reviewTaskId, Long studentId) {
        User student = requireStudent(studentId);
        PeerReviewAssignment task = requirePeerReviewAssignment(reviewTaskId);
        verifyGroupMembership(task, student.getId());

        AssignmentSubmission submission = getAndVerifySubmission(task);
        List<SubmissionAttachment> attachments = submissionAttachmentDao.findByAssignmentSubmissionId(submission.getId());
        List<LessonMaterial> guidelines = lessonMaterialDao.findByAssignmentId(task.getAssignment().getId());
        PeerReview existingReview = peerReviewDao.findByPeerReviewAssignmentId(task.getId()).orElse(null);

        return mapper.toDetailResponse(task, submission, attachments, guidelines, existingReview);
    }

    @Override
    @Transactional
    public SubmitPeerReviewResponse submitReview(
            Long reviewTaskId,
            SubmitPeerReviewRequest request,
            Long studentId
    ) {
        User student = requireStudent(studentId);
        PeerReviewAssignment task = requirePeerReviewAssignment(reviewTaskId);
        verifyGroupMembership(task, student.getId());

        // Validate submission status/existence
        getAndVerifySubmission(task);

        // Validate deadline
        LocalDateTime now = LocalDateTime.now();
        if (task.getDueAt() != null && now.isAfter(task.getDueAt())) {
            throw new ConflictException(DEADLINE_PASSED_MESSAGE);
        }

        // Validate score
        BigDecimal score = request.score();
        if (score == null || score.compareTo(BigDecimal.ZERO) < 0 || score.compareTo(MAX_SCORE) > 0) {
            throw new BadRequestException(INVALID_SCORE_MESSAGE);
        }

        // Validate comment
        String comment = request.comment();
        if (comment == null || comment.trim().length() < 10) {
            throw new BadRequestException(COMMENT_TOO_SHORT_MESSAGE);
        }
        comment = comment.trim();

        PeerReview review = peerReviewDao.findByPeerReviewAssignmentId(task.getId()).orElse(null);
        if (review == null) {
            review = PeerReview.builder()
                    .peerReviewAssignment(task)
                    .submittedBy(student)
                    .reviewStatus(ReviewStatus.SUBMITTED)
                    .score(score)
                    .comment(comment)
                    .submittedAt(now)
                    .build();
        } else {
            review.setReviewStatus(ReviewStatus.SUBMITTED);
            review.setScore(score);
            review.setComment(comment);
            review.setSubmittedAt(now);
        }

        // Update PeerReviewAssignment status to SUBMITTED
        task.setReviewAssignmentStatus(ReviewAssignmentStatus.SUBMITTED);
        peerReviewAssignmentDao.save(task);

        PeerReview saved = peerReviewDao.save(review);

        return new SubmitPeerReviewResponse(
                saved.getId(),
                saved.getSubmittedAt()
        );
    }

    private User requireStudent(Long studentId) {
        if (studentId == null) {
            throw new UnauthorizedException();
        }
        User user = userDao.findById(studentId).orElseThrow(UnauthorizedException::new);
        if (user.getUserRole() != UserRole.STUDENT) {
            throw new ForbiddenException("Only students can perform peer reviews.");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new ForbiddenException("Your account is locked or inactive. Please contact the administrator.");
        }
        return user;
    }

    private PeerReviewAssignment requirePeerReviewAssignment(Long id) {
        if (id == null) {
            throw new NotFoundException();
        }
        return peerReviewAssignmentDao.findByIdWithAssignmentCourseAndLecturer(id)
                .orElseThrow(NotFoundException::new);
    }

    private void verifyGroupMembership(PeerReviewAssignment task, Long studentId) {
        if (task.getReviewerGroup() == null) {
            throw new ForbiddenException(NOT_ASSIGNED_MESSAGE);
        }
        boolean isMember = groupMemberDao.existsByGroupIdAndUserId(task.getReviewerGroup().getId(), studentId);
        if (!isMember) {
            throw new ForbiddenException(NOT_ASSIGNED_MESSAGE);
        }
    }

    private AssignmentSubmission getAndVerifySubmission(PeerReviewAssignment task) {
        if (task.getRevieweeGroup() == null || task.getAssignment() == null) {
            throw new BadRequestException(SUBMISSION_UNAVAILABLE_MESSAGE);
        }
        AssignmentSubmission submission = assignmentSubmissionDao.findByAssignmentIdAndGroupId(
                task.getAssignment().getId(),
                task.getRevieweeGroup().getId()
        ).orElse(null);

        if (submission == null || submission.getSubmissionStatus() == SubmissionStatus.DRAFT) {
            throw new BadRequestException(SUBMISSION_UNAVAILABLE_MESSAGE);
        }
        return submission;
    }
}

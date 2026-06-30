package edu.hcmute.peergradehub.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import edu.hcmute.peergradehub.dao.AssignmentDao;
import edu.hcmute.peergradehub.dao.AssignmentResultDao;
import edu.hcmute.peergradehub.dao.AssignmentSubmissionDao;
import edu.hcmute.peergradehub.dao.PeerReviewAssignmentDao;
import edu.hcmute.peergradehub.dao.PeerReviewDao;
import edu.hcmute.peergradehub.dao.StudentGroupDao;
import edu.hcmute.peergradehub.dao.UserDao;
import edu.hcmute.peergradehub.dto.request.grade.PublishGradeRequest;
import edu.hcmute.peergradehub.dto.request.grade.SaveDraftGradeRequest;
import edu.hcmute.peergradehub.dto.request.grade.ToggleShowcaseRequest;
import edu.hcmute.peergradehub.dto.request.grade.UnpublishGradeRequest;
import edu.hcmute.peergradehub.dto.response.grade.GradeDraftResponse;
import edu.hcmute.peergradehub.dto.response.grade.GradingDataResponse;
import edu.hcmute.peergradehub.dto.response.grade.GradingEvidenceResponse;
import edu.hcmute.peergradehub.dto.response.grade.PeerReviewEvidenceResponse;
import edu.hcmute.peergradehub.dto.response.grade.PublishGradeResponse;
import edu.hcmute.peergradehub.dto.response.grade.ShowcaseStatusResponse;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.AssignmentResult;
import edu.hcmute.peergradehub.entity.AssignmentSubmission;
import edu.hcmute.peergradehub.entity.PeerReview;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.entity.SubmissionAttachment;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.exception.BadRequestException;
import edu.hcmute.peergradehub.exception.ForbiddenException;
import edu.hcmute.peergradehub.exception.GradeValidationException;
import edu.hcmute.peergradehub.exception.NoSubmissionException;
import edu.hcmute.peergradehub.exception.NotFoundException;
import edu.hcmute.peergradehub.mapper.GradeMapper;
import edu.hcmute.peergradehub.service.GradeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of GradeService for UC-09 Manage Final Grades.
 * Follows GRASP patterns: Controller, Expert, High Cohesion, Low Coupling.
 * Uses Facade pattern: Controller -> GradeService -> DAOs.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GradeServiceImpl implements GradeService {

    private final AssignmentDao assignmentDao;
    private final AssignmentResultDao assignmentResultDao;
    private final AssignmentSubmissionDao assignmentSubmissionDao;
    private final PeerReviewAssignmentDao peerReviewAssignmentDao;
    private final PeerReviewDao peerReviewDao;
    private final StudentGroupDao studentGroupDao;
    private final UserDao userDao;
    private final GradeMapper gradeMapper;

    private static final int MAX_COMMENT_LENGTH = 2000;
    private static final BigDecimal MIN_SCORE = BigDecimal.ZERO;
    private static final BigDecimal MAX_SCORE = BigDecimal.valueOf(100);

    // ============================================================
    // ===== MAIN FLOW =====
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public GradingDataResponse getGradingData(Long assignmentId, Long lecturerId) {
        log.info("Fetching grading data for assignment: {} by lecturer: {}", assignmentId, lecturerId);

        // 1. Validate lecturer permission
        Assignment assignment = validateLecturerPermission(assignmentId, lecturerId);

        // 2. Get all groups for this course
        Long courseId = assignment.getLesson().getCourse().getId();
        List<StudentGroup> groups = studentGroupDao.findByCourseIdWithMembers(courseId);

        // 3. Get all submissions for this assignment
        List<AssignmentSubmission> submissions = assignmentSubmissionDao
                .findByAssignmentIdWithGroupAndSubmitter(assignmentId);
        Map<Long, AssignmentSubmission> submissionMap = submissions.stream()
                .collect(Collectors.toMap(
                        s -> s.getGroup().getId(),
                        s -> s,
                        (existing, replacement) -> existing
                ));

        // ===== Lấy attachments cho từng submission =====
        Map<Long, List<GradingEvidenceResponse.SubmissionAttachmentInfo>> attachmentMap = new HashMap<>();
        for (AssignmentSubmission submission : submissions) {
            Long groupId = submission.getGroup().getId();
            List<GradingEvidenceResponse.SubmissionAttachmentInfo> attachments = new ArrayList<>();
            
            if (submission.getAttachments() != null && !submission.getAttachments().isEmpty()) {
                for (SubmissionAttachment attachment : submission.getAttachments()) {
                    GradingEvidenceResponse.SubmissionAttachmentInfo info = gradeMapper.toSubmissionAttachmentInfo(attachment);
                    if (info != null) {
                        attachments.add(info);
                    }
                }
            }
            attachmentMap.put(groupId, attachments);
        }

        // 4. Get all peer reviews for this assignment
        List<PeerReview> peerReviews = peerReviewDao.findByAssignmentId(assignmentId);
        Map<Long, List<PeerReview>> peerReviewsByRevieweeGroup = new HashMap<>();
        Map<Long, List<PeerReviewEvidenceResponse>> peerReviewEvidenceMap = new HashMap<>();
        
        for (PeerReview review : peerReviews) {
            Long revieweeGroupId = review.getPeerReviewAssignment().getRevieweeGroup().getId();
            peerReviewsByRevieweeGroup.computeIfAbsent(revieweeGroupId, k -> new ArrayList<>())
                    .add(review);
            
            StudentGroup reviewerGroup = review.getPeerReviewAssignment().getReviewerGroup();
            PeerReviewEvidenceResponse evidence = gradeMapper.toPeerReviewEvidenceResponse(review, reviewerGroup);
            peerReviewEvidenceMap.computeIfAbsent(revieweeGroupId, k -> new ArrayList<>())
                    .add(evidence);
        }

        // 5. Get all existing results for this assignment
        List<AssignmentResult> results = assignmentResultDao
                .findByAssignmentIdWithGroupAndPublishers(assignmentId);
        Map<Long, AssignmentResult> resultMap = results.stream()
                .collect(Collectors.toMap(
                        r -> r.getGroup().getId(),
                        r -> r,
                        (existing, replacement) -> existing
                ));

        // 6. Build response for each group
        List<GradingEvidenceResponse> evidenceResponses = new ArrayList<>();
        for (StudentGroup group : groups) {
            Long groupId = group.getId();
            Boolean hasSubmission = submissionMap.containsKey(groupId);
            Boolean hasPeerReview = peerReviewsByRevieweeGroup.containsKey(groupId);
            Long peerReviewCount = hasPeerReview ? (long) peerReviewsByRevieweeGroup.get(groupId).size() : 0L;
            List<PeerReviewEvidenceResponse> peerReviewList = peerReviewEvidenceMap.getOrDefault(groupId, new ArrayList<>());
            
            AssignmentSubmission submission = submissionMap.get(groupId);
            AssignmentResult result = resultMap.get(groupId);
            
            String publishedByName = null;
            if (result != null && result.getPublished() && result.getPublishedBy() != null) {
                publishedByName = result.getPublishedBy().getFullName();
            }
            
            GradingEvidenceResponse evidence = gradeMapper.toGradingEvidenceResponse(
                    group,
                    hasSubmission,
                    submission,
                    hasPeerReview,
                    peerReviewCount,
                    peerReviewList,
                    result,
                    publishedByName,
                    hasSubmission
            );
            
            // ===== SET ATTACHMENTS =====
            List<GradingEvidenceResponse.SubmissionAttachmentInfo> attachments = attachmentMap.getOrDefault(groupId, new ArrayList<>());
            evidence.setAttachments(attachments);
            
            evidenceResponses.add(evidence);
        }

        // 7. Calculate statistics
        Long submittedCount = groups.stream()
                .filter(g -> submissionMap.containsKey(g.getId()))
                .count();
        Long reviewedCount = groups.stream()
                .filter(g -> peerReviewsByRevieweeGroup.containsKey(g.getId()))
                .count();

        String lecturerName = userDao.findById(lecturerId)
                .map(User::getFullName)
                .orElse("Unknown Lecturer");

        // 8. Build and return response
        return new GradingDataResponse(
                assignment.getId(),
                assignment.getTitle(),
                assignment.getDescription(),
                gradeMapper.formatDateTime(assignment.getSubmissionDeadline()),
                gradeMapper.formatDateTime(assignment.getReviewDeadline()),
                assignment.getShowcaseMode(),
                evidenceResponses,
                lecturerName,
                lecturerId,
                (long) groups.size(),
                submittedCount,
                reviewedCount
        );
    }

    @Override
    @Transactional
    public PublishGradeResponse publishGrades(PublishGradeRequest request, Long lecturerId) {
        log.info("Publishing grades for assignment: {} by lecturer: {}", 
                request.getAssignmentId(), lecturerId);

        if (request.getGroupIds() == null || request.getGroupIds().isEmpty()) {
            throw GradeValidationException.noGroupSelected();
        }

        Assignment assignment = validateLecturerPermission(request.getAssignmentId(), lecturerId);

        String lecturerName = userDao.findById(lecturerId)
                .map(User::getFullName)
                .orElse("Unknown Lecturer");

        List<PublishGradeResponse.PublishedGroupResult> results = new ArrayList<>();
        Map<Long, PublishGradeRequest.GradeEntry> gradeEntryMap = request.getGrades().stream()
                .collect(Collectors.toMap(
                        PublishGradeRequest.GradeEntry::getGroupId,
                        e -> e
                ));

        for (Long groupId : request.getGroupIds()) {
            PublishGradeResponse.PublishedGroupResult result = processGroupPublish(
                    assignment,
                    groupId,
                    gradeEntryMap.get(groupId),
                    lecturerId
            );
            results.add(result);
        }

        return gradeMapper.toPublishGradeResponse(assignment, results, lecturerName);
    }

    @Override
    @Transactional
    public ShowcaseStatusResponse toggleShowcase(ToggleShowcaseRequest request, Long lecturerId) {
        log.info("Toggling showcase mode for assignment: {} to {} by lecturer: {}", 
                request.getAssignmentId(), request.getEnabled(), lecturerId);

        Assignment assignment = validateLecturerPermission(request.getAssignmentId(), lecturerId);

        try {
            int updated = assignmentDao.updateShowcaseMode(request.getAssignmentId(), request.getEnabled());
            
            if (updated == 0) {
                throw new BadRequestException(
                    "Could not change Showcase Mode due to a system error. Please try again."
                );
            }

            String updatedBy = userDao.findById(lecturerId)
                    .map(User::getFullName)
                    .orElse("Unknown Lecturer");

            return gradeMapper.toShowcaseStatusResponse(
                    request.getAssignmentId(),
                    assignment.getTitle(),
                    request.getEnabled(),
                    updatedBy,
                    lecturerId
            );

        } catch (Exception e) {
            log.error("Error toggling showcase mode: {}", e.getMessage());
            throw new BadRequestException(
                "Could not change Showcase Mode due to a system error. Please try again."
            );
        }
    }

    // ============================================================
    // ===== ALTERNATE FLOWS =====
    // ============================================================

    @Override
    @Transactional
    public GradeDraftResponse saveDraft(SaveDraftGradeRequest request, Long lecturerId) {
        log.info("Saving grade draft for assignment: {}, group: {} by lecturer: {}", 
                request.getAssignmentId(), request.getGroupId(), lecturerId);

        Assignment assignment = validateLecturerPermission(request.getAssignmentId(), lecturerId);

        if (!validateCommentLength(request.getComment())) {
            throw GradeValidationException.commentTooLong();
        }

        StudentGroup group = studentGroupDao.findById(request.getGroupId())
                .orElseThrow(() -> new NotFoundException("Group not found"));

        Optional<AssignmentResult> existingResult = assignmentResultDao
                .findByAssignmentIdAndGroupId(request.getAssignmentId(), request.getGroupId());

        AssignmentResult result;
        if (existingResult.isPresent()) {
            result = existingResult.get();
            result.setScore(request.getScore());
            result.setFinalComment(request.getComment());
            result.setPublished(false);
            result.setPublishedAt(null);
            result.setPublishedBy(null);
            result.setGradedAt(LocalDateTime.now());
            result.setGradedBy(userDao.findById(lecturerId).orElse(null));
            result = assignmentResultDao.save(result);
        } else {
            result = AssignmentResult.builder()
                    .assignment(assignment)
                    .group(group)
                    .score(request.getScore())
                    .finalComment(request.getComment())
                    .published(false)
                    .gradedAt(LocalDateTime.now())
                    .gradedBy(userDao.findById(lecturerId).orElse(null))
                    .build();
            result = assignmentResultDao.save(result);
        }

        return gradeMapper.toGradeDraftResponse(
                request.getAssignmentId(),
                assignment.getTitle(),
                request.getGroupId(),
                group.getGroupName(),
                result.getScore(),
                result.getFinalComment(),
                false,
                "Grades have been saved as draft. Students cannot view them until they are published."
        );
    }

    @Override
    @Transactional
    public GradeDraftResponse unpublishGrade(UnpublishGradeRequest request, Long lecturerId) {
        log.info("Unpublishing grade for assignment: {}, group: {} by lecturer: {}", 
                request.getAssignmentId(), request.getGroupId(), lecturerId);

        Assignment assignment = validateLecturerPermission(request.getAssignmentId(), lecturerId);

        AssignmentResult result = assignmentResultDao
                .findByAssignmentIdAndGroupId(request.getAssignmentId(), request.getGroupId())
                .orElseThrow(() -> new NotFoundException("Grade result not found"));

        if (!result.getPublished()) {
            throw new BadRequestException("Grade is already unpublished");
        }

        result.setPublished(false);
        result.setUnpublishedAt(LocalDateTime.now());
        result.setUnpublishedBy(userDao.findById(lecturerId).orElse(null));
        result.setPublishedAt(null);
        result.setPublishedBy(null);
        assignmentResultDao.save(result);

        String groupName = result.getGroup().getGroupName();

        return gradeMapper.toGradeDraftResponseWithUnpublish(
                request.getAssignmentId(),
                assignment.getTitle(),
                request.getGroupId(),
                groupName,
                result.getScore(),
                result.getFinalComment(),
                userDao.findById(lecturerId).map(User::getFullName).orElse("Unknown Lecturer")
        );
    }

    // ============================================================
    // ===== HELPER / VALIDATION METHODS =====
    // ============================================================

    @Override
    public boolean validateGradeFormat(BigDecimal score) {
        if (score == null) {
            return false;
        }
        return score.compareTo(MIN_SCORE) >= 0 && score.compareTo(MAX_SCORE) <= 0;
    }

    @Override
    public boolean validateCommentLength(String comment) {
        if (comment == null) {
            return true;
        }
        return comment.length() <= MAX_COMMENT_LENGTH;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean groupHasSubmission(Long assignmentId, Long groupId) {
        return assignmentSubmissionDao.existsByAssignmentIdAndGroupId(assignmentId, groupId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean groupHasPeerReview(Long assignmentId, Long groupId) {
        return peerReviewAssignmentDao.existsByAssignmentIdAndRevieweeGroupId(assignmentId, groupId);
    }

    // ============================================================
    // ===== PRIVATE HELPER METHODS =====
    // ============================================================

    private Assignment validateLecturerPermission(Long assignmentId, Long lecturerId) {
        Assignment assignment = assignmentDao.findByIdWithCourseAndLecturer(assignmentId)
                .orElseThrow(() -> new NotFoundException("Assignment not found"));

        Long courseLecturerId = assignment.getLesson().getCourse().getLecturer().getId();
        if (!courseLecturerId.equals(lecturerId)) {
            throw new ForbiddenException("You do not have permission to grade this assignment");
        }

        return assignment;
    }

    private PublishGradeResponse.PublishedGroupResult processGroupPublish(
            Assignment assignment,
            Long groupId,
            PublishGradeRequest.GradeEntry gradeEntry,
            Long lecturerId
    ) {
        String groupName = studentGroupDao.findById(groupId)
                .map(StudentGroup::getGroupName)
                .orElse("Unknown Group");

        if (gradeEntry == null) {
            return gradeMapper.toPublishedGroupResult(
                    groupId,
                    groupName,
                    null,
                    null,
                    false,
                    null,
                    "No grade data provided for this group"
            );
        }

        if (!validateGradeFormat(gradeEntry.getScore())) {
            throw GradeValidationException.invalidScore();
        }

        if (gradeEntry.getComment() != null && !validateCommentLength(gradeEntry.getComment())) {
            throw GradeValidationException.commentTooLong();
        }

        try {
            boolean hasSubmission = groupHasSubmission(assignment.getId(), groupId);
            if (!hasSubmission) {
                throw new NoSubmissionException(groupId, groupName);
            }
        } catch (NoSubmissionException e) {
            throw e;
        }

        boolean hasPeerReview = groupHasPeerReview(assignment.getId(), groupId);
        String warning = null;
        if (!hasPeerReview) {
            warning = "[" + groupName + "] has not received any peer review. Do you still want to publish the grade?";
        }

        try {
            Optional<AssignmentResult> existingResult = assignmentResultDao
                    .findByAssignmentIdAndGroupId(assignment.getId(), groupId);

            AssignmentResult result;
            User publishedBy = userDao.findById(lecturerId).orElse(null);

            if (existingResult.isPresent()) {
                result = existingResult.get();
                result.setScore(gradeEntry.getScore());
                result.setFinalComment(gradeEntry.getComment());
                result.setPublished(true);
                result.setPublishedAt(LocalDateTime.now());
                result.setPublishedBy(publishedBy);
                result.setGradedAt(LocalDateTime.now());
                result.setGradedBy(publishedBy);
                result = assignmentResultDao.save(result);
            } else {
                StudentGroup group = studentGroupDao.findById(groupId)
                        .orElseThrow(() -> new NotFoundException("Group not found"));

                result = AssignmentResult.builder()
                        .assignment(assignment)
                        .group(group)
                        .score(gradeEntry.getScore())
                        .finalComment(gradeEntry.getComment())
                        .published(true)
                        .publishedAt(LocalDateTime.now())
                        .publishedBy(publishedBy)
                        .gradedAt(LocalDateTime.now())
                        .gradedBy(publishedBy)
                        .build();
                result = assignmentResultDao.save(result);
            }

            return gradeMapper.toPublishedGroupResult(
                    groupId,
                    groupName,
                    result.getScore(),
                    result.getFinalComment(),
                    true,
                    warning,
                    null
            );

        } catch (Exception e) {
            log.error("Error publishing grade for group {}: {}", groupId, e.getMessage());
            throw new BadRequestException(
                "Final grade could not be saved due to a system error. Please try again."
            );
        }
    }

    private List<StudentGroup> getGroupsForCourse(Long courseId) {
        return studentGroupDao.findByCourseIdWithMembers(courseId);
    }
}
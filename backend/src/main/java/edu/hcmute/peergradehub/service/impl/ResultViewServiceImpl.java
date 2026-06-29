package edu.hcmute.peergradehub.service.impl;

import edu.hcmute.peergradehub.dao.*;
import edu.hcmute.peergradehub.dto.response.result.*;
import edu.hcmute.peergradehub.entity.*;
import edu.hcmute.peergradehub.exception.GalleryDataLoadException;
import edu.hcmute.peergradehub.exception.NotFoundException;
import edu.hcmute.peergradehub.exception.ResultDataLoadException;
import edu.hcmute.peergradehub.service.ResultViewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ResultViewServiceImpl implements ResultViewService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final StudentGroupDao studentGroupDao;
    private final AssignmentDao assignmentDao;
    private final AssignmentResultDao assignmentResultDao;
    private final PeerReviewDao peerReviewDao;
    private final AssignmentSubmissionDao assignmentSubmissionDao;

    @Override
    public PublishedResultResponse getPublishedResults(Long studentId, Long assignmentId) {
        log.debug("Getting published results for student: {}, assignment: {}", studentId, assignmentId);

        try {
            // ===== STEP 1: Get assignment =====
            Assignment assignment = assignmentDao.findById(assignmentId)
                    .orElseThrow(() -> new NotFoundException("Assignment not found with id: " + assignmentId));
            Long courseId = assignment.getLesson().getCourse().getId();

            // ===== STEP 2: Get student's group =====
            StudentGroup group = studentGroupDao.findGroupByStudentAndCourse(studentId, courseId)
                    .orElseThrow(() -> new NotFoundException(
                            "Student is not in any group for this course. Please join a group first."));
            Long groupId = group.getId();

            // ===== STEP 3: Check if results are published (BR-14) =====
            boolean isPublished = assignmentResultDao.existsPublishedByAssignmentIdAndGroupId(assignmentId, groupId);

            // Alternate Flow 2.1: Results not published yet
            if (!isPublished) {
                return PublishedResultResponse.builder()
                        .isPublished(false)
                        .message("Your results are still being processed.")
                        .showcaseMode(assignment.getShowcaseMode())
                        .build();
            }

            // ===== STEP 4: Get personal result =====
            AssignmentResult result = assignmentResultDao
                    .findByAssignmentIdAndGroupIdWithPublishers(assignmentId, groupId)
                    .orElseThrow(() -> new NotFoundException(
                            "Result not found for group: " + groupId + " and assignment: " + assignmentId));

            // ===== STEP 5: Get peer feedback =====
            List<PeerReview> peerReviews = peerReviewDao.findByAssignmentIdAndRevieweeGroupId(assignmentId, groupId);

            // ===== STEP 6: Build personal result =====
            PersonalResultResponse personalResult = buildPersonalResultResponse(group, result, peerReviews);

            // ===== STEP 7: Build showcase gallery (if enabled, BR-15) =====
            ShowcaseGalleryResponse showcaseGallery = null;
            if (Boolean.TRUE.equals(assignment.getShowcaseMode())) {
                showcaseGallery = buildShowcaseGallery(assignmentId, groupId);
            }

            // ===== STEP 8: Return final response =====
            return PublishedResultResponse.builder()
                    .isPublished(true)
                    .personalResult(personalResult)
                    .showcaseMode(assignment.getShowcaseMode())
                    .showcaseGallery(showcaseGallery)
                    .build();

        } catch (NotFoundException e) {
            throw e;
        } catch (Exception e) {
            // Exception Flow 2.1: Result data cannot be loaded
            log.error("Error loading result data: {}", e.getMessage(), e);
            throw new ResultDataLoadException("Result data could not be loaded. Please try again later.");
        }
    }

    private PersonalResultResponse buildPersonalResultResponse(
            StudentGroup group,
            AssignmentResult result,
            List<PeerReview> peerReviews) {

        Map<Long, String> reviewerGroupNames = peerReviews.stream()
                .collect(Collectors.toMap(
                        pr -> pr.getPeerReviewAssignment().getReviewerGroup().getId(),
                        pr -> pr.getPeerReviewAssignment().getReviewerGroup().getGroupName(),
                        (existing, replacement) -> existing
                ));

        List<PeerFeedbackResponse> feedbackResponses = new ArrayList<>();
        int counter = 1;

        for (PeerReview peerReview : peerReviews) {
            Long reviewerGroupId = peerReview.getPeerReviewAssignment().getReviewerGroup().getId();
            String anonymousName = reviewerGroupNames.containsKey(reviewerGroupId)
                    ? reviewerGroupNames.get(reviewerGroupId)
                    : "Reviewer " + counter++;

            feedbackResponses.add(PeerFeedbackResponse.builder()
                    .anonymousReviewerName(anonymousName)
                    .score(peerReview.getScore())
                    .comment(peerReview.getComment())
                    .submittedAt(peerReview.getSubmittedAt() != null
                            ? peerReview.getSubmittedAt().format(DATE_FORMATTER)
                            : null)
                    .build());
        }

        return PersonalResultResponse.builder()
                .groupId(group.getId())
                .groupName(group.getGroupName())
                .finalScore(result.getScore())
                .lecturerComment(result.getFinalComment())
                .publishedAt(result.getPublishedAt() != null
                        ? result.getPublishedAt().format(DATE_FORMATTER)
                        : null)
                .publishedBy(result.getPublishedBy() != null
                        ? result.getPublishedBy().getFullName()
                        : null)
                .peerFeedbacks(feedbackResponses)
                .build();
    }

    private ShowcaseGalleryResponse buildShowcaseGallery(Long assignmentId, Long excludeGroupId) {
        log.debug("Building showcase gallery for assignment: {}, excluding group: {}", assignmentId, excludeGroupId);

        try {
            // Get submissions of other groups (TẠM THỜI CHƯA CÓ ATTACHMENTS)
            List<AssignmentSubmission> otherSubmissions = assignmentSubmissionDao
                    .findByAssignmentIdAndGroupIdNot(assignmentId, excludeGroupId);

            if (otherSubmissions.isEmpty()) {
                return ShowcaseGalleryResponse.builder()
                        .enabled(true)
                        .message("No other groups have submitted yet.")
                        .submissions(new ArrayList<>())
                        .build();
            }

            // Get published results (BR-15: chỉ show grade của groups đã publish)
            List<AssignmentResult> publishedResults = assignmentResultDao
                    .findPublishedByAssignmentId(assignmentId);

            Map<Long, AssignmentResult> publishedResultMap = publishedResults.stream()
                    .collect(Collectors.toMap(
                            r -> r.getGroup().getId(),
                            r -> r
                    ));

            // Get all peer reviews for anonymous feedback
            List<PeerReview> allPeerReviews = peerReviewDao.findByAssignmentId(assignmentId);

            Map<Long, List<PeerReview>> groupPeerReviewsMap = allPeerReviews.stream()
                    .collect(Collectors.groupingBy(
                            pr -> pr.getPeerReviewAssignment().getRevieweeGroup().getId()
                    ));

            // Build submission responses
            List<ShowcaseSubmissionResponse> submissionResponses = new ArrayList<>();

            for (AssignmentSubmission submission : otherSubmissions) {
                Long groupId = submission.getGroup().getId();
                boolean isGradePublished = publishedResultMap.containsKey(groupId);

                List<PeerReview> groupReviews = groupPeerReviewsMap.getOrDefault(groupId, new ArrayList<>());
                List<PeerFeedbackResponse> feedbackResponses = buildAnonymousFeedbackResponses(groupReviews);

                // TẠM THỜI BỎ QUA ATTACHMENTS (sẽ thêm sau UC-06)
                List<ShowcaseSubmissionResponse.AttachmentInfo> attachmentInfos = new ArrayList<>();

                submissionResponses.add(ShowcaseSubmissionResponse.builder()
                        .groupId(groupId)
                        .groupName(submission.getGroup().getGroupName())
                        .submittedAt(submission.getSubmittedAt() != null
                                ? submission.getSubmittedAt().format(DATE_FORMATTER)
                                : null)
                        .submitterName(submission.getSubmittedBy() != null
                                ? submission.getSubmittedBy().getFullName()
                                : null)
                        .submissionNote(submission.getNote())
                        .attachments(attachmentInfos)
                        .finalScore(isGradePublished ? publishedResultMap.get(groupId).getScore() : null)
                        .isPublished(isGradePublished)
                        .peerFeedbacks(feedbackResponses)
                        .build());
            }

            return ShowcaseGalleryResponse.builder()
                    .enabled(true)
                    .submissions(submissionResponses)
                    .build();

        } catch (Exception e) {
            // Exception Flow 2.2: Class Gallery data cannot be loaded
            log.error("Error building showcase gallery: {}", e.getMessage(), e);
            throw new GalleryDataLoadException("Class Gallery data could not be loaded. Please try again later.");
        }
    }

    private List<PeerFeedbackResponse> buildAnonymousFeedbackResponses(List<PeerReview> peerReviews) {
        List<PeerFeedbackResponse> responses = new ArrayList<>();
        int counter = 1;

        for (PeerReview review : peerReviews) {
            String anonymousName = "Group " + (char) ('A' + counter - 1);

            responses.add(PeerFeedbackResponse.builder()
                    .anonymousReviewerName(anonymousName)
                    .score(review.getScore())
                    .comment(review.getComment())
                    .submittedAt(review.getSubmittedAt() != null
                            ? review.getSubmittedAt().format(DATE_FORMATTER)
                            : null)
                    .build());
            counter++;
        }

        return responses;
    }
}
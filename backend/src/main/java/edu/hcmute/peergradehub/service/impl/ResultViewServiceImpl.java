package edu.hcmute.peergradehub.service.impl;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import edu.hcmute.peergradehub.dao.AssignmentDao;
import edu.hcmute.peergradehub.dao.AssignmentResultDao;
import edu.hcmute.peergradehub.dao.AssignmentSubmissionDao;
import edu.hcmute.peergradehub.dao.PeerReviewDao;
import edu.hcmute.peergradehub.dao.StudentGroupDao;
import edu.hcmute.peergradehub.dto.response.result.PeerFeedbackResponse;
import edu.hcmute.peergradehub.dto.response.result.PersonalResultResponse;
import edu.hcmute.peergradehub.dto.response.result.PublishedResultResponse;
import edu.hcmute.peergradehub.dto.response.result.ShowcaseGalleryResponse;
import edu.hcmute.peergradehub.dto.response.result.ShowcaseSubmissionResponse;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.AssignmentResult;
import edu.hcmute.peergradehub.entity.AssignmentSubmission;
import edu.hcmute.peergradehub.entity.PeerReview;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.entity.SubmissionAttachment;
import edu.hcmute.peergradehub.enumeration.SubmissionAttachmentType;
import edu.hcmute.peergradehub.exception.GalleryDataLoadException;
import edu.hcmute.peergradehub.exception.NotFoundException;
import edu.hcmute.peergradehub.exception.ResultDataLoadException;
import edu.hcmute.peergradehub.service.ResultViewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    List<PeerFeedbackResponse> feedbackResponses = new ArrayList<>();
    int counter = 1;

    for (PeerReview peerReview : peerReviews) {
       
        String anonymousName = "Reviewer " + counter++;

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
        // ===== LẤY DANH SÁCH GROUP ĐÃ PUBLISH =====
        List<AssignmentResult> publishedResults = assignmentResultDao
                .findPublishedByAssignmentId(assignmentId);

        if (publishedResults.isEmpty()) {
            return ShowcaseGalleryResponse.builder()
                    .enabled(true)
                    .message("No groups have published results yet.")
                    .submissions(new ArrayList<>())
                    .build();
        }

        // Lấy danh sách groupId đã publish
        Set<Long> publishedGroupIds = publishedResults.stream()
                .map(r -> r.getGroup().getId())
                .collect(Collectors.toSet());

        // ===== CHỈ LẤY SUBMISSIONS CỦA NHÓM ĐÃ PUBLISH (và khác nhóm hiện tại) =====
        List<AssignmentSubmission> otherSubmissions = assignmentSubmissionDao
                .findByAssignmentIdAndGroupIdNot(assignmentId, excludeGroupId)
                .stream()
                .filter(sub -> publishedGroupIds.contains(sub.getGroup().getId()))
                .collect(Collectors.toList());

        if (otherSubmissions.isEmpty()) {
            return ShowcaseGalleryResponse.builder()
                    .enabled(true)
                    .message("No other groups have published results yet.")
                    .submissions(new ArrayList<>())
                    .build();
        }

        // Map groupId -> score
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

            // Build attachments
            List<ShowcaseSubmissionResponse.AttachmentInfo> attachmentInfos = new ArrayList<>();

            if (submission.getAttachments() != null && !submission.getAttachments().isEmpty()) {
                for (SubmissionAttachment attachment : submission.getAttachments()) {
                    String downloadUrl = null;
                    String openUrl = null;
                    
                    if (attachment.getAttachmentType() == SubmissionAttachmentType.FILE) {
                        downloadUrl = String.format("/submissions/%d/files/%d/download", 
                                submission.getId(), attachment.getId());
                    } else if (attachment.getAttachmentType() == SubmissionAttachmentType.LINK) {
                        openUrl = attachment.getUrl();
                    }

                    attachmentInfos.add(ShowcaseSubmissionResponse.AttachmentInfo.builder()
                            .attachmentId(attachment.getId())
                            .attachmentType(attachment.getAttachmentType() != null 
                                    ? attachment.getAttachmentType().name() 
                                    : null)
                            .title(attachment.getTitle())
                            .fileName(attachment.getFileName())
                            .filePath(attachment.getFilePath())
                            .fileType(attachment.getFileType())
                            .fileSizeMb(attachment.getFileSizeMb())
                            .url(attachment.getUrl())
                            .label(attachment.getLabel())
                            .downloadUrl(downloadUrl)
                            .openUrl(openUrl)
                            .build());
                }
            }

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
        log.error("Error building showcase gallery: {}", e.getMessage(), e);
        throw new GalleryDataLoadException("Class Gallery data could not be loaded. Please try again later.");
    }
}

    private List<PeerFeedbackResponse> buildAnonymousFeedbackResponses(List<PeerReview> peerReviews) {
        List<PeerFeedbackResponse> responses = new ArrayList<>();
        int counter = 1;

        for (PeerReview review : peerReviews) {
            String anonymousName = "Anonymousfeedback " + counter++;

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
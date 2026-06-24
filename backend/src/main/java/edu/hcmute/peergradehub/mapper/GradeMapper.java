package edu.hcmute.peergradehub.mapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

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

@Component
public class GradeMapper {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = 
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // ===== Grading Data Response =====

    public GradingDataResponse toGradingDataResponse(
            Assignment assignment,
            List<StudentGroup> groups,
            String lecturerName,
            Long lecturerId,
            Long submittedCount,
            Long reviewedCount
    ) {
        return new GradingDataResponse(
                assignment.getId(),
                assignment.getTitle(),
                assignment.getDescription(),
                formatDateTime(assignment.getSubmissionDeadline()),
                formatDateTime(assignment.getReviewDeadline()),
                assignment.getShowcaseMode(),
                groups.stream()
                        .map(this::toSimpleGradingEvidenceResponse)
                        .collect(Collectors.toList()),
                lecturerName,
                lecturerId,
                (long) groups.size(),
                submittedCount,
                reviewedCount
        );
    }

    // ===== Grading Evidence Response (Full) =====

    public GradingEvidenceResponse toGradingEvidenceResponse(
            StudentGroup group,
            Boolean hasSubmission,
            AssignmentSubmission submission,
            Boolean hasPeerReview,
            Long peerReviewCount,
            List<PeerReviewEvidenceResponse> peerReviews,
            AssignmentResult result,
            String publishedByName,
            Boolean canPublish
    ) {
        
        return GradingEvidenceResponse.builder()
                .groupId(group.getId())
                .groupName(group.getGroupName())
                .memberCount(0) // Không có dữ liệu member count
                .memberNames(null) // Không có dữ liệu member names
                .hasSubmission(hasSubmission)
                .submittedAt(submission == null ? null : formatDateTime(submission.getSubmittedAt()))
                .submitterName(submission == null || submission.getSubmittedBy() == null ? null : 
                        submission.getSubmittedBy().getFullName())
                .submissionNote(submission == null ? null : submission.getNote())
                .attachments(null) // Không có attachments
                .hasPeerReview(hasPeerReview)
                .peerReviewCount(peerReviewCount)
                .peerReviews(peerReviews)
                .currentFinalScore(result == null ? null : result.getScore())
                .currentFinalComment(result == null ? null : result.getFinalComment())
                .isPublished(result != null && result.getPublished())
                .publishedAt(result == null || result.getPublishedAt() == null ? null : 
                        formatDateTime(result.getPublishedAt()))
                .publishedByName(publishedByName)
                .canPublish(canPublish)
                .build();
    }

    // ===== Simple Grading Evidence Response =====

    public GradingEvidenceResponse toSimpleGradingEvidenceResponse(StudentGroup group) {
        return GradingEvidenceResponse.builder()
                .groupId(group.getId())
                .groupName(group.getGroupName())
                .memberCount(0)
                .memberNames(null)
                .hasSubmission(false)
                .hasPeerReview(false)
                .peerReviewCount(0L)
                .isPublished(false)
                .canPublish(false)
                .build();
    }

    // ===== Peer Review Evidence Response =====

    public PeerReviewEvidenceResponse toPeerReviewEvidenceResponse(
            PeerReview peerReview,
            StudentGroup reviewerGroup
    ) {
        return PeerReviewEvidenceResponse.builder()
                .reviewerGroupId(reviewerGroup.getId())
                .reviewerGroupName(reviewerGroup.getGroupName())
                .reviewerGroupMemberNames(null) // Không có dữ liệu
                .score(peerReview.getScore())
                .comment(peerReview.getComment())
                .submittedAt(formatDateTime(peerReview.getSubmittedAt()))
                .reviewStatus(peerReview.getReviewStatus() == null ? null : 
                        peerReview.getReviewStatus().name())
                .anonymousReviewerName("Group " + reviewerGroup.getGroupName())
                .build();
    }

    // ===== Publish Grade Response =====

    public PublishGradeResponse toPublishGradeResponse(
            Assignment assignment,
            List<PublishGradeResponse.PublishedGroupResult> results,
            String publishedBy
    ) {
        return PublishGradeResponse.builder()
                .assignmentId(assignment.getId())
                .assignmentTitle(assignment.getTitle())
                .publishedGroups(results)
                .publishedAt(LocalDateTime.now())
                .publishedBy(publishedBy)
                .totalPublished(results.size())
                .totalWithWarning((int) results.stream()
                        .filter(r -> r.getWarning() != null && !r.getWarning().isEmpty())
                        .count())
                .build();
    }

    public PublishGradeResponse.PublishedGroupResult toPublishedGroupResult(
            Long groupId,
            String groupName,
            BigDecimal score,
            String comment,
            Boolean success,
            String warning,
            String error
    ) {
        return PublishGradeResponse.PublishedGroupResult.builder()
                .groupId(groupId)
                .groupName(groupName)
                .score(score)
                .comment(comment)
                .success(success)
                .warning(warning)
                .error(error)
                .build();
    }

    // ===== Grade Draft Response =====

    public GradeDraftResponse toGradeDraftResponse(
            Long assignmentId,
            String assignmentTitle,
            Long groupId,
            String groupName,
            BigDecimal score,
            String comment,
            Boolean isPublished,
            String message
    ) {
        return GradeDraftResponse.builder()
                .assignmentId(assignmentId)
                .assignmentTitle(assignmentTitle)
                .groupId(groupId)
                .groupName(groupName)
                .score(score)
                .comment(comment)
                .savedAt(LocalDateTime.now())
                .isPublished(isPublished)
                .message(message)
                .build();
    }

    public GradeDraftResponse toGradeDraftResponseWithUnpublish(
            Long assignmentId,
            String assignmentTitle,
            Long groupId,
            String groupName,
            BigDecimal score,
            String comment,
            String unpublishedBy
    ) {
        return GradeDraftResponse.builder()
                .assignmentId(assignmentId)
                .assignmentTitle(assignmentTitle)
                .groupId(groupId)
                .groupName(groupName)
                .score(score)
                .comment(comment)
                .savedAt(LocalDateTime.now())
                .isPublished(false)
                .unpublishedAt(formatDateTime(LocalDateTime.now()))
                .unpublishedBy(unpublishedBy)
                .message("Grade has been unpublished. Students can no longer view it.")
                .build();
    }

    // ===== Showcase Status Response =====

    public ShowcaseStatusResponse toShowcaseStatusResponse(
            Long assignmentId,
            String assignmentTitle,
            Boolean enabled,
            String updatedBy,
            Long updatedById
    ) {
        return ShowcaseStatusResponse.builder()
                .assignmentId(assignmentId)
                .assignmentTitle(assignmentTitle)
                .enabled(enabled)
                .message("Showcase status updated")
                .updatedAt(formatDateTime(LocalDateTime.now()))
                .updatedBy(updatedBy)
                .updatedById(updatedById)
                .build();
    }

    // ===== Helper Methods =====

    public String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.format(DATE_TIME_FORMATTER);
    }

    // ===== Submission Attachment Info =====

    public GradingEvidenceResponse.SubmissionAttachmentInfo toSubmissionAttachmentInfo(
            SubmissionAttachment attachment
    ) {
        if (attachment == null) {
            return null;
        }
        return GradingEvidenceResponse.SubmissionAttachmentInfo.builder()
                .title(attachment.getTitle())
                .fileName(attachment.getFileName())
                .filePath(attachment.getFilePath())
                .url(attachment.getUrl())
                .attachmentType(attachment.getAttachmentType() == null ? null : 
                        attachment.getAttachmentType().name())
                .fileSizeMb(attachment.getFileSizeMb())
                .build();
    }
    
}
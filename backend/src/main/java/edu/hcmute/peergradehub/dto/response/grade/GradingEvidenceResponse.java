package edu.hcmute.peergradehub.dto.response.grade;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO containing evidence for a single group's grading.
 * Includes submission, peer reviews, and current grade status.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradingEvidenceResponse {

    // Group information
    private Long groupId;
    private String groupName;
    private Integer memberCount;
    private List<String> memberNames;

    // Submission information
    private Boolean hasSubmission;
    private String submittedAt;
    private String submitterName;
    private String submissionNote;
    private List<SubmissionAttachmentInfo> attachments;

    // Peer review information
    private Boolean hasPeerReview;
    private Long peerReviewCount;
    private List<PeerReviewEvidenceResponse> peerReviews;

    // Current grade status
    private BigDecimal currentFinalScore;
    private String currentFinalComment;
    private Boolean isPublished;
    private String publishedAt;
    private String publishedByName;

    // Validation flags for business rules
    private Boolean canPublish; // true if has submission and (has peer review or lecturer confirms)

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmissionAttachmentInfo {
        private String title;
        private String fileName;
        private String filePath;
        private String url;
        private String attachmentType; // "FILE" or "LINK"
        private Double fileSizeMb;
        private String downloadUrl; 
    }
}
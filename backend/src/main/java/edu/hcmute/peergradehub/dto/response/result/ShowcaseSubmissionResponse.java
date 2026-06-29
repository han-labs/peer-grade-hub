package edu.hcmute.peergradehub.dto.response.result;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * One group's submission in the Class Gallery.
 * Only shows final grade if that group's grade is published (BR-15).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShowcaseSubmissionResponse {

    private Long groupId;
    private String groupName;
    private String submittedAt;
    private String submitterName;
    private String submissionNote;
    private List<AttachmentInfo> attachments;
    
    // BR-15: Only show if the group's grade is published
    private BigDecimal finalScore; // null if not published
    private Boolean isPublished;
    
    // Anonymous peer feedback for this group
    private List<PeerFeedbackResponse> peerFeedbacks;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachmentInfo {
        private String title;
        private String fileName;
        private String filePath;
        private String url;
        private String attachmentType; // "FILE" or "LINK"
        private Double fileSizeMb;
    }
}
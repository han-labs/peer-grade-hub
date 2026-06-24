package edu.hcmute.peergradehub.dto.response.grade;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO after publishing grades.
 * Corresponds to Main Flow Step 2 of UC-09.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishGradeResponse {

    private Long assignmentId;
    private String assignmentTitle;
    private List<PublishedGroupResult> publishedGroups;
    private LocalDateTime publishedAt;
    private String publishedBy;
    private Integer totalPublished;
    private Integer totalWithWarning;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PublishedGroupResult {
        private Long groupId;
        private String groupName;
        private BigDecimal score;
        private String comment;
        private Boolean success;
        private String warning; // e.g., "Group has not received any peer review"
        private String error; // e.g., "Invalid grade format"
    }
}
package edu.hcmute.peergradehub.dto.response.grade;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for grade draft operations (save draft / unpublish).
 * Corresponds to Alternate Flow 2a and 3b of UC-09.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeDraftResponse {

    private Long assignmentId;
    private String assignmentTitle;
    private Long groupId;
    private String groupName;
    private BigDecimal score;
    private String comment;
    private LocalDateTime savedAt;
    private Boolean isPublished;
    private String message;

    // For unpublish flow
    private String unpublishedAt;
    private String unpublishedBy;
}
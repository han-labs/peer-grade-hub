package edu.hcmute.peergradehub.dto.response.grade;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Showcase Mode toggle operation.
 * Corresponds to Main Flow Step 3-4 of UC-09.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShowcaseStatusResponse {

    private Long assignmentId;
    private String assignmentTitle;
    private Boolean enabled;
    private String message;
    private String updatedAt;
    private String updatedBy;
    private Long updatedById;
}
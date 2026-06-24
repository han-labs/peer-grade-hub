package edu.hcmute.peergradehub.dto.request.grade;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for toggling Public Showcase Mode.
 * Corresponds to Main Flow Step 3-4 of UC-09.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToggleShowcaseRequest {

    @NotNull(message = "Assignment ID is required")
    private Long assignmentId;

    @NotNull(message = "Showcase status is required")
    private Boolean enabled;
}
package edu.hcmute.peergradehub.dto.request.grade;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for saving grade as draft.
 * Corresponds to Alternate Flow 2a of UC-09.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveDraftGradeRequest {

    @NotNull(message = "Assignment ID is required")
    private Long assignmentId;

    @NotNull(message = "Group ID is required")
    private Long groupId;

    
    @DecimalMin(value = "0.0", message = "Score must be at least 0")
    @DecimalMax(value = "100.0", message = "Score must not exceed 100")
    private BigDecimal score;

    @Size(max = 2000, message = "Final comment exceeds the maximum allowed length (2000 characters). Please shorten your comment.")
    private String comment;
}
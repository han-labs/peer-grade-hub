package edu.hcmute.peergradehub.dto.request.grade;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for publishing grades for multiple groups.
 * Corresponds to Main Flow Step 2 of UC-09.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishGradeRequest {

    @NotNull(message = "Assignment ID is required")
    private Long assignmentId;

    @NotEmpty(message = "Please select at least one group to publish grades for.")
    private List<@NotNull Long> groupIds;

    @NotEmpty(message = "Grade entries are required")
    @Valid
    private List<GradeEntry> grades;

    /**
     * Inner class representing a single grade entry for one group.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GradeEntry {

        @NotNull(message = "Group ID is required")
        private Long groupId;

        @NotNull(message = "Score is required")
        @DecimalMin(value = "0.0", message = "Score must be at least 0")
        @DecimalMax(value = "100.0", message = "Score must not exceed 100")
        private BigDecimal score;

        @Size(max = 2000, message = "Final comment exceeds the maximum allowed length (2000 characters). Please shorten your comment.")
        private String comment;
    }
}
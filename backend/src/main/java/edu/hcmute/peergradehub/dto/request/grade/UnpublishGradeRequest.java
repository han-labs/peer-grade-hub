package edu.hcmute.peergradehub.dto.request.grade;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for unpublishing a grade.
 * Corresponds to Alternate Flow 3b of UC-09.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnpublishGradeRequest {

    @NotNull(message = "Assignment ID is required")
    private Long assignmentId;

    @NotNull(message = "Group ID is required")
    private Long groupId;
}
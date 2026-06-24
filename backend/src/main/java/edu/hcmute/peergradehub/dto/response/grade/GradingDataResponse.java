package edu.hcmute.peergradehub.dto.response.grade;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO containing all grading data for an assignment.
 * Corresponds to Main Flow Step 1 of UC-09.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradingDataResponse {

    private Long assignmentId;
    private String assignmentTitle;
    private String assignmentDescription;
    private String submissionDeadline;
    private String reviewDeadline;
    private Boolean showcaseMode;
    private List<GradingEvidenceResponse> groups;
    private String lecturerName;
    private Long lecturerId;
    private Long totalGroups;
    private Long submittedCount;
    private Long reviewedCount;
}
package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.dto.request.grade.PublishGradeRequest;
import edu.hcmute.peergradehub.dto.request.grade.SaveDraftGradeRequest;
import edu.hcmute.peergradehub.dto.request.grade.ToggleShowcaseRequest;
import edu.hcmute.peergradehub.dto.request.grade.UnpublishGradeRequest;
import edu.hcmute.peergradehub.dto.response.grade.GradeDraftResponse;
import edu.hcmute.peergradehub.dto.response.grade.GradingDataResponse;
import edu.hcmute.peergradehub.dto.response.grade.PublishGradeResponse;
import edu.hcmute.peergradehub.dto.response.grade.ShowcaseStatusResponse;

/**
 * Service interface for Grade Management (UC-09 Manage Final Grades).
 * This is the facade for all grade-related operations.
 */
public interface GradeService {

    // ===== MAIN FLOW =====

    /**
     * Get all grading data for an assignment.
     * Includes submissions, peer reviews, and current grades for all groups.
     * Corresponds to Main Flow Step 1.
     */
    GradingDataResponse getGradingData(Long assignmentId, Long lecturerId);

    /**
     * Publish grades for selected groups.
     * Corresponds to Main Flow Step 2.
     */
    PublishGradeResponse publishGrades(PublishGradeRequest request, Long lecturerId);

    /**
     * Toggle Public Showcase Mode for an assignment.
     * Corresponds to Main Flow Step 3-4.
     */
    ShowcaseStatusResponse toggleShowcase(ToggleShowcaseRequest request, Long lecturerId);

    // ===== ALTERNATE FLOWS =====

    /**
     * Save grade as draft (not published yet).
     * Corresponds to Alternate Flow 2a.
     */
    GradeDraftResponse saveDraft(SaveDraftGradeRequest request, Long lecturerId);

    /**
     * Unpublish a previously published grade.
     * Corresponds to Alternate Flow 3b.
     */
    GradeDraftResponse unpublishGrade(UnpublishGradeRequest request, Long lecturerId);

    // ===== HELPER / VALIDATION METHODS =====

    /**
     * Validate that a score is within 0-100 range.
     * Corresponds to Exception Flow 2.1.
     */
    boolean validateGradeFormat(java.math.BigDecimal score);

    /**
     * Validate that comment does not exceed 2000 characters.
     * Corresponds to Exception Flow 2.2.
     */
    boolean validateCommentLength(String comment);

    /**
     * Check if a group has submitted the assignment.
     * Corresponds to Exception Flow 3.1.
     */
    boolean groupHasSubmission(Long assignmentId, Long groupId);

    /**
     * Check if a group has received any peer review.
     * Corresponds to Exception Flow 3.2.
     */
    boolean groupHasPeerReview(Long assignmentId, Long groupId);
}
// frontend/src/utils/gradeUtils.js
/**
 * Grade Management Utilities - UC-09
 * Helper functions for grading operations
 */

/**
 * Validate score is between 0 and 100
 * @param {number|string} score
 * @returns {boolean}
 */
export const isValidScore = (score) => {
    if (score === null || score === undefined || score === '') return false;
    const num = parseFloat(score);
    return !isNaN(num) && num >= 0 && num <= 100;
};

/**
 * Format score for display (round to 2 decimal places)
 * @param {number|string} score
 * @returns {string}
 */
export const formatScore = (score) => {
    if (score === null || score === undefined) return '-';
    const num = parseFloat(score);
    if (isNaN(num)) return '-';
    return num.toFixed(2);
};

/**
 * Get status badge variant for a group
 * @param {Object} group - GradingEvidenceResponse
 * @returns {string} 'published' | 'draft' | 'no-submission' | 'pending'
 */
export const getGroupStatus = (group) => {
    if (group.isPublished) return 'published';
    if (group.currentFinalScore !== null && group.currentFinalScore !== undefined) return 'draft';
    if (!group.hasSubmission) return 'no-submission';
    return 'pending';
};

/**
 * Get status label for display
 * @param {Object} group - GradingEvidenceResponse
 * @returns {string}
 */
export const getStatusLabel = (group) => {
    const status = getGroupStatus(group);
    const labels = {
        'published': 'PUBLISHED',
        'draft': 'DRAFT',
        'no-submission': 'NO SUBMISSION',
        'pending': 'PENDING'
    };
    return labels[status] || 'PENDING';
};

/**
 * Check if a group can be published
 * @param {Object} group - GradingEvidenceResponse
 * @returns {boolean}
 */
export const canPublishGroup = (group) => {
    return group.canPublish && !group.isPublished;
};

/**
 * Check if a group has no peer review (warning)
 * @param {Object} group - GradingEvidenceResponse
 * @returns {boolean}
 */
export const hasNoPeerReviewWarning = (group) => {
    return group.hasSubmission && !group.hasPeerReview;
};

/**
 * Build publish request data from selected groups and grade entries
 * @param {number} assignmentId
 * @param {number[]} selectedGroupIds
 * @param {Object} gradeEntries - { [groupId]: { score, comment } }
 * @returns {Object} PublishGradeRequest
 */
export const buildPublishRequest = (assignmentId, selectedGroupIds, gradeEntries) => {
    const grades = selectedGroupIds.map(groupId => ({
        groupId,
        score: parseFloat(gradeEntries[groupId]?.score) || 0,
        comment: gradeEntries[groupId]?.comment || ''
    }));
    
    return {
        assignmentId,
        groupIds: selectedGroupIds,
        grades
    };
};

/**
 * Build draft request data
 * @param {number} assignmentId
 * @param {number} groupId
 * @param {Object} gradeEntry - { score, comment }
 * @returns {Object} SaveDraftGradeRequest
 */
export const buildDraftRequest = (assignmentId, groupId, gradeEntry) => {
    return {
        assignmentId,
        groupId,
        score: parseFloat(gradeEntry?.score) || 0,
        comment: gradeEntry?.comment || ''
    };
};
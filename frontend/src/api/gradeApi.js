// frontend/src/api/gradeApi.js
/**
 * Grade Management API - UC-09 Manage Final Grades
 * All API calls for grading operations
 */

import { apiRequest } from './httpClient';

const GRADE_BASE = '/grades';

/**
 * Get all grading data for an assignment
 * GET /api/grades/assignment/{assignmentId}
 * 
 * @param {number|string} assignmentId
 * @param {string} token - Access token
 * @returns {Promise} GradingDataResponse
 */
export const getGradingData = (assignmentId, token) => {
    return apiRequest(`${GRADE_BASE}/assignment/${assignmentId}`, { token });
};

/**
 * Publish grades for selected groups
 * POST /api/grades/publish
 * 
 * @param {Object} data - PublishGradeRequest
 * @param {number} data.assignmentId
 * @param {number[]} data.groupIds
 * @param {Array} data.grades - [{groupId, score, comment}]
 * @param {string} token - Access token
 * @returns {Promise} PublishGradeResponse
 */
export const publishGrades = (data, token) => {
    return apiRequest(`${GRADE_BASE}/publish`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
    });
};

/**
 * Save grade as draft
 * POST /api/grades/draft
 * 
 * @param {Object} data - SaveDraftGradeRequest
 * @param {number} data.assignmentId
 * @param {number} data.groupId
 * @param {number} data.score
 * @param {string} data.comment
 * @param {string} token - Access token
 * @returns {Promise} GradeDraftResponse
 */
export const saveDraft = (data, token) => {
    return apiRequest(`${GRADE_BASE}/draft`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
    });
};

/**
 * Unpublish a previously published grade
 * POST /api/grades/unpublish
 * 
 * @param {Object} data - UnpublishGradeRequest
 * @param {number} data.assignmentId
 * @param {number} data.groupId
 * @param {string} token - Access token
 * @returns {Promise} GradeDraftResponse
 */
export const unpublishGrade = (data, token) => {
    return apiRequest(`${GRADE_BASE}/unpublish`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
    });
};

/**
 * Toggle Public Showcase Mode
 * POST /api/grades/showcase
 * 
 * @param {Object} data - ToggleShowcaseRequest
 * @param {number} data.assignmentId
 * @param {boolean} data.enabled
 * @param {string} token - Access token
 * @returns {Promise} ShowcaseStatusResponse
 */
export const toggleShowcase = (data, token) => {
    return apiRequest(`${GRADE_BASE}/showcase`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
    });
};
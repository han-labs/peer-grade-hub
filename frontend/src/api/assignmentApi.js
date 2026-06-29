// frontend/src/api/assignmentApi.js
import { apiRequest } from './httpClient';

const ASSIGNMENT_BASE = '/assignments';

/**
 * Get details of an assignment (including materials)
 * GET /api/assignments/{assignmentId}
 */
export const getAssignmentDetail = (assignmentId, token) => {
    return apiRequest(`${ASSIGNMENT_BASE}/${assignmentId}`, { token });
};

/**
 * Create a new assignment for a lesson
 * POST /api/lessons/{lessonId}/assignments
 */
export const createAssignment = async (lessonId, request, token) => {
    return apiRequest(`/lessons/${lessonId}/assignments`, {
        method: 'POST',
        body: JSON.stringify(request),
        token,
    });
};

/**
 * Update an assignment
 * PUT /api/assignments/{assignmentId}
 */
export const updateAssignment = async (assignmentId, request, token) => {
    return apiRequest(`${ASSIGNMENT_BASE}/${assignmentId}`, {
        method: 'PUT',
        body: JSON.stringify(request),
        token,
    });
};

/**
 * Delete an assignment
 * DELETE /api/assignments/{assignmentId}
 */
export const deleteAssignment = async (assignmentId, token) => {
    return apiRequest(`${ASSIGNMENT_BASE}/${assignmentId}`, {
        method: 'DELETE',
        token,
    });
};

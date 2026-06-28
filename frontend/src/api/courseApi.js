// frontend/src/api/courseApi.js
import { apiRequest } from './httpClient';

const COURSE_BASE = '/courses';

// ===== PHẦN (UC-09) =====

/**
 * Get all courses managed by the current lecturer
 * GET /api/courses
 */

export const getActiveCourses = (token) => {
    return apiRequest(`${COURSE_BASE}/active`, { token });
};
export async function getLecturerCourses(token) {
    const response = await apiRequest('/courses', { token });
    return response.data;
}

/**
 * Get course workspace with lessons and materials
 * GET /api/courses/{courseId}/workspace
 */
export const getCourseWorkspace = (courseId, token) => {
    return apiRequest(`${COURSE_BASE}/${courseId}/workspace`, { token });
};

/**
 * Get all assignments for a course
 * GET /api/courses/{courseId}/assignments
 */
export const getCourseAssignments = (courseId, token) => {
    return apiRequest(`${COURSE_BASE}/${courseId}/assignments`, { token });
};

// ===== PHẦN (UC-02 Manage Courses) =====

/**
 * Create a new course
 * POST /api/courses
 */
export const createCourse = async (request, token) => {
    const response = await apiRequest('/courses', {
        method: 'POST',
        body: JSON.stringify(request),
        token,
    });
    return response;
};

/**
 * Update a course
 * PUT /api/courses/{courseId}
 */
export const updateCourse = async (courseId, request, token) => {
    const response = await apiRequest(`/courses/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify(request),
        token,
    });
    return response;
};

/**
 * Create a lesson in a course
 * POST /api/courses/{courseId}/lessons
 */
export const createLesson = async (courseId, request, token) => {
    const response = await apiRequest(`/courses/${courseId}/lessons`, {
        method: 'POST',
        body: JSON.stringify(request),
        token,
    });
    return response;
};

/**
 * Create a lesson material
 * POST /api/courses/{courseId}/lessons/{lessonId}/materials
 */
export const createLessonMaterial = async (courseId, lessonId, request, token) => {
    const response = await apiRequest(
        `/courses/${courseId}/lessons/${lessonId}/materials`,
        {
            method: 'POST',
            body: JSON.stringify(request),
            token,
        }
    );
    return response;
};

/**
 * Delete a lesson material
 * DELETE /api/courses/{courseId}/lessons/{lessonId}/materials/{materialId}
 */
export const deleteLessonMaterial = async (courseId, lessonId, materialId, token) => {
    const response = await apiRequest(
        `/courses/${courseId}/lessons/${lessonId}/materials/${materialId}`,
        {
            method: 'DELETE',
            token,
        }
    );
    return response;
};
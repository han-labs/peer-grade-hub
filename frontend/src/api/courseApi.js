// frontend/src/api/courseApi.js
import { apiRequest } from './httpClient';

const COURSE_BASE = '/courses';

/**
 * Get all courses managed by the current lecturer
 * GET /api/courses
 */
export const getLecturerCourses = (token) => {
    return apiRequest(`${COURSE_BASE}`, { token });
};

/**
 * Get course workspace with lessons and materials
 * GET /api/courses/{courseId}/workspace
 */
export const getCourseWorkspace = (courseId, token) => {
    return apiRequest(`${COURSE_BASE}/${courseId}/workspace`, { token });
};

/**
 * Get all assignments for a course (will be replaced by lesson-based)
 * GET /api/courses/{courseId}/assignments
 */
export const getCourseAssignments = (courseId, token) => {
    return apiRequest(`${COURSE_BASE}/${courseId}/assignments`, { token });
};
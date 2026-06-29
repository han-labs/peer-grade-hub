// frontend/src/api/studentApi.js
/**
 * Student API - Navigation for UC-10 View Results
 * All API calls for student to browse courses, lessons, and assignments
 */

import { apiRequest } from './httpClient';

const STUDENT_BASE = '/results';

/**
 * Get all ACTIVE courses that the student has joined
 * GET /api/results/courses
 */
export const getStudentCourses = (token) => {
    return apiRequest(`${STUDENT_BASE}/courses`, { token });
};

/**
 * Get all lessons of a course (student view)
 * GET /api/results/courses/{courseId}/lessons
 */
export const getStudentLessons = (courseId, token) => {
    return apiRequest(`${STUDENT_BASE}/courses/${courseId}/lessons`, { token });
};

/**
 * Get all assignments of a lesson (student view)
 * GET /api/results/lessons/{lessonId}/assignments
 */
export const getStudentAssignments = (lessonId, token) => {
    return apiRequest(`${STUDENT_BASE}/lessons/${lessonId}/assignments`, { token });
};
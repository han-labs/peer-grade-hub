// frontend/src/api/lessonApi.js
import { apiRequest } from './httpClient';

const LESSON_BASE = '/lessons';

/**
 * Get all assignments for a lesson
 * GET /api/lessons/{lessonId}/assignments
 */
export const getLessonAssignments = (lessonId, token) => {
    return apiRequest(`${LESSON_BASE}/${lessonId}/assignments`, { token });
};
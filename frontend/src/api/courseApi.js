// frontend/src/api/courseApi.js
import { apiRequest, API_BASE_URL, ApiError } from './httpClient';

const COURSE_BASE = '/courses';

// ===== PHẦN (UC-09) =====

/**
 * Get all courses managed by the current lecturer
 * GET /api/courses
 */

export const getActiveCourses = (token) => {
    return apiRequest('/courses/active', { token });
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

export const updateCourse = async (courseId, request, token) => {
    const response = await apiRequest(`/courses/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify(request),
        token,
    });
    return response;
};

/**
 * Archive a course
 * PUT /api/courses/{courseId}/archive
 */
export const archiveCourse = async (courseId, token) => {
    const response = await apiRequest(`/courses/${courseId}/archive`, {
        method: 'PUT',
        token,
    });
    return response;
};

/**
 * Unarchive a course
 * PUT /api/courses/{courseId}/unarchive
 */
export const unarchiveCourse = async (courseId, token) => {
    const response = await apiRequest(`/courses/${courseId}/unarchive`, {
        method: 'PUT',
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
 * Update a lesson
 * PUT /api/courses/{courseId}/lessons/{lessonId}
 */
export const updateLesson = async (courseId, lessonId, request, token) => {
    const response = await apiRequest(`/courses/${courseId}/lessons/${lessonId}`, {
        method: 'PUT',
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
 * Update a lesson material
 * PUT /api/courses/{courseId}/lessons/{lessonId}/materials/{materialId}
 */
export const updateLessonMaterial = async (courseId, lessonId, materialId, request, token) => {
    const response = await apiRequest(
        `/courses/${courseId}/lessons/${lessonId}/materials/${materialId}`,
        {
            method: 'PUT',
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

/**
 * Delete a lesson
 * DELETE /api/courses/{courseId}/lessons/{lessonId}
 */
export const deleteLesson = async (courseId, lessonId, token) => {
    const response = await apiRequest(
        `/courses/${courseId}/lessons/${lessonId}`,
        {
            method: 'DELETE',
            token,
        }
    );
    return response;
};

export const uploadLessonMaterialFile = async (courseId, lessonId, formData, token) => {
    let response;
    try {
        response = await fetch(`${API_BASE_URL}/courses/${courseId}/lessons/${lessonId}/materials/files`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        });
    } catch (err) {
        if (err.message === 'Failed to fetch') {
            throw new Error("File upload failed. Please make sure the file is within the allowed size limit and try again.", { cause: err });
        }
        throw err;
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.success === false) {
        throw new ApiError(payload?.message ?? `Request failed with status ${response.status}.`, {
            status: response.status,
            code: payload?.code ?? 'REQUEST_FAILED',
            payload,
        });
    }
    return payload;
};

export const updateLessonMaterialFile = async (courseId, lessonId, materialId, formData, token) => {
    let response;
    try {
        response = await fetch(`${API_BASE_URL}/courses/${courseId}/lessons/${lessonId}/materials/${materialId}/file`, {
            method: 'PUT',
            headers: {
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        });
    } catch (err) {
        if (err.message === 'Failed to fetch') {
            throw new Error("File upload failed. Please make sure the file is within the allowed size limit and try again.", { cause: err });
        }
        throw err;
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.success === false) {
        throw new ApiError(payload?.message ?? `Request failed with status ${response.status}.`, {
            status: response.status,
            code: payload?.code ?? 'REQUEST_FAILED',
            payload,
        });
    }
    return payload;
};

export const downloadLessonMaterialFile = async (courseId, lessonId, materialId, token) => {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/lessons/${lessonId}/materials/${materialId}/download`, {
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new ApiError(payload?.message ?? 'File is not available for download.', {
            status: response.status,
            code: payload?.code ?? 'REQUEST_FAILED',
            payload,
        });
    }

    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition') ?? '';
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    const plainMatch = disposition.match(/filename="?([^"]+)"?/i);
    const fileName = utf8Match
        ? decodeURIComponent(utf8Match[1])
        : plainMatch?.[1] || 'material-file';

    return { blob, fileName };
};


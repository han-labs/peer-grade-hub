// frontend/src/api/resultApi.js
/**
 * UC-10 View Published Results - API Client
 * All API calls for viewing published results and showcase gallery
 */

import { apiRequest } from './httpClient';

const RESULTS_BASE = '/results';

/**
 * Get published results for a student's group for a specific assignment
 * GET /api/results/assignment/{assignmentId}
 * 
 * @param {number|string} assignmentId - The assignment ID
 * @param {string} token - Access token
 * @returns {Promise<PublishedResultResponse>}
 * 
 * Response structure:
 * {
 *   isPublished: boolean,
 *   message: string,                    // "Your results are still being processed" if not published
 *   personalResult: PersonalResultResponse | null,
 *   showcaseMode: boolean,
 *   showcaseGallery: ShowcaseGalleryResponse | null
 * }
 */
export const getPublishedResults = (assignmentId, token) => {
    return apiRequest(`${RESULTS_BASE}/assignment/${assignmentId}`, { token });
};

/**
 * Check if a student can view results for an assignment
 * Convenience function that calls getPublishedResults and returns a simplified status
 * 
 * @param {number|string} assignmentId
 * @param {string} token
 * @returns {Promise<{ canView: boolean, isPublished: boolean, message: string }>}
 */
export const checkResultAccess = async (assignmentId, token) => {
    try {
        const response = await getPublishedResults(assignmentId, token);
        return {
            canView: response.data.isPublished === true,
            isPublished: response.data.isPublished,
            message: response.data.message || null,
            data: response.data
        };
    } catch (error) {
        return {
            canView: false,
            isPublished: false,
            message: error.message || 'Could not check result status',
            data: null,
            error
        };
    }
};

/**
 * Get only the personal results (without gallery)
 * Useful for quick summary views
 * 
 * @param {number|string} assignmentId
 * @param {string} token
 * @returns {Promise<PersonalResultResponse | null>}
 */
export const getPersonalResultsOnly = async (assignmentId, token) => {
    const response = await getPublishedResults(assignmentId, token);
    return response.data?.personalResult || null;
};

/**
 * Get only the showcase gallery data
 * Useful for lazy loading Class Gallery tab
 * 
 * @param {number|string} assignmentId
 * @param {string} token
 * @returns {Promise<ShowcaseGalleryResponse | null>}
 */
export const getShowcaseGalleryOnly = async (assignmentId, token) => {
    const response = await getPublishedResults(assignmentId, token);
    return response.data?.showcaseGallery || null;
};
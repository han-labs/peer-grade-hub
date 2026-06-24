import { apiRequest } from './httpClient.js'

export async function getLecturerCourses(token) {
  const response = await apiRequest('/courses', { token })
  return response.data
}

export async function createCourse(request, token) {
  const response = await apiRequest('/courses', {
    method: 'POST',
    body: JSON.stringify(request),
    token,
  })
  return response
}

export async function getCourseWorkspace(courseId, token) {
  const response = await apiRequest(`/courses/${courseId}/workspace`, { token })
  return response.data
}

export async function updateCourse(courseId, request, token) {
  const response = await apiRequest(`/courses/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify(request),
    token,
  })
  return response
}

export async function createLesson(courseId, request, token) {
  const response = await apiRequest(`/courses/${courseId}/lessons`, {
    method: 'POST',
    body: JSON.stringify(request),
    token,
  })
  return response
}

export async function createLessonMaterial(courseId, lessonId, request, token) {
  const response = await apiRequest(
    `/courses/${courseId}/lessons/${lessonId}/materials`,
    {
      method: 'POST',
      body: JSON.stringify(request),
      token,
    },
  )
  return response
}

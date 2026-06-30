import { API_BASE_URL, ApiError, apiRequest } from './httpClient.js'

const SUBMISSION_BASE = '/student/assignments'
const COURSE_SUBMISSION_BASE = '/student/courses'

export function getSubmittableAssignments(token) {
  return apiRequest(`${SUBMISSION_BASE}/submittable`, { token })
}

export function getSubmissionPage(assignmentId, token) {
  return apiRequest(`${SUBMISSION_BASE}/${assignmentId}/submission`, { token })
}

export function submitAssignment(assignmentId, payload, token) {
  return apiRequest(`${SUBMISSION_BASE}/${assignmentId}/submission`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

export async function uploadSubmissionFiles(assignmentId, files, token) {
  const formData = new FormData()
  files.forEach((fileItem) => {
    formData.append('files', fileItem.file ?? fileItem)
  })

  const response = await fetch(`${API_BASE_URL}${SUBMISSION_BASE}/${assignmentId}/submission/files`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.message ?? `Request failed with status ${response.status}.`, {
      status: response.status,
      code: payload?.code ?? 'REQUEST_FAILED',
      payload,
    })
  }

  return payload
}

export function getCurrentSubmission(assignmentId, token) {
  return apiRequest(`${SUBMISSION_BASE}/${assignmentId}/submission/current`, { token })
}

export function getCourseSubmission(courseId, assignmentId, token) {
  return apiRequest(
    `${COURSE_SUBMISSION_BASE}/${courseId}/assignments/${assignmentId}/submission`,
    { token },
  )
}

export function getSubmissionDetail(courseId, assignmentId, submissionId, token) {
  return apiRequest(
    `${COURSE_SUBMISSION_BASE}/${courseId}/assignments/${assignmentId}/submissions/${submissionId}`,
    { token },
  )
}

export function deleteSubmission(courseId, assignmentId, submissionId, token) {
  return apiRequest(
    `${COURSE_SUBMISSION_BASE}/${courseId}/assignments/${assignmentId}/submissions/${submissionId}`,
    {
      method: 'DELETE',
      token,
    },
  )
}

export async function downloadSubmissionFile(downloadUrl, token) {
  const normalizedPath = downloadUrl?.startsWith('/api/')
    ? downloadUrl.slice('/api'.length)
    : downloadUrl
  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new ApiError(payload?.message ?? 'File is not available for download.', {
      status: response.status,
      code: payload?.code ?? 'REQUEST_FAILED',
      payload,
    })
  }

  const blob = await response.blob()
  const disposition = response.headers.get('content-disposition') ?? ''
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  const plainMatch = disposition.match(/filename="?([^"]+)"?/i)
  const fileName = utf8Match
    ? decodeURIComponent(utf8Match[1])
    : plainMatch?.[1] || 'submission-file'

  return { blob, fileName }
}

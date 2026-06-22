import { apiRequest } from './httpClient.js'

export async function getPeerReviewAssignmentPageData(assignmentId, token) {
  const response = await apiRequest(
    `/assignments/${assignmentId}/peer-review-assignments`,
    { token },
  )

  return response.data
}

export async function createPeerReviewAssignment(
  assignmentId,
  reviewerGroupId,
  targetGroupId,
  token,
) {
  const response = await apiRequest(
    `/assignments/${assignmentId}/peer-review-assignments`,
    {
      method: 'POST',
      token,
      body: JSON.stringify({
        reviewerGroupId: reviewerGroupId || null,
        targetGroupId: targetGroupId || null,
      }),
    },
  )

  return response
}

export async function deletePeerReviewAssignment(peerReviewAssignmentId, token) {
  return apiRequest(`/peer-review-assignments/${peerReviewAssignmentId}`, {
    method: 'DELETE',
    token,
  })
}

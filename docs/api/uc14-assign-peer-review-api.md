# UC-14 Assign Peer Review API Design

Status: **PROPOSED - NOT IMPLEMENTED**  
Backend context path: `/api`  
Authentication: JWT Bearer token  
Authorized actor: Lecturer who owns the assignment's course

This contract follows the existing `ApiResponse` and `ErrorResponse` formats. It uses DTOs only; JPA entities are not exposed.

## Facade Entry Point

The proposed subsystem facade is:

`PeerReviewAssignmentService`

The controller depends only on this interface. The facade implementation hides `AssignmentDao`, `StudentGroupDao`, `PeerReviewAssignmentDao`, `PeerReviewDao`, `UserDao`, entity creation, validation, persistence, and mapping.

`PeerReviewService` is not recommended for UC-14 because no such service currently exists and the current model separates assignment tasks (`PeerReviewAssignment`) from submitted reviews (`PeerReview`). A future UC-07 service may use the name `PeerReviewService` without mixing both responsibilities.

## Shared Response Shapes

Successful responses use:

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "timestamp": "2026-06-22T10:00:00"
}
```

Errors use:

```json
{
  "success": false,
  "code": "BAD_REQUEST",
  "message": "Exact user-facing message",
  "path": "/api/assignments/12/peer-review-assignments",
  "timestamp": "2026-06-22T10:00:00"
}
```

## DTOs

### `CreatePeerReviewAssignmentRequest`

```json
{
  "reviewerGroupId": 21,
  "targetGroupId": 22
}
```

Fields:

| Field | Type | Required | Meaning |
|---|---|---:|---|
| `reviewerGroupId` | `Long` | Yes | Group that will perform the review. |
| `targetGroupId` | `Long` | Yes | Group whose submission will be reviewed. Maps to entity field `revieweeGroup`. |

### `AssignmentPeerReviewSummaryResponse`

| Field | Type |
|---|---|
| `id` | `Long` |
| `title` | `String` |
| `courseId` | `Long` |
| `courseName` | `String` |
| `classCode` | `String` |
| `reviewDeadline` | `LocalDateTime` |
| `reviewDeadlineOpen` | `boolean` |

### `PeerReviewGroupOptionResponse`

| Field | Type |
|---|---|
| `id` | `Long` |
| `name` | `String` |
| `status` | `GroupStatus` |

### `PeerReviewAssignmentResponse`

| Field | Type | Notes |
|---|---|---|
| `id` | `Long` | Peer-review assignment ID. |
| `assignmentId` | `Long` | Parent assignment. |
| `reviewerGroup` | `PeerReviewGroupOptionResponse` | Reviewing group. |
| `targetGroup` | `PeerReviewGroupOptionResponse` | Target group; maps from entity `revieweeGroup`. |
| `status` | `ReviewAssignmentStatus` | Initially `ASSIGNED`. |
| `assignedById` | `Long` | Authenticated lecturer who created the task. |
| `assignedAt` | `LocalDateTime` | Creation time. |
| `dueAt` | `LocalDateTime` | NEEDS APPROVAL: copy assignment review deadline or leave nullable. |

### `AssignPeerReviewPageResponse`

| Field | Type | Meaning |
|---|---|---|
| `assignment` | `AssignmentPeerReviewSummaryResponse` | Assignment and course context. |
| `groups` | `List<PeerReviewGroupOptionResponse>` | Course groups available for selection. |
| `peerReviewAssignments` | `List<PeerReviewAssignmentResponse>` | Existing reviewer-target pairs. |
| `groupsWithoutReceivedReviews` | `List<PeerReviewGroupOptionResponse>` | Target groups not present as a reviewee/target in an active assignment pair. |

The warning list is returned as structured group data rather than invented warning text. The frontend can render the approved UI wording.

### `DeletePeerReviewAssignmentResponse`

| Field | Type |
|---|---|
| `peerReviewAssignmentId` | `Long` |

## 1. Load Assign Peer Review Page Data

```http
GET /api/assignments/{assignmentId}/peer-review-assignments
Authorization: Bearer <lecturer-token>
```

### Authorization

- Authentication required.
- Current user must have `LECTURER` role.
- Current lecturer must own/manage the assignment's course.

### Success

Recommended status: `200 OK`

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "assignment": {
      "id": 12,
      "title": "Peer Assessment 1",
      "courseId": 4,
      "courseName": "Object-Oriented Software Engineering",
      "classCode": "OOSE-03",
      "reviewDeadline": "2026-07-10T23:59:00",
      "reviewDeadlineOpen": true
    },
    "groups": [
      { "id": 21, "name": "Group 1", "status": "READY" },
      { "id": 22, "name": "Group 2", "status": "READY" }
    ],
    "peerReviewAssignments": [
      {
        "id": 101,
        "assignmentId": 12,
        "reviewerGroup": { "id": 21, "name": "Group 1", "status": "READY" },
        "targetGroup": { "id": 22, "name": "Group 2", "status": "READY" },
        "status": "ASSIGNED",
        "assignedById": 2,
        "assignedAt": "2026-06-22T10:00:00",
        "dueAt": "2026-07-10T23:59:00"
      }
    ],
    "groupsWithoutReceivedReviews": [
      { "id": 21, "name": "Group 1", "status": "READY" }
    ]
  },
  "timestamp": "2026-06-22T10:00:00"
}
```

### Errors

| Status | Code | Message |
|---:|---|---|
| `401` | `UNAUTHORIZED` | `Authentication is required.` |
| `403` | `FORBIDDEN` | `You do not have permission to perform this action.` |
| `404` | `NOT_FOUND` | `The requested resource was not found.` unless resource-specific wording is approved. |

## 2. Create Peer Review Assignment

```http
POST /api/assignments/{assignmentId}/peer-review-assignments
Authorization: Bearer <lecturer-token>
Content-Type: application/json
```

### Request

```json
{
  "reviewerGroupId": 21,
  "targetGroupId": 22
}
```

### Success

Recommended status: `201 Created` (NEEDS APPROVAL; `200 OK` would match the simplest existing controller style).

```json
{
  "success": true,
  "message": "Peer review assignment created successfully.",
  "data": {
    "id": 102,
    "assignmentId": 12,
    "reviewerGroup": { "id": 21, "name": "Group 1", "status": "READY" },
    "targetGroup": { "id": 22, "name": "Group 2", "status": "READY" },
    "status": "ASSIGNED",
    "assignedById": 2,
    "assignedAt": "2026-06-22T10:05:00",
    "dueAt": "2026-07-10T23:59:00"
  },
  "timestamp": "2026-06-22T10:05:00"
}
```

The response message must be exactly:

`Peer review assignment created successfully.`

### Errors

| Status | Code | Exact message |
|---:|---|---|
| `400` | `BAD_REQUEST` | `Please select both a reviewer group and a target group before assigning a peer review task.` |
| `400` | `BAD_REQUEST` | `A group cannot review its own submission. Please select a different target group.` |
| `400` | `BAD_REQUEST` | `Selected groups must belong to the same course as this assignment. Please select valid course groups.` |
| `409` | `CONFLICT` | `This reviewer group has already been assigned to review the selected target group. Please choose a different pair.` |
| `409` | `CONFLICT` | `Cannot add or modify peer review assignments because the peer review deadline has passed. Please extend the peer review deadline before assigning review tasks.` |
| `500` | `INTERNAL_SERVER_ERROR` | `Peer review assignment could not be saved due to a system error. Please try again.` |
| `401` | `UNAUTHORIZED` | `Authentication is required.` |
| `403` | `FORBIDDEN` | `You do not have permission to perform this action.` |
| `404` | `NOT_FOUND` | Existing generic not-found message unless different wording is approved. |

The service-level duplicate check must be backed by the existing database unique constraint on `(assignment_id, reviewer_group_id, reviewee_group_id)`. A concurrent unique-constraint failure should map to the same duplicate-pair `409` response rather than the generic save-error message.

## 3. Delete Peer Review Assignment

```http
DELETE /api/peer-review-assignments/{peerReviewAssignmentId}
Authorization: Bearer <lecturer-token>
```

### Authorization

- Authentication required.
- Current user must have `LECTURER` role.
- Current lecturer must own/manage the related assignment's course.

### Success

Recommended status: `200 OK`

```json
{
  "success": true,
  "message": "Peer review assignment deleted successfully.",
  "data": {
    "peerReviewAssignmentId": 102
  },
  "timestamp": "2026-06-22T10:10:00"
}
```

The response message must be exactly:

`Peer review assignment deleted successfully.`

### Errors

| Status | Code | Exact message |
|---:|---|---|
| `409` | `CONFLICT` | `Cannot delete this peer review assignment because a review has already been submitted. Please keep the task or contact the system administrator for further support.` |
| `401` | `UNAUTHORIZED` | `Authentication is required.` |
| `403` | `FORBIDDEN` | `You do not have permission to perform this action.` |
| `404` | `NOT_FOUND` | Existing generic not-found message unless different wording is approved. |
| `500` | `INTERNAL_SERVER_ERROR` | Existing generic internal-error message for an unclassified delete failure. |

## Proposed Controller Methods

```java
getPeerReviewAssignments(Long assignmentId, CustomUserPrincipal principal)
createPeerReviewAssignment(
    Long assignmentId,
    CreatePeerReviewAssignmentRequest request,
    CustomUserPrincipal principal
)
deletePeerReviewAssignment(Long peerReviewAssignmentId, CustomUserPrincipal principal)
```

The controller extracts only the current user's ID from the security principal and delegates to `PeerReviewAssignmentService`. It must not inject a DAO or `PeerReviewAssignmentServiceImpl`.

## Proposed Facade Methods

```java
AssignPeerReviewPageResponse getAssignPeerReviewPageData(
    Long assignmentId,
    Long lecturerId
);

PeerReviewAssignmentResponse createPeerReviewAssignment(
    Long assignmentId,
    CreatePeerReviewAssignmentRequest request,
    Long lecturerId
);

DeletePeerReviewAssignmentResponse deletePeerReviewAssignment(
    Long peerReviewAssignmentId,
    Long lecturerId
);
```

## Sequence and Model Adaptations

1. Sequence `PeerReviewService` becomes `PeerReviewAssignmentService` to keep UC-14 assignment tasks separate from UC-07 submitted reviews.
2. Sequence `PeerReviewDAO` becomes existing `PeerReviewAssignmentDao` for tasks and `PeerReviewDao` for submitted-review existence checks.
3. Sequence `GroupDAO` becomes existing `StudentGroupDao`.
4. API field `targetGroup` maps to existing entity field `revieweeGroup` and database column `reviewee_group_id`.
5. The page's `warningList` becomes `groupsWithoutReceivedReviews`, computed by the facade from course groups minus active target/reviewee groups.
6. Authentication, lecturer-role, course-ownership, and missing-selection checks are added from the use-case specification even though they are absent from the sequence messages.
7. Spring `DataAccessException` replaces diagram-level `SQLException` handling.
8. User-facing success text uses the full use-case messages rather than diagram shorthand such as `Created successfully`.

## Approval Required Before Implementation

1. Does a `DRAFT` or `RETURNED` `PeerReview` block deletion, or only status `SUBMITTED`? The existing foreign key uses `ON DELETE RESTRICT`, so deleting a task with any child review requires either deleting the draft first or blocking deletion.
2. Does the peer-review deadline also block deletion, or only creation/modification? The provided deadline error text does not mention deletion.
3. Should `PeerReviewAssignment.dueAt` copy `Assignment.reviewDeadline`, or remain nullable and derive the deadline through the assignment?
4. Which `GroupStatus` values are eligible for reviewer/target selection and warning calculation: all course groups or only `READY` groups?
5. Should `CANCELLED` assignments count as received reviews in the warning list? Recommendation: no.
6. Confirm physical deletion, as shown by `deleteById`, instead of changing status to `CANCELLED`.
7. Confirm `201 Created` for POST or use `200 OK` for consistency with the current simple controller style.
8. Confirm use of existing generic `NOT_FOUND` and `FORBIDDEN` messages where UC-14 gives no exact wording.
9. The post-condition that the reviewer can access the target submission requires coordination with UC-07/submission authorization. Confirm that Phase 2B creates the assignment-management API only and leaves submission-access enforcement to the related use case.

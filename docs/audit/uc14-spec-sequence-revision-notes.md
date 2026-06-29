# UC-14 Assign Peer Review Specification and Sequence Revision Notes

## Current Implementation Boundary

UC-14 is implemented for:

- Loading the assign peer review page.
- Showing assignment information, course groups, existing reviewer-target pairs, and groups without received reviews.
- Creating a peer review assignment task.
- Deleting a peer review assignment task when no peer review record exists.
- Validating lecturer role, course ownership, missing groups, same-course groups, self-review, duplicate pairs, and review deadline.
- Returning exact use-case messages for expected create/delete errors.

The implementation does not implement a modify/update endpoint for an existing peer review assignment.

The implementation does not directly implement reviewer access to target submission. That access belongs to UC-07 Submit Peer Review and its authorization/evidence flow.

## Specification Revisions Needed

1. Use the implementation names:
   - `PeerReviewAssignmentController`
   - `PeerReviewAssignmentService`
   - `PeerReviewAssignmentDao`
   - `PeerReviewDao`

2. Add explicit authentication and authorization rules:
   - Actor must be authenticated.
   - Actor must have `LECTURER` role.
   - Actor must own/manage the assignment course.

3. Add missing reviewer/target validation before other assignment rules:
   - If either `reviewerGroupId` or `targetGroupId` is missing, return:
     `Please select both a reviewer group and a target group before assigning a peer review task.`

4. Revise the delete rule to match current implementation:
   - Current code blocks deletion if any `PeerReview` record exists for the peer review assignment.
   - The written specification says deletion is blocked after a submitted review.
   - Choose one:
     - Update specification to the stricter MVP rule: "Cannot delete once review evidence/record exists."
     - Or later change implementation to check only submitted reviews.

5. Revise "add or modify" wording:
   - Current implementation supports create/add and delete.
   - Modify/update before the deadline is not implemented.
   - Mark modify as deferred unless a `PUT` or `PATCH` endpoint is added later.

6. Revise postcondition wording:
   - Current UC-14 guarantees that the peer review assignment task is saved and can be used by UC-07.
   - Actual target-submission access should be documented under UC-07.

## Sequence Diagram Revisions Needed

Revise lifelines:

- `PeerReviewController` -> `PeerReviewAssignmentController`
- `PeerReviewService` -> `PeerReviewAssignmentService`
- `PeerReviewDAO` should be split into:
  - `PeerReviewAssignmentDao` for assignment-task loading, duplicate check, save, delete.
  - `PeerReviewDao` for checking whether review evidence already exists before delete.

Add validation messages:

- `validateCurrentLecturer(lecturerId)`
- `validateAssignmentExists(assignmentId)`
- `validateLecturerOwnsCourse(assignmentId, lecturerId)`
- `validateRequiredGroups(reviewerGroupId, targetGroupId)`
- `validateGroupsInAssignmentCourse(assignmentId, reviewerGroupId, targetGroupId)`
- `validateNotSelfReview(reviewerGroupId, targetGroupId)`
- `validateReviewDeadlineOpen(assignmentId)`
- `checkDuplicateAssignment(assignmentId, reviewerGroupId, targetGroupId)`

Add or correct exception branches:

- Missing reviewer/target group.
- Non-lecturer forbidden.
- Lecturer does not own the course.
- Assignment not found.
- Peer review assignment not found on delete.

Revise delete messages:

- Current sequence message `hasSubmittedReview(peerReviewAssignmentId)` should become:
  `existsReviewForPeerReviewAssignment(peerReviewAssignmentId)`
- If the team wants the written "submitted review only" rule, implementation should later change from `existsByPeerReviewAssignmentId` to a submitted-status-specific check.

Keep create success:

- `Peer review assignment created successfully.`

Keep delete success:

- `Peer review assignment deleted successfully.`


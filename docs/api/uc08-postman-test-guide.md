# UC-08 Monitor Progress Postman Test Guide

## 1. Prepare MySQL Data

Run `docs/api/uc08-demo-seed.sql` in MySQL Workbench against the `peergradehub` schema. Keep `@uc08_cleanup_only = 0`.

The final result row prints the real IDs. Copy them into Postman. The script is rerunnable and refreshes its deadlines and fixture statuses.

Verified against the current local demo database on 2026-06-22:

```text
courseId = 2
assignmentId = 2
submittedGroupId = 4
lateGroupId = 5
pendingGroupId = 6
```

Auto-increment values may differ on another database, so the seed's final result row remains authoritative.

## 2. Postman Environment

Create these variables:

```text
baseUrl = http://localhost:8080/api
token =
courseId = <course_id from seed result>
assignmentId = <assignment_id from seed result>
submittedGroupId = <submitted_group_id from seed result>
lateGroupId = <late_group_id from seed result>
pendingGroupId = <pending_group_id from seed result>
```

## 3. Login as Lecturer

```http
POST {{baseUrl}}/auth/login
Content-Type: application/json
```

```json
{
  "usernameOrEmail": "lecturer01",
  "password": "Lecturer@123",
  "rememberMe": false
}
```

Postman Tests:

```javascript
pm.test("Lecturer login succeeds", () => {
    pm.response.to.have.status(200);
});

const body = pm.response.json();
pm.expect(body.data.user.role).to.eql("LECTURER");
pm.environment.set("token", body.data.token);
```

For protected requests use **Authorization -> Bearer Token**:

```text
{{token}}
```

## 4. Dashboard

```http
GET {{baseUrl}}/courses/{{courseId}}/assignments/{{assignmentId}}/progress
```

Expected key values:

```text
totalGroups = 3
submittedCount = 2
pendingCount = 1
lateCount = 1
submissionCompletionRate = 66.67
totalReviewAssignments = 2
completedReviews = 1
incompleteReviews = 1
peerReviewCompletionRate = 50.00
groupsWithNoReceivedReview = 1
groupsWithIncompleteAssignedReviews = 1
```

Postman Tests:

```javascript
pm.test("Dashboard loads", () => pm.response.to.have.status(200));

const body = pm.response.json();
const stats = body.data.statistics;

pm.test("Dashboard statistics match the demo fixture", () => {
    pm.expect(body.success).to.eql(true);
    pm.expect(body.data.groups).to.have.lengthOf(3);
    pm.expect(stats.totalGroups).to.eql(3);
    pm.expect(stats.submittedCount).to.eql(2);
    pm.expect(stats.pendingCount).to.eql(1);
    pm.expect(stats.lateCount).to.eql(1);
    pm.expect(stats.submissionCompletionRate).to.eql(66.67);
    pm.expect(stats.totalReviewAssignments).to.eql(2);
    pm.expect(stats.completedReviews).to.eql(1);
    pm.expect(stats.incompleteReviews).to.eql(1);
    pm.expect(stats.peerReviewCompletionRate).to.eql(50.00);
    pm.expect(stats.groupsWithNoReceivedReview).to.eql(1);
    pm.expect(stats.groupsWithIncompleteAssignedReviews).to.eql(1);
});
```

## 5. Filters

Use:

```http
GET {{baseUrl}}/courses/{{courseId}}/assignments/{{assignmentId}}/progress/groups?filter=ALL
```

Repeat with these expected group counts:

| Filter | Expected count | Expected fixture group |
|---|---:|---|
| `ALL` | 3 | All groups |
| `INCOMPLETE` | 2 | Late/incomplete-review group and pending group |
| `NOT_SUBMITTED` | 1 | `pendingGroupId` |
| `SUBMITTED` | 2 | `submittedGroupId`, `lateGroupId` |
| `LATE` | 1 | `lateGroupId` |
| `NOT_REVIEWED` | 1 | `lateGroupId` |
| `REVIEWED` | 1 | `submittedGroupId` |
| `NO_RECEIVED_REVIEW` | 1 | `pendingGroupId` |

Generic filter test:

```javascript
pm.test("Filter succeeds", () => pm.response.to.have.status(200));

const body = pm.response.json();
pm.test("Response contains DTO group summaries", () => {
    pm.expect(body.success).to.eql(true);
    pm.expect(body.data.filter).to.be.a("string");
    pm.expect(body.data.groups).to.be.an("array");
});
```

Invalid filter:

```http
GET {{baseUrl}}/courses/{{courseId}}/assignments/{{assignmentId}}/progress/groups?filter=UNKNOWN
```

Expected: `400 BAD_REQUEST` structured JSON.

## 6. Group Details

Completed incoming evidence and late submission:

```http
GET {{baseUrl}}/assignments/{{assignmentId}}/progress/groups/{{lateGroupId}}
```

Expected:

- `submission.status = LATE`
- one outgoing review with `reviewStatus = DRAFT`
- one received review with `status = SUBMITTED`
- received score `82.50`

Postman Tests:

```javascript
pm.test("Group details load", () => pm.response.to.have.status(200));

const body = pm.response.json();
pm.test("Late group evidence is correct", () => {
    pm.expect(body.data.group.id).to.eql(
        Number(pm.environment.get("lateGroupId"))
    );
    pm.expect(body.data.submission.status).to.eql("LATE");
    pm.expect(body.data.outgoingReviews).to.have.lengthOf(1);
    pm.expect(body.data.outgoingReviews[0].reviewStatus).to.eql("DRAFT");
    pm.expect(body.data.receivedReviewEvidence).to.have.lengthOf(1);
    pm.expect(body.data.receivedReviewEvidence[0].status).to.eql("SUBMITTED");
});
```

Empty evidence case:

```http
GET {{baseUrl}}/assignments/{{assignmentId}}/progress/groups/{{pendingGroupId}}
```

Expected: `200 OK`, `submission = null`, and empty review arrays.

## 7. Unauthorized and Forbidden Checks

### Missing Token

Send the dashboard request with **No Auth**. Expected: JSON `401 UNAUTHORIZED`.

### Student Forbidden

Login again using:

```json
{
  "usernameOrEmail": "student01",
  "password": "Student@123",
  "rememberMe": false
}
```

Replace `token` with the student token and call the dashboard endpoint. Expected: JSON `403 FORBIDDEN`.

Restore the lecturer token before continuing lecturer tests.

## 8. Cleanup

Change the first line in `uc08-demo-seed.sql` to:

```sql
SET @uc08_cleanup_only = 1;
```

Run the script again. Cleanup is scoped to the stable `UC08-DEMO-01` fixture and does not delete demo users.

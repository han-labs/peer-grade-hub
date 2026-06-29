# Demo Use Case Test Checklist

Use this checklist after a fresh project startup with the Flyway demo seed applied.

Base URLs:

```text
Backend:  http://localhost:8080/api
Frontend: http://localhost:5173
```

## 1. Health and Login

- [ ] Start MySQL with `docker compose up -d`.
- [ ] Start the backend.
- [ ] Confirm `GET http://localhost:8080/api/health` returns success.
- [ ] Start the frontend.
- [ ] Login as Admin: `admin01 / Admin@123`.
- [ ] Login as Lecturer: `lecturer01 / Lecturer@123`.
- [ ] Login as Student: `student01 / Student@123`.
- [ ] Confirm each role lands on the correct dashboard.
- [ ] Confirm logout works.

## 2. Admin Smoke Test

- [ ] Login as `admin01`.
- [ ] Confirm the admin dashboard loads.
- [ ] Confirm overview numbers come from the database, including users, active users, lecturers, students, courses, groups, and assignments.
- [ ] Confirm the recent courses panel lists real seeded courses.
- [ ] Confirm profile information is visible from the profile control.
- [ ] Open any available admin feature cards or navigation items.
- [ ] Confirm no feature crashes because of missing demo data.

## 3. Lecturer Course Workspace

- [ ] Login as `lecturer01`.
- [ ] Confirm the lecturer overview shows real course, active course, assignment, group, submission, and peer review counts.
- [ ] Confirm the lecturer overview lists real courses and upcoming assignments.
- [ ] Open Manage Courses.
- [ ] Confirm multiple courses are visible, including:
  - `SE101-2026-A`
  - `SE101-2026-B`
  - `WEB202-2026-A`
  - `DB301-2026-A`
  - `JOIN-2026-A`
  - archived course `SE101-2025-OLD`, where archived courses are shown by the current UI
- [ ] Open a course workspace if the UI supports it.
- [ ] Confirm lessons, groups, or assignments load without an unexpected error.

## 4. Manage Group

- [ ] In a lecturer course workspace, open group management if available.
- [ ] Confirm groups show different statuses such as `FORMING`, `READY`, and `LOCKED`.
- [ ] Confirm `JOIN-2026-A` contains:
  - `Join Open Group`
  - `Join Full Group`
  - `Join Locked Group`

## 5. Join Course and Group

- [ ] Login as `student01`.
- [ ] Use the join-course flow if implemented.
- [ ] Try joining:

```text
Class code: JOIN-2026-A
Invitation code: JOIN2026A
```

- [ ] Confirm `student01` can test a first-time join path for this course.
- [ ] Try the open group if group joining is implemented.
- [ ] Confirm full or locked group validation is handled by the existing UI/API.

## 6. Manage Assignment

- [ ] Login as `lecturer01`.
- [ ] Open Manage Assignments.
- [ ] Confirm seeded assignments are visible where the current UI supports them:
  - `UC14 Demo Assignment`
  - `SE101-A Progress Monitor Assignment`
  - `SE101-A Open Submission Assignment`
  - `SE101-B Design Critique`
  - `WEB202 Portfolio Sprint`
  - `DB301 Normalization Project`

## 7. Submit Assignment

- [ ] Login as a student in a seeded group.
- [ ] Open the submit-assignment UI if implemented.
- [ ] Confirm assignment `SE101-A Open Submission Assignment` can be used for a clean submission scenario.
- [ ] Confirm assignment `SE101-A Progress Monitor Assignment` shows existing submission history where the UI supports it.

## 8. UC-14 Assign Peer Review

- [ ] Login as `lecturer01`.
- [ ] Open:

```text
http://localhost:5173/lecturer/assignments/1/peer-review-assignments
```

- [ ] Confirm assignment data loads for `UC14 Demo Assignment`.
- [ ] Confirm groups `1`, `2`, and `3` are available.
- [ ] Create reviewer group `1` -> target group `2`.
- [ ] Confirm success message:

```text
Peer review assignment created successfully.
```

- [ ] Try the same pair again.
- [ ] Confirm duplicate-pair error is displayed.
- [ ] Try reviewer group `1` -> target group `1`.
- [ ] Confirm self-review error is displayed.
- [ ] Delete the created assignment.
- [ ] Confirm success message:

```text
Peer review assignment deleted successfully.
```

- [ ] Login as `student01` and open the same route directly.
- [ ] Confirm restricted access is handled safely.

## 9. UC-08 Monitor Progress

- [ ] Login as `lecturer01`.
- [ ] Open Monitor Progress from the lecturer sidebar.
- [ ] Confirm the route is:

```text
http://localhost:5173/lecturer/progress
```

- [ ] Confirm courses taught by `lecturer01` are shown.
- [ ] Confirm assignment counts and the course workload visual are based on real assignment data.
- [ ] Open course dashboard for `SE101-2026-A`.
- [ ] Confirm the route is:

```text
http://localhost:5173/lecturer/progress/courses/2
```

- [ ] Confirm the course dashboard shows assignments in that course.
- [ ] Confirm the course dashboard shows assignment progress rows where progress data exists.
- [ ] Click `View progress` for the main progress assignment.
- [ ] Confirm it opens the assignment-level detail route:

```text
http://localhost:5173/lecturer/courses/2/assignments/2/progress
```

- [ ] Confirm the page context shows:
  - course `Software Engineering A`
  - class code `SE101-2026-A`
  - assignment `SE101-A Progress Monitor Assignment`
- [ ] Confirm the dashboard shows six groups.
- [ ] Confirm the page represents these returned statistics:
  - `totalGroups = 6`
  - `submittedCount = 3`
  - `pendingCount = 3`
  - `lateCount = 1`
  - `totalReviewAssignments = 5`
  - `completedReviews = 2`
  - `incompleteReviews = 3`
  - `groupsWithNoReceivedReview = 2`
  - `groupsWithIncompleteAssignedReviews = 3`
- [ ] Check filters:
  - `All`
  - `Needs Attention`
  - `Review Issues`
  - `No Received Review`
  - `Submitted`
  - `Reviewed`
  - `Late`
  - `Not Submitted`
- [ ] Open details for `UC08 Group 2 - Late`.
- [ ] Confirm it shows a `LATE` submission and a draft/incomplete outgoing review.
- [ ] Open details for `UC08 Group 3 - Pending`.
- [ ] Confirm it shows no submission and empty review evidence.
- [ ] Login as `student01` and open the route directly.
- [ ] Confirm restricted access is handled safely.

## 10. Submit Peer Review

- [ ] Login as a student whose group has an assigned peer review task.
- [ ] Use assignment `SE101-A Progress Monitor Assignment` if the submit-peer-review UI is available.
- [ ] Confirm at least one unfinished review task is visible.
- [ ] Confirm at least one submitted review exists for completed-state display.

Useful seeded peer review examples:

| Reviewer group | Target group | State |
|---|---|---|
| `UC08 Group 1 - Submitted` | `UC08 Group 2 - Late` | submitted review |
| `UC08 Group 2 - Late` | `UC08 Group 1 - Submitted` | draft/incomplete review |
| `UC08 Group 4 - Returned` | `UC08 Group 5 - Reviewed` | assigned, no review yet |
| `UC08 Group 5 - Reviewed` | `UC08 Group 4 - Returned` | submitted review |

## 11. Manage Final Grade

- [ ] Login as `lecturer01`.
- [ ] Open Manage Final Grades if implemented.
- [ ] Confirm assignment `SE101-A Progress Monitor Assignment` has:
  - published result for `UC08 Group 1 - Submitted`
  - unpublished result for `UC08 Group 2 - Late`
- [ ] Confirm `WEB202 Portfolio Sprint` has a published result for `WEB202 Group Studio`.

## 12. View Published Results

- [ ] Login as `student01`.
- [ ] Confirm the student overview shows real joined courses, groups, assignments, peer reviews, pending work, and published-result counts.
- [ ] Open View Results if implemented.
- [ ] Confirm published results are visible where the current UI supports them.
- [ ] Confirm unpublished results are not shown to students.

## 13. Postman Quick Checks

Login as lecturer:

```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json
```

```json
{
  "usernameOrEmail": "lecturer01",
  "password": "Lecturer@123",
  "rememberMe": false
}
```

Use the returned token as `Authorization: Bearer <token>`.

UC-14:

```http
GET http://localhost:8080/api/assignments/1/peer-review-assignments
```

UC-08:

```http
GET http://localhost:8080/api/courses/2/assignments/2/progress
```

Role dashboards:

```http
GET http://localhost:8080/api/dashboard/admin
GET http://localhost:8080/api/dashboard/lecturer
GET http://localhost:8080/api/dashboard/student
```

## 14. Fresh Seed Reset Reminder

If the database existed before the demo seed, Flyway applies only migrations that have not already run. If local rows conflict with the stable fresh-DB IDs, reset the local Docker volume:

```bash
docker compose down
docker volume rm peer-grade-hub_peergrade_mysql_data
docker compose up -d
```

Only do this for local development databases. It deletes the local MySQL volume.

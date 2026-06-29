# PeerGrade Hub Demo Data Guide

This guide describes the reproducible demo data loaded by Flyway migration:

`backend/src/main/resources/db/migration/V5__seed_demo_usecase_data.sql`

The seed is intended for normal team startup:

```bash
docker compose up -d
cd backend
.\mvnw.cmd spring-boot:run
cd ..\frontend
npm install
npm run dev
```

Flyway applies the seed automatically on a fresh database. The seed is additive: it does not drop, truncate, or delete existing project data.

## Demo Accounts

| Role | Username | Password | Notes |
|---|---|---|---|
| Admin | `admin01` | `Admin@123` | Seeded by `V2__seed_demo_users.sql` |
| Lecturer | `lecturer01` | `Lecturer@123` | Main lecturer for demos |
| Student | `student01` | `Student@123` | Main student for login/student dashboard |
| Lecturer | `lecturer02` | `Lecturer@123` | Secondary lecturer for ownership checks |
| Student | `student02` | `Student@123` | Additional group/member data |
| Student | `student03` | `Student@123` | Additional group/member data |
| Student | `student04` | `Student@123` | Additional group/member data |
| Student | `student05` | `Student@123` | Additional group/member data |
| Student | `student06` | `Student@123` | Additional group/member data |

Passwords are stored as BCrypt hashes in the database. Plain text passwords are listed here only for local demo login.

## Main Courses and Class Codes

| Course ID on fresh DB | Class code | Course name | Invitation code | Owner | Purpose |
|---:|---|---|---|---|---|
| `1` | `UC14-DEMO-01` | UC14 Demo Course | `UC14DEMO` | `lecturer01` | Assign Peer Review fixed-route demo |
| `2` | `SE101-2026-A` | Software Engineering A | `SE101A` | `lecturer01` | Monitor Progress, submissions, peer reviews, grading |
| `3` | `SE101-2026-B` | Software Engineering B | `SE101B` | `lecturer01` | Manage Course/Group/Assignment contrast data |
| `4` | `WEB202-2026-A` | Web Application Development | `WEB202A` | `lecturer01` | Assignment and published result data |
| `5` | `DB301-2026-A` | Database Systems | `DB301A` | `lecturer01` | Multi-course lecturer workspace data |
| `6` | `JOIN-2026-A` | Course Join Practice | `JOIN2026A` | `lecturer01` | Join Course and Group testing |
| `7` | `SE101-2026-X` | Software Engineering External | `SE101X` | `lecturer02` | Ownership/forbidden checks |
| `8` | `SE101-2025-OLD` | Archived Software Engineering Lab | `SE101OLD` | `lecturer01` | Archived course for archive/reactivate demos |

## Stable Frontend Routes

These IDs are intentionally anchored on a fresh database because the current frontend uses direct demo routes.

| Feature | Route | Seed support |
|---|---|---|
| Admin dashboard API | `/api/dashboard/admin` | System-wide user/course/group/assignment totals |
| Lecturer dashboard API | `/api/dashboard/lecturer` | `lecturer01` course, assignment, group, submission, review totals |
| Student dashboard API | `/api/dashboard/student` | `student01` joined courses, groups, assignments, reviews, results |
| Assign Peer Review | `/lecturer/assignments/1/peer-review-assignments` | Assignment `1`, groups `1`, `2`, `3` |
| Monitor Progress selector | `/lecturer/progress` | Lists lecturer courses and their real assignments |
| Course Progress dashboard | `/lecturer/progress/courses/2` | Shows assignment progress rows for course `2` |
| Monitor Progress detail | `/lecturer/courses/2/assignments/2/progress` | Course `2`, assignment `2`, groups `4` to `9` |

If an old local Docker volume already contains different rows with these numeric IDs, Flyway will not rewrite old data. Reset the local development database to get the exact fixed-route dataset.

## Use Case Coverage

### UC-01 Login

Use `admin01`, `lecturer01`, and `student01` to verify role-aware login and dashboards.

### Manage Course

`lecturer01` owns multiple active courses:

- `SE101-2026-A`
- `SE101-2026-B`
- `WEB202-2026-A`
- `DB301-2026-A`
- `JOIN-2026-A`

`lecturer01` also owns archived course `SE101-2025-OLD`, so archive/reactivate screens can distinguish active and archived classes when supported.

This keeps the lecturer workspace from looking like a single-course demo.

### Manage Group

Groups are seeded across several courses with different statuses:

- `FORMING`: `UC14 Group 3`, `UC08 Group 3 - Pending`, `SE101-B Group Beta`, `Join Open Group`
- `READY`: most active working groups
- `LOCKED`: `UC08 Group 6 - Needs Review`, `Join Locked Group`

`Join Full Group` has two members and `max_members = 2`.

### Join Course and Group

Use class code/invitation code:

```text
Class code: JOIN-2026-A
Invitation code: JOIN2026A
```

`student01` is intentionally not pre-enrolled in this course, so the student can test a first-time join flow. The course includes:

- `Join Open Group`: open capacity
- `Join Full Group`: full
- `Join Locked Group`: locked

### Manage Assignment

Seeded assignments include:

| Assignment ID on fresh DB | Title | Course |
|---:|---|---|
| `1` | UC14 Demo Assignment | `UC14-DEMO-01` |
| `2` | SE101-A Progress Monitor Assignment | `SE101-2026-A` |
| `3` | SE101-A Open Submission Assignment | `SE101-2026-A` |
| `4` | SE101-B Design Critique | `SE101-2026-B` |
| `5` | WEB202 Portfolio Sprint | `WEB202-2026-A` |
| `6` | DB301 Normalization Project | `DB301-2026-A` |

### Submit Assignment

The seed includes mixed submission states for assignment `2`:

- `UC08 Group 1 - Submitted`: `SUBMITTED`
- `UC08 Group 2 - Late`: `LATE`
- `UC08 Group 3 - Pending`: no submission
- `UC08 Group 4 - Returned`: `RETURNED`
- `UC08 Group 5 - Reviewed`: `SUBMITTED`
- `UC08 Group 6 - Needs Review`: `DRAFT`

Assignment `3` is an open assignment that can be used for a clean submission scenario.

### Submit Peer Review

Assignment `2` includes peer review tasks:

- Group `4` reviews group `5`: submitted review
- Group `5` reviews group `4`: draft/incomplete review
- Group `7` reviews group `8`: assigned with no review
- Group `8` reviews group `7`: submitted review with score `82.50`
- Group `9` reviews group `4`: assigned with no review
- Group `4` reviews group `6`: cancelled assignment, excluded from monitor counts

### UC-14 Assign Peer Review

Fresh DB route:

```text
/lecturer/assignments/1/peer-review-assignments
```

Assignment `1` has an open review deadline and three groups:

- group `1`: `UC14 Group 1`
- group `2`: `UC14 Group 2`
- group `3`: `UC14 Group 3`

The seed does not pre-create UC-14 peer review pairings, so lecturers can test create, duplicate validation, self-review validation, and delete.

### UC-08 Monitor Progress

Fresh DB route:

```text
/lecturer/progress
```

The lecturer sidebar opens this selection page first. From there, choose a course and assignment, then open the assignment progress detail.

Fresh DB assignment-level detail route:

```text
/lecturer/courses/2/assignments/2/progress
```

The monitor dataset uses six groups. It includes submitted, late, pending, returned, draft, completed reviews, incomplete reviews, no received review, and a cancelled peer review assignment.

Expected high-level values:

| Metric | Expected value |
|---|---:|
| totalGroups | `6` |
| submittedCount | `3` |
| pendingCount | `3` |
| lateCount | `1` |
| totalReviewAssignments | `5` |
| completedReviews | `2` |
| incompleteReviews | `3` |
| groupsWithNoReceivedReview | `2` |
| groupsWithIncompleteAssignedReviews | `3` |

The frontend should display the exact values returned by the backend. Older manual UC-08 docs may describe a smaller three-group fixture from before this reproducible seed.

### Manage Final Grade

Assignment results are seeded for:

- assignment `2`, group `4`: published score `91.50`
- assignment `2`, group `5`: unpublished score `78.00`
- assignment `5`, group `12`: published score `89.00`

This supports draft/unpublished and published-result views when those features are available.

### View Published Results

Published results exist for groups containing demo students:

- `student01` and `student02` can see the published result for assignment `2`, group `4`, if the student result UI is implemented.
- `student06` can see the published result for assignment `5`, group `12`, if the student result UI is implemented.

The unpublished result for assignment `2`, group `5` should remain hidden from student result views.

## Resetting a Local Development Database

Flyway versioned migrations run once per database. If your Docker volume was created before `V5`, restarting the backend should apply `V5`. If your old local data conflicts with the fixed numeric demo IDs, reset only your local development database.

Check the volume name first:

```bash
docker volume ls
```

Typical reset for this project:

```bash
docker compose down
docker volume rm peer-grade-hub_peergrade_mysql_data
docker compose up -d
```

Then start the backend. Flyway should apply `V1`, `V2`, `V4`, and `V5`.

Warning: removing the Docker volume deletes local MySQL data on that machine. Do this only for development/demo reset, not for shared or important data.

## Notes and Limitations

- The seed gives enough data for teams to test main flows, but it does not implement missing frontend or backend use cases.
- Deadline extension and grade penalty actions remain deferred until schema and API support are approved.
- The seed avoids mutating old user/team data. On dirty databases, fixed numeric demo routes may require a local DB reset.
- The older manual files such as `docs/api/uc08-demo-seed.sql` are still useful for isolated local experiments, but new team onboarding should rely on Flyway `V5`.

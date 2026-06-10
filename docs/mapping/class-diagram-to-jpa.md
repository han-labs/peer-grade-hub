# Class Diagram to JPA Mapping Documentation

This document records the design translation from the corrected UML Design Class Diagram to Java JPA Entities, Repositories, Services, and Flyway database constraints.

---

## 1. Class Diagram to JPA Mapping Table

| UML Class | Java Entity / Enum | Database Table | Key Attributes / Columns | JPA Relationships | Related SRS / Use Cases | Design & Implementation Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `User` | `User` | `app_users` | `id`, `username`, `email`, `password_hash`, `full_name`, `user_role`, `phone_number`, `status` | None | Manage Users (Admin) | Mapped to `app_users` instead of `users` to prevent conflicts with reserved keywords in PostgreSQL. ID is mapped to `id` column. |
| `UserStatus` | `UserStatus` (enum) | Stored as `VARCHAR` | `ACTIVE`, `INACTIVE`, `LOCKED` | None | User State management | Restricts possible status options. Enforced with a SQL `CHECK` constraint. |
| `UserRole` | `UserRole` (enum) | Stored as `VARCHAR` | `STUDENT`, `LECTURER`, `ADMINISTRATOR` | None | RBAC Authorization | Configured as Enum Type String. Enforced with a SQL `CHECK` constraint. |
| `Course` | `Course` | `courses` | `course_id`, `course_name`, `class_code`, `semester`, `description` | `lecturer` (ManyToOne to `User`, lazy, not null) | Manage Courses | Lecturers own courses. Deletion of courses does not cascade to the lecturer. |
| `StudentGroup` | `StudentGroup` | `student_groups` | `group_id`, `group_name`, `max_members` | `course` (ManyToOne to `Course`, lazy, not null) | Manage Groups | unique constraint on `(course_id, group_name)` to prevent duplicate names in a course. |
| `GroupMember` | `GroupMember` | `group_members` | `group_member_id`, `joined_at` | `group` (ManyToOne to `StudentGroup`), `user` (ManyToOne to `User`) | Enforce single group membership | **Deviation**: Replaced UML direct `@ManyToMany` list with a membership association table to support member count validation and enforce unique group enrollment constraint. |
| `Lesson` | `Lesson` | `lessons` | `lesson_id`, `title` | `course` (ManyToOne to `Course`, lazy, not null) | Manage Lessons | Composition relationship implemented via mandatory foreign key constraint. |
| `Assignment` | `Assignment` | `assignments` | `assignment_id`, `title`, `description`, `deadline`, `review_deadline`, `showcase_mode` | `lesson` (ManyToOne to `Lesson`, lazy, not null) | Manage Assignments | Enforces validation: `review_deadline > deadline` in both SQL schema and service layers. |
| `LessonMaterial` | `LessonMaterial` (abstract) | `lesson_materials` | `material_id`, `title`, `material_type` | `lesson` (ManyToOne, lazy), `assignment` (ManyToOne, lazy) | View / Add Materials | Base class for inheritance. Employs `SINGLE_TABLE` inheritance strategy with a `material_type` discriminator. |
| `FileAttachment` | `FileAttachment` | `lesson_materials` | `file_name`, `file_path`, `file_size_mb`, `file_type` | Inherited from base | Material Attachments | Concrete sub-type containing metadata for local files uploaded. |
| `LinkAttachment` | `LinkAttachment` | `lesson_materials` | `url`, `label` | Inherited from base | Material Links | Concrete sub-type storing hyperlink endpoints and labels. |
| `AssignmentResult` | `AssignmentResult` | `assignment_results` | `assignment_result_id`, `comments`, `score` | `assignment` (ManyToOne, lazy), `group` (ManyToOne, lazy) | UC-09 Manage Final Grades | Represents the lecturer's final grade. Unique on `(assignment_id, group_id)`. Score restricted to [0..100]. |
| `ResultAppeal` | `ResultAppeal` | `result_appeals` | `appeal_id`, `content`, `appeal_status`, `resolution_note`, `resolved_at` | `student` (ManyToOne, lazy), `assignmentResult` (OneToOne, lazy), `resolvedBy` (ManyToOne, lazy) | UC-12 Resolve Grade Appeal | Allows only one appeal per result. Unique on `assignment_result_id`. Includes resolution fields for lecturer response. |

---

## 2. AssignmentResult Semantics & UC-09 / UC-10

### Analysis of AssignmentResult Role
According to the SRS rules:
1. "Each group should have only one final result per assignment."
2. "Peer review scores/comments are reference information only; the lecturer is the final decision-maker for final grades."

This confirms that the `AssignmentResult` entity represents the **lecturer's final grade/result** rather than an individual student's peer review evaluation. Peer reviews would require multiple reviews from different students (and are not represented in the class diagram yet).

### Support for UC-09 and UC-10
To fully support:
- **UC-09 Manage Final Grades** (by Lecturers)
- **UC-10 View Published Results** (by Students)

The final grades need a publication state. We plan to add a publication flag field `isPublished` (defaulting to `false`) to the `AssignmentResult` entity in the next development iteration. This will allow:
- Lecturers to input and review grades privately until they decide to publish them.
- Students to query only results where `isPublished = true`.

---

## 3. SRS Alignment & Verification Coverage

We have checked the current implementation against the SRS use cases and summarized the coverage below:

### A. Fully Covered Features
- **User Authorization Roles**: `UserRole` enum and `User.status` handle system roles and states.
- **Group Management Constraints**:
  - `GroupService.joinGroup` checks `maxMembers` capacity limit.
  - `GroupService.joinGroup` checks student enrollment to ensure a student belongs to at least and at most one group in a course.
- **Assignment Chronology Check**:
  - `AssignmentService` validates `reviewDeadline > deadline`.
  - Enforced at the database level with a SQL check constraint.
- **Result Score Boundaries**:
  - `AssignmentResultService` validates score range (0.00 to 100.00).
  - Enforced at the database level with a check constraint.
- **Single Result Constraint**:
  - `AssignmentResultService` enforces a unique result per group-assignment via upsert checks.
  - Enforced via unique constraint `uk_assignment_results_assignment_group` in SQL.
- **Appeal Submission Limits**:
  - `ResultAppealService` verifies the student is a member of the group receiving the result.
  - Enforced unique mapping between `AssignmentResult` and `ResultAppeal` (1-1 relation via `@OneToOne`).
- **Appeal Resolution Ownership (UC-12)**:
  - `ResultAppealService.resolveAppeal` checks that only `LECTURER` user roles can resolve appeals.
  - Stores status (`PENDING`, `APPROVED`, `REJECTED`), resolution note, resolver User, and timestamp.

### B. Partially Covered Features
- **Course Lecturer Assignment Verification**:
  - While `CourseService` checks if the course creator is a `LECTURER`, the appeal resolution service currently assumes the resolver is a lecturer, but does not explicitly verify if they are the specific lecturer managing that course. This is implemented at the service-level check: we will add a check that `resolver.getId() == appeal.getAssignmentResult().getAssignment().getLesson().getCourse().getLecturer().getId()`.

### C. Planned Extensions (Not covered in current class diagram)
- **UC-07 Submit Peer Review** and **UC-14 Assign Peer Review**:
  - These use cases require `PeerReview`, `PeerReviewAssignment`, and review rubric schemas. They are completely omitted in the current JPA/DB layout and are deferred to a later iteration.
- **Final Grade Publication Flag**:
  - A Boolean flag (`isPublished`) will be added to `AssignmentResult` to control student visibility for UC-10.

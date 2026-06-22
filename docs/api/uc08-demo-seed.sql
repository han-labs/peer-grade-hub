-- Temporary UC-08 Monitor Progress data for MySQL/Postman testing.
-- This is NOT a Flyway migration. Run it manually against peergradehub.
-- Default mode creates or refreshes the fixture. Set to 1 for cleanup only.
SET @uc08_cleanup_only = 0;

START TRANSACTION;

SET @uc08_class_code = 'UC08-DEMO-01';
SET @uc08_invitation_code = 'UC08-DEMO-INVITE';
SET @uc08_course_name = 'UC08 Demo Course';
SET @uc08_lesson_title = 'UC08 Monitoring Lesson';
SET @uc08_assignment_title = 'UC08 Progress Assignment';

SET @uc08_lecturer_id = (
  SELECT id FROM app_users
  WHERE username = 'lecturer01' AND user_role = 'LECTURER'
  LIMIT 1
);
SET @uc08_student_id = (
  SELECT id FROM app_users
  WHERE username = 'student01' AND user_role = 'STUDENT'
  LIMIT 1
);

INSERT INTO courses (
  course_name,
  class_code,
  invitation_code,
  semester,
  lecturer_id,
  description,
  group_formation_deadline,
  course_status
)
SELECT
  @uc08_course_name,
  @uc08_class_code,
  @uc08_invitation_code,
  'UC08 DEMO',
  @uc08_lecturer_id,
  'Temporary course for UC-08 Monitor Progress Postman testing.',
  DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 3 DAY),
  'ACTIVE'
FROM DUAL
WHERE @uc08_cleanup_only = 0
  AND @uc08_lecturer_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  course_name = @uc08_course_name,
  lecturer_id = @uc08_lecturer_id,
  description = 'Temporary course for UC-08 Monitor Progress Postman testing.',
  group_formation_deadline = DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 3 DAY),
  course_status = 'ACTIVE';

SET @uc08_course_id = (
  SELECT course_id FROM courses
  WHERE class_code = @uc08_class_code
  LIMIT 1
);

INSERT INTO lessons (title, course_id)
SELECT @uc08_lesson_title, @uc08_course_id
FROM DUAL
WHERE @uc08_cleanup_only = 0
  AND @uc08_course_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM lessons
    WHERE course_id = @uc08_course_id AND title = @uc08_lesson_title
  );

SET @uc08_lesson_id = (
  SELECT lesson_id FROM lessons
  WHERE course_id = @uc08_course_id AND title = @uc08_lesson_title
  ORDER BY lesson_id
  LIMIT 1
);

INSERT INTO assignments (
  title,
  description,
  submission_deadline,
  review_deadline,
  showcase_mode,
  lesson_id
)
SELECT
  @uc08_assignment_title,
  'Temporary assignment with submitted, late, and pending progress states.',
  DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 7 DAY),
  DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 14 DAY),
  FALSE,
  @uc08_lesson_id
FROM DUAL
WHERE @uc08_cleanup_only = 0
  AND @uc08_lesson_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM assignments
    WHERE lesson_id = @uc08_lesson_id AND title = @uc08_assignment_title
  );

SET @uc08_assignment_id = (
  SELECT assignment_id FROM assignments
  WHERE lesson_id = @uc08_lesson_id AND title = @uc08_assignment_title
  ORDER BY assignment_id
  LIMIT 1
);

UPDATE assignments
SET submission_deadline = DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 7 DAY),
    review_deadline = DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 14 DAY),
    updated_at = CURRENT_TIMESTAMP(6)
WHERE @uc08_cleanup_only = 0
  AND assignment_id = @uc08_assignment_id;

INSERT INTO student_groups (group_name, max_members, course_id, group_status)
SELECT 'UC08 Group 1 - Submitted', 5, @uc08_course_id, 'READY'
FROM DUAL
WHERE @uc08_cleanup_only = 0 AND @uc08_course_id IS NOT NULL
ON DUPLICATE KEY UPDATE max_members = 5, group_status = 'READY';

INSERT INTO student_groups (group_name, max_members, course_id, group_status)
SELECT 'UC08 Group 2 - Late', 5, @uc08_course_id, 'READY'
FROM DUAL
WHERE @uc08_cleanup_only = 0 AND @uc08_course_id IS NOT NULL
ON DUPLICATE KEY UPDATE max_members = 5, group_status = 'READY';

INSERT INTO student_groups (group_name, max_members, course_id, group_status)
SELECT 'UC08 Group 3 - Pending', 5, @uc08_course_id, 'FORMING'
FROM DUAL
WHERE @uc08_cleanup_only = 0 AND @uc08_course_id IS NOT NULL
ON DUPLICATE KEY UPDATE max_members = 5, group_status = 'FORMING';

SET @uc08_group_1_id = (
  SELECT group_id FROM student_groups
  WHERE course_id = @uc08_course_id AND group_name = 'UC08 Group 1 - Submitted'
  LIMIT 1
);
SET @uc08_group_2_id = (
  SELECT group_id FROM student_groups
  WHERE course_id = @uc08_course_id AND group_name = 'UC08 Group 2 - Late'
  LIMIT 1
);
SET @uc08_group_3_id = (
  SELECT group_id FROM student_groups
  WHERE course_id = @uc08_course_id AND group_name = 'UC08 Group 3 - Pending'
  LIMIT 1
);

-- Group 1: submitted; Group 2: late; Group 3 intentionally has no submission.
INSERT INTO assignment_submissions (
  assignment_id,
  group_id,
  submitted_by_id,
  submission_status,
  submitted_at,
  note
)
SELECT
  @uc08_assignment_id,
  @uc08_group_1_id,
  @uc08_student_id,
  'SUBMITTED',
  DATE_SUB(CURRENT_TIMESTAMP(6), INTERVAL 2 HOUR),
  'UC-08 on-time demo submission'
FROM DUAL
WHERE @uc08_cleanup_only = 0
  AND @uc08_assignment_id IS NOT NULL
  AND @uc08_group_1_id IS NOT NULL
  AND @uc08_student_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  submitted_by_id = @uc08_student_id,
  submission_status = 'SUBMITTED',
  submitted_at = DATE_SUB(CURRENT_TIMESTAMP(6), INTERVAL 2 HOUR),
  note = 'UC-08 on-time demo submission';

INSERT INTO assignment_submissions (
  assignment_id,
  group_id,
  submitted_by_id,
  submission_status,
  submitted_at,
  note
)
SELECT
  @uc08_assignment_id,
  @uc08_group_2_id,
  @uc08_student_id,
  'LATE',
  DATE_SUB(CURRENT_TIMESTAMP(6), INTERVAL 1 HOUR),
  'UC-08 late demo submission'
FROM DUAL
WHERE @uc08_cleanup_only = 0
  AND @uc08_assignment_id IS NOT NULL
  AND @uc08_group_2_id IS NOT NULL
  AND @uc08_student_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  submitted_by_id = @uc08_student_id,
  submission_status = 'LATE',
  submitted_at = DATE_SUB(CURRENT_TIMESTAMP(6), INTERVAL 1 HOUR),
  note = 'UC-08 late demo submission';

-- Active completed task: Group 1 reviews Group 2.
INSERT INTO peer_review_assignments (
  assignment_id,
  reviewer_group_id,
  reviewee_group_id,
  assigned_by_id,
  review_assignment_status,
  due_at
)
SELECT
  @uc08_assignment_id,
  @uc08_group_1_id,
  @uc08_group_2_id,
  @uc08_lecturer_id,
  'SUBMITTED',
  (SELECT review_deadline FROM assignments WHERE assignment_id = @uc08_assignment_id)
FROM DUAL
WHERE @uc08_cleanup_only = 0
  AND @uc08_assignment_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  assigned_by_id = @uc08_lecturer_id,
  review_assignment_status = 'SUBMITTED',
  due_at = (SELECT review_deadline FROM assignments WHERE assignment_id = @uc08_assignment_id);

-- Active incomplete task: Group 2 reviews Group 1.
INSERT INTO peer_review_assignments (
  assignment_id,
  reviewer_group_id,
  reviewee_group_id,
  assigned_by_id,
  review_assignment_status,
  due_at
)
SELECT
  @uc08_assignment_id,
  @uc08_group_2_id,
  @uc08_group_1_id,
  @uc08_lecturer_id,
  'IN_PROGRESS',
  (SELECT review_deadline FROM assignments WHERE assignment_id = @uc08_assignment_id)
FROM DUAL
WHERE @uc08_cleanup_only = 0
  AND @uc08_assignment_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  assigned_by_id = @uc08_lecturer_id,
  review_assignment_status = 'IN_PROGRESS',
  due_at = (SELECT review_deadline FROM assignments WHERE assignment_id = @uc08_assignment_id);

-- Cancelled incoming task for Group 3. It must be excluded, leaving Group 3
-- in the NO_RECEIVED_REVIEW filter and groupsWithNoReceivedReview statistic.
INSERT INTO peer_review_assignments (
  assignment_id,
  reviewer_group_id,
  reviewee_group_id,
  assigned_by_id,
  review_assignment_status,
  due_at
)
SELECT
  @uc08_assignment_id,
  @uc08_group_1_id,
  @uc08_group_3_id,
  @uc08_lecturer_id,
  'CANCELLED',
  (SELECT review_deadline FROM assignments WHERE assignment_id = @uc08_assignment_id)
FROM DUAL
WHERE @uc08_cleanup_only = 0
  AND @uc08_assignment_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  assigned_by_id = @uc08_lecturer_id,
  review_assignment_status = 'CANCELLED',
  due_at = (SELECT review_deadline FROM assignments WHERE assignment_id = @uc08_assignment_id);

SET @uc08_completed_task_id = (
  SELECT peer_review_assignment_id FROM peer_review_assignments
  WHERE assignment_id = @uc08_assignment_id
    AND reviewer_group_id = @uc08_group_1_id
    AND reviewee_group_id = @uc08_group_2_id
  LIMIT 1
);
SET @uc08_incomplete_task_id = (
  SELECT peer_review_assignment_id FROM peer_review_assignments
  WHERE assignment_id = @uc08_assignment_id
    AND reviewer_group_id = @uc08_group_2_id
    AND reviewee_group_id = @uc08_group_1_id
  LIMIT 1
);

INSERT INTO peer_reviews (
  peer_review_assignment_id,
  submitted_by_id,
  review_status,
  score,
  comment,
  submitted_at
)
SELECT
  @uc08_completed_task_id,
  @uc08_student_id,
  'SUBMITTED',
  82.50,
  'Complete UC-08 review evidence for monitoring.',
  DATE_SUB(CURRENT_TIMESTAMP(6), INTERVAL 30 MINUTE)
FROM DUAL
WHERE @uc08_cleanup_only = 0
  AND @uc08_completed_task_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  submitted_by_id = @uc08_student_id,
  review_status = 'SUBMITTED',
  score = 82.50,
  comment = 'Complete UC-08 review evidence for monitoring.',
  submitted_at = DATE_SUB(CURRENT_TIMESTAMP(6), INTERVAL 30 MINUTE);

INSERT INTO peer_reviews (
  peer_review_assignment_id,
  submitted_by_id,
  review_status,
  score,
  comment,
  submitted_at
)
SELECT
  @uc08_incomplete_task_id,
  @uc08_student_id,
  'DRAFT',
  NULL,
  'Draft UC-08 review evidence.',
  NULL
FROM DUAL
WHERE @uc08_cleanup_only = 0
  AND @uc08_incomplete_task_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  submitted_by_id = @uc08_student_id,
  review_status = 'DRAFT',
  score = NULL,
  comment = 'Draft UC-08 review evidence.',
  submitted_at = NULL;

-- Optional cleanup. It runs only when @uc08_cleanup_only = 1.
DELETE pr
FROM peer_reviews pr
JOIN peer_review_assignments pra
  ON pra.peer_review_assignment_id = pr.peer_review_assignment_id
WHERE @uc08_cleanup_only = 1
  AND pra.assignment_id = @uc08_assignment_id;

DELETE FROM peer_review_assignments
WHERE @uc08_cleanup_only = 1
  AND assignment_id = @uc08_assignment_id;

DELETE sa
FROM submission_attachments sa
JOIN assignment_submissions s
  ON s.assignment_submission_id = sa.assignment_submission_id
WHERE @uc08_cleanup_only = 1
  AND s.assignment_id = @uc08_assignment_id;

DELETE FROM assignment_submissions
WHERE @uc08_cleanup_only = 1
  AND assignment_id = @uc08_assignment_id;

DELETE FROM lesson_materials
WHERE @uc08_cleanup_only = 1
  AND (assignment_id = @uc08_assignment_id OR lesson_id = @uc08_lesson_id);

DELETE ra
FROM result_appeals ra
JOIN assignment_results ar ON ar.assignment_result_id = ra.assignment_result_id
WHERE @uc08_cleanup_only = 1
  AND ar.assignment_id = @uc08_assignment_id;

DELETE FROM assignment_results
WHERE @uc08_cleanup_only = 1
  AND assignment_id = @uc08_assignment_id;

DELETE FROM assignments
WHERE @uc08_cleanup_only = 1
  AND assignment_id = @uc08_assignment_id;

DELETE gm
FROM group_members gm
JOIN student_groups sg ON sg.group_id = gm.group_id
WHERE @uc08_cleanup_only = 1
  AND sg.course_id = @uc08_course_id;

DELETE FROM student_groups
WHERE @uc08_cleanup_only = 1
  AND course_id = @uc08_course_id;

DELETE FROM course_enrollments
WHERE @uc08_cleanup_only = 1
  AND course_id = @uc08_course_id;

DELETE FROM lessons
WHERE @uc08_cleanup_only = 1
  AND lesson_id = @uc08_lesson_id;

DELETE FROM courses
WHERE @uc08_cleanup_only = 1
  AND course_id = @uc08_course_id;

COMMIT;

-- Copy these IDs into Postman environment variables after a seed run.
SELECT
  CASE
    WHEN @uc08_lecturer_id IS NULL THEN 'ERROR: lecturer01 was not found'
    WHEN @uc08_student_id IS NULL THEN 'ERROR: student01 was not found'
    WHEN @uc08_cleanup_only = 1 THEN 'UC-08 demo data cleaned up'
    ELSE 'UC-08 demo data ready'
  END AS result,
  @uc08_course_id AS course_id,
  @uc08_assignment_id AS assignment_id,
  @uc08_group_1_id AS submitted_group_id,
  @uc08_group_2_id AS late_group_id,
  @uc08_group_3_id AS pending_group_id;

-- Expected dashboard statistics in seed mode:
-- totalGroups=3, submittedCount=2, pendingCount=1, lateCount=1
-- submissionCompletionRate=66.67
-- totalReviewAssignments=2, completedReviews=1, incompleteReviews=1
-- peerReviewCompletionRate=50.00
-- groupsWithNoReceivedReview=1
-- groupsWithIncompleteAssignedReviews=1

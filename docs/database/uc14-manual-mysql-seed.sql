-- Temporary UC-14 data for manual MySQL/Postman testing.
-- This is not a Flyway migration. Run it manually against the peergradehub database.
-- Default mode seeds or refreshes the data. Set this to 1 to run cleanup only.
SET @uc14_cleanup_only = 0;

START TRANSACTION;

SET @uc14_class_code = 'UC14-DEMO-01';
SET @uc14_invitation_code = 'UC14-DEMO-INVITE';
SET @uc14_course_name = 'UC14 Demo Course';
SET @uc14_lesson_title = 'UC14 Demo Lesson';
SET @uc14_assignment_title = 'UC14 Demo Assignment';

SET @uc14_lecturer_id = (
  SELECT id
  FROM app_users
  WHERE username = 'lecturer01'
    AND user_role = 'LECTURER'
  LIMIT 1
);

-- The INSERT is skipped when cleanup mode is enabled. If lecturer01 is missing,
-- no course is inserted and the final diagnostic SELECT reports that condition.
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
  @uc14_course_name,
  @uc14_class_code,
  @uc14_invitation_code,
  'UC14 DEMO',
  @uc14_lecturer_id,
  'Temporary course for UC-14 Assign Peer Review Postman testing.',
  DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 5 DAY),
  'ACTIVE'
FROM DUAL
WHERE @uc14_cleanup_only = 0
  AND @uc14_lecturer_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  course_name = @uc14_course_name,
  lecturer_id = @uc14_lecturer_id,
  description = 'Temporary course for UC-14 Assign Peer Review Postman testing.',
  group_formation_deadline = DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 5 DAY),
  course_status = 'ACTIVE';

SET @uc14_course_id = (
  SELECT course_id
  FROM courses
  WHERE class_code = @uc14_class_code
  LIMIT 1
);

INSERT INTO lessons (title, course_id)
SELECT @uc14_lesson_title, @uc14_course_id
FROM DUAL
WHERE @uc14_cleanup_only = 0
  AND @uc14_course_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM lessons
    WHERE course_id = @uc14_course_id
      AND title = @uc14_lesson_title
  );

SET @uc14_lesson_id = (
  SELECT lesson_id
  FROM lessons
  WHERE course_id = @uc14_course_id
    AND title = @uc14_lesson_title
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
  @uc14_assignment_title,
  'Temporary assignment for UC-14 Assign Peer Review Postman testing.',
  DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 7 DAY),
  DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 14 DAY),
  FALSE,
  @uc14_lesson_id
FROM DUAL
WHERE @uc14_cleanup_only = 0
  AND @uc14_lesson_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM assignments
    WHERE lesson_id = @uc14_lesson_id
      AND title = @uc14_assignment_title
  );

SET @uc14_assignment_id = (
  SELECT assignment_id
  FROM assignments
  WHERE lesson_id = @uc14_lesson_id
    AND title = @uc14_assignment_title
  ORDER BY assignment_id
  LIMIT 1
);

-- Refresh deadlines on every seed run so UC-14 create validation remains open.
UPDATE assignments
SET submission_deadline = DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 7 DAY),
    review_deadline = DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 14 DAY),
    updated_at = CURRENT_TIMESTAMP(6)
WHERE @uc14_cleanup_only = 0
  AND assignment_id = @uc14_assignment_id;

INSERT INTO student_groups (group_name, max_members, course_id, group_status)
SELECT 'UC14 Group 1', 5, @uc14_course_id, 'READY'
FROM DUAL
WHERE @uc14_cleanup_only = 0
  AND @uc14_course_id IS NOT NULL
ON DUPLICATE KEY UPDATE max_members = 5, group_status = 'READY';

INSERT INTO student_groups (group_name, max_members, course_id, group_status)
SELECT 'UC14 Group 2', 5, @uc14_course_id, 'READY'
FROM DUAL
WHERE @uc14_cleanup_only = 0
  AND @uc14_course_id IS NOT NULL
ON DUPLICATE KEY UPDATE max_members = 5, group_status = 'READY';

INSERT INTO student_groups (group_name, max_members, course_id, group_status)
SELECT 'UC14 Group 3', 5, @uc14_course_id, 'READY'
FROM DUAL
WHERE @uc14_cleanup_only = 0
  AND @uc14_course_id IS NOT NULL
ON DUPLICATE KEY UPDATE max_members = 5, group_status = 'READY';

SET @uc14_group_1_id = (
  SELECT group_id FROM student_groups
  WHERE course_id = @uc14_course_id AND group_name = 'UC14 Group 1'
  LIMIT 1
);
SET @uc14_group_2_id = (
  SELECT group_id FROM student_groups
  WHERE course_id = @uc14_course_id AND group_name = 'UC14 Group 2'
  LIMIT 1
);
SET @uc14_group_3_id = (
  SELECT group_id FROM student_groups
  WHERE course_id = @uc14_course_id AND group_name = 'UC14 Group 3'
  LIMIT 1
);

-- Optional cleanup. These statements only delete data when
-- @uc14_cleanup_only is changed to 1 at the top of this file.
DELETE pr
FROM peer_reviews pr
JOIN peer_review_assignments pra
  ON pra.peer_review_assignment_id = pr.peer_review_assignment_id
WHERE @uc14_cleanup_only = 1
  AND pra.assignment_id = @uc14_assignment_id;

DELETE FROM peer_review_assignments
WHERE @uc14_cleanup_only = 1
  AND assignment_id = @uc14_assignment_id;

DELETE sa
FROM submission_attachments sa
JOIN assignment_submissions s
  ON s.assignment_submission_id = sa.assignment_submission_id
WHERE @uc14_cleanup_only = 1
  AND s.assignment_id = @uc14_assignment_id;

DELETE ra
FROM result_appeals ra
JOIN assignment_results ar
  ON ar.assignment_result_id = ra.assignment_result_id
WHERE @uc14_cleanup_only = 1
  AND ar.assignment_id = @uc14_assignment_id;

DELETE FROM assignment_results
WHERE @uc14_cleanup_only = 1
  AND assignment_id = @uc14_assignment_id;

DELETE FROM assignment_submissions
WHERE @uc14_cleanup_only = 1
  AND assignment_id = @uc14_assignment_id;

DELETE FROM lesson_materials
WHERE @uc14_cleanup_only = 1
  AND (assignment_id = @uc14_assignment_id OR lesson_id = @uc14_lesson_id);

DELETE FROM assignments
WHERE @uc14_cleanup_only = 1
  AND assignment_id = @uc14_assignment_id;

DELETE gm
FROM group_members gm
JOIN student_groups sg ON sg.group_id = gm.group_id
WHERE @uc14_cleanup_only = 1
  AND sg.course_id = @uc14_course_id
  AND sg.group_name IN ('UC14 Group 1', 'UC14 Group 2', 'UC14 Group 3');

DELETE FROM student_groups
WHERE @uc14_cleanup_only = 1
  AND course_id = @uc14_course_id
  AND group_name IN ('UC14 Group 1', 'UC14 Group 2', 'UC14 Group 3');

DELETE FROM course_enrollments
WHERE @uc14_cleanup_only = 1
  AND course_id = @uc14_course_id;

DELETE FROM lessons
WHERE @uc14_cleanup_only = 1
  AND lesson_id = @uc14_lesson_id;

DELETE FROM courses
WHERE @uc14_cleanup_only = 1
  AND course_id = @uc14_course_id;

COMMIT;

-- Postman IDs. In seed mode these are the values to use in endpoint paths/bodies.
SELECT
  CASE
    WHEN @uc14_lecturer_id IS NULL THEN 'ERROR: lecturer01 with LECTURER role was not found'
    WHEN @uc14_cleanup_only = 1 THEN 'UC-14 demo data cleaned up'
    ELSE 'UC-14 demo data ready'
  END AS result,
  @uc14_course_id AS course_id,
  @uc14_lesson_id AS lesson_id,
  @uc14_assignment_id AS assignment_id,
  @uc14_group_1_id AS group_1_id,
  @uc14_group_2_id AS group_2_id,
  @uc14_group_3_id AS group_3_id;

-- Example POST body after replacing the variables with values printed above:
-- {
--   "reviewerGroupId": <group_1_id>,
--   "targetGroupId": <group_2_id>
-- }

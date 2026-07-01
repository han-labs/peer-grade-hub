-- -- Reproducible PeerGrade Hub demo data for the main OOSE use cases.
-- -- This migration is additive only. It does not delete, truncate, or mutate user/team data.
-- -- Fresh database route anchors:
-- --   UC-14 Assign Peer Review: assignment_id = 1
-- --   UC-08 Monitor Progress: course_id = 2, assignment_id = 2

-- -- ---------------------------------------------------------------------------
-- -- Demo users
-- -- ---------------------------------------------------------------------------
-- INSERT INTO app_users (username, email, password_hash, full_name, user_role, phone_number, status)
-- SELECT 'student02', 'student02@peergrade.test', '$2a$10$m2yKEWJs9ieIJBAL5s4c/uaIZRUCmFAY6Kmg.uopLwr5msYWlipPu', 'Demo Student Two', 'STUDENT', NULL, 'ACTIVE'
-- WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE username = 'student02');

-- INSERT INTO app_users (username, email, password_hash, full_name, user_role, phone_number, status)
-- SELECT 'student03', 'student03@peergrade.test', '$2a$10$m2yKEWJs9ieIJBAL5s4c/uaIZRUCmFAY6Kmg.uopLwr5msYWlipPu', 'Demo Student Three', 'STUDENT', NULL, 'ACTIVE'
-- WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE username = 'student03');

-- INSERT INTO app_users (username, email, password_hash, full_name, user_role, phone_number, status)
-- SELECT 'student04', 'student04@peergrade.test', '$2a$10$m2yKEWJs9ieIJBAL5s4c/uaIZRUCmFAY6Kmg.uopLwr5msYWlipPu', 'Demo Student Four', 'STUDENT', NULL, 'ACTIVE'
-- WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE username = 'student04');

-- INSERT INTO app_users (username, email, password_hash, full_name, user_role, phone_number, status)
-- SELECT 'student05', 'student05@peergrade.test', '$2a$10$m2yKEWJs9ieIJBAL5s4c/uaIZRUCmFAY6Kmg.uopLwr5msYWlipPu', 'Demo Student Five', 'STUDENT', NULL, 'ACTIVE'
-- WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE username = 'student05');

-- INSERT INTO app_users (username, email, password_hash, full_name, user_role, phone_number, status)
-- SELECT 'student06', 'student06@peergrade.test', '$2a$10$m2yKEWJs9ieIJBAL5s4c/uaIZRUCmFAY6Kmg.uopLwr5msYWlipPu', 'Demo Student Six', 'STUDENT', NULL, 'ACTIVE'
-- WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE username = 'student06');

-- INSERT INTO app_users (username, email, password_hash, full_name, user_role, phone_number, status)
-- SELECT 'lecturer02', 'lecturer02@peergrade.test', '$2a$10$L3fLaOL88K74duwUgszHa.UWPCPrbLp4UC9DL.g85/heqmbn7bQwq', 'Demo Lecturer Two', 'LECTURER', NULL, 'ACTIVE'
-- WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE username = 'lecturer02');

-- -- ---------------------------------------------------------------------------
-- -- Courses
-- -- ---------------------------------------------------------------------------
-- INSERT INTO courses (course_id, course_name, class_code, invitation_code, semester, lecturer_id, description, group_formation_deadline, course_status)
-- SELECT 1, 'UC14 Demo Course', 'UC14-DEMO-01', 'UC14DEMO', '2026A',
--        (SELECT id FROM app_users WHERE username = 'lecturer01'),
--        'Stable course for assigning peer review tasks.', '2030-07-01 23:59:00.000000', 'ACTIVE'
-- WHERE NOT EXISTS (SELECT 1 FROM courses WHERE class_code = 'UC14-DEMO-01')
--   AND NOT EXISTS (SELECT 1 FROM courses WHERE course_id = 1);

-- INSERT INTO courses (course_id, course_name, class_code, invitation_code, semester, lecturer_id, description, group_formation_deadline, course_status)
-- SELECT 2, 'Software Engineering A', 'SE101-2026-A', 'SE101A', '2026A',
--        (SELECT id FROM app_users WHERE username = 'lecturer01'),
--        'Main demo class with realistic submissions, peer reviews, and grading data.', '2030-07-03 23:59:00.000000', 'ACTIVE'
-- WHERE NOT EXISTS (SELECT 1 FROM courses WHERE class_code = 'SE101-2026-A')
--   AND NOT EXISTS (SELECT 1 FROM courses WHERE course_id = 2);

-- INSERT INTO courses (course_id, course_name, class_code, invitation_code, semester, lecturer_id, description, group_formation_deadline, course_status)
-- SELECT 3, 'Software Engineering B', 'SE101-2026-B', 'SE101B', '2026A',
--        (SELECT id FROM app_users WHERE username = 'lecturer01'),
--        'Second class for course and assignment management demonstrations.', '2030-07-05 23:59:00.000000', 'ACTIVE'
-- WHERE NOT EXISTS (SELECT 1 FROM courses WHERE class_code = 'SE101-2026-B')
--   AND NOT EXISTS (SELECT 1 FROM courses WHERE course_id = 3);

-- INSERT INTO courses (course_id, course_name, class_code, invitation_code, semester, lecturer_id, description, group_formation_deadline, course_status)
-- SELECT 4, 'Web Application Development', 'WEB202-2026-A', 'WEB202A', '2026A',
--        (SELECT id FROM app_users WHERE username = 'lecturer01'),
--        'Web project class for assignment and result demos.', '2030-07-08 23:59:00.000000', 'ACTIVE'
-- WHERE NOT EXISTS (SELECT 1 FROM courses WHERE class_code = 'WEB202-2026-A')
--   AND NOT EXISTS (SELECT 1 FROM courses WHERE course_id = 4);

-- INSERT INTO courses (course_id, course_name, class_code, invitation_code, semester, lecturer_id, description, group_formation_deadline, course_status)
-- SELECT 5, 'Database Systems', 'DB301-2026-A', 'DB301A', '2026A',
--        (SELECT id FROM app_users WHERE username = 'lecturer01'),
--        'Database class used to show a lecturer managing multiple courses.', '2030-07-10 23:59:00.000000', 'ACTIVE'
-- WHERE NOT EXISTS (SELECT 1 FROM courses WHERE class_code = 'DB301-2026-A')
--   AND NOT EXISTS (SELECT 1 FROM courses WHERE course_id = 5);

-- INSERT INTO courses (course_id, course_name, class_code, invitation_code, semester, lecturer_id, description, group_formation_deadline, course_status)
-- SELECT 6, 'Course Join Practice', 'JOIN-2026-A', 'JOIN2026A', '2026A',
--        (SELECT id FROM app_users WHERE username = 'lecturer01'),
--        'Open course for testing join-course and join-group flows.', '2030-07-12 23:59:00.000000', 'ACTIVE'
-- WHERE NOT EXISTS (SELECT 1 FROM courses WHERE class_code = 'JOIN-2026-A')
--   AND NOT EXISTS (SELECT 1 FROM courses WHERE course_id = 6);

-- INSERT INTO courses (course_id, course_name, class_code, invitation_code, semester, lecturer_id, description, group_formation_deadline, course_status)
-- SELECT 7, 'Software Engineering External', 'SE101-2026-X', 'SE101X', '2026A',
--        (SELECT id FROM app_users WHERE username = 'lecturer02'),
--        'Course owned by lecturer02 for ownership/forbidden checks.', '2030-07-15 23:59:00.000000', 'ACTIVE'
-- WHERE NOT EXISTS (SELECT 1 FROM courses WHERE class_code = 'SE101-2026-X')
--   AND NOT EXISTS (SELECT 1 FROM courses WHERE course_id = 7);

-- INSERT INTO courses (course_id, course_name, class_code, invitation_code, semester, lecturer_id, description, group_formation_deadline, course_status)
-- SELECT 8, 'Archived Software Engineering Lab', 'SE101-2025-OLD', 'SE101OLD', '2025B',
--        (SELECT id FROM app_users WHERE username = 'lecturer01'),
--        'Archived class for archive/reactivate course management demonstrations.', '2026-01-15 23:59:00.000000', 'ARCHIVED'
-- WHERE NOT EXISTS (SELECT 1 FROM courses WHERE class_code = 'SE101-2025-OLD')
--   AND NOT EXISTS (SELECT 1 FROM courses WHERE course_id = 8);

-- -- ---------------------------------------------------------------------------
-- -- Lessons
-- -- ---------------------------------------------------------------------------
-- INSERT INTO lessons (lesson_id, title, course_id)
-- SELECT 1, 'UC14 Peer Review Setup', (SELECT course_id FROM courses WHERE class_code = 'UC14-DEMO-01')
-- WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'UC14 Peer Review Setup' AND course_id = (SELECT course_id FROM courses WHERE class_code = 'UC14-DEMO-01'))
--   AND NOT EXISTS (SELECT 1 FROM lessons WHERE lesson_id = 1);

-- INSERT INTO lessons (lesson_id, title, course_id)
-- SELECT 2, 'SE101-A Team Project', COALESCE((SELECT course_id FROM courses WHERE class_code = 'SE101-2026-A'), 2)
-- WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'SE101-A Team Project' AND course_id = COALESCE((SELECT course_id FROM courses WHERE class_code = 'SE101-2026-A'), 2))
--   AND NOT EXISTS (SELECT 1 FROM lessons WHERE lesson_id = 2);

-- INSERT INTO lessons (lesson_id, title, course_id)
-- SELECT 3, 'SE101-B Architecture Review', (SELECT course_id FROM courses WHERE class_code = 'SE101-2026-B')
-- WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'SE101-B Architecture Review' AND course_id = (SELECT course_id FROM courses WHERE class_code = 'SE101-2026-B'))
--   AND NOT EXISTS (SELECT 1 FROM lessons WHERE lesson_id = 3);

-- INSERT INTO lessons (lesson_id, title, course_id)
-- SELECT 4, 'WEB202 Sprint Portfolio', (SELECT course_id FROM courses WHERE class_code = 'WEB202-2026-A')
-- WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'WEB202 Sprint Portfolio' AND course_id = (SELECT course_id FROM courses WHERE class_code = 'WEB202-2026-A'))
--   AND NOT EXISTS (SELECT 1 FROM lessons WHERE lesson_id = 4);

-- INSERT INTO lessons (lesson_id, title, course_id)
-- SELECT 5, 'DB301 Normalization Lab', (SELECT course_id FROM courses WHERE class_code = 'DB301-2026-A')
-- WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'DB301 Normalization Lab' AND course_id = (SELECT course_id FROM courses WHERE class_code = 'DB301-2026-A'))
--   AND NOT EXISTS (SELECT 1 FROM lessons WHERE lesson_id = 5);

-- INSERT INTO lessons (lesson_id, title, course_id)
-- SELECT 6, 'Join Practice Orientation', (SELECT course_id FROM courses WHERE class_code = 'JOIN-2026-A')
-- WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'Join Practice Orientation' AND course_id = (SELECT course_id FROM courses WHERE class_code = 'JOIN-2026-A'))
--   AND NOT EXISTS (SELECT 1 FROM lessons WHERE lesson_id = 6);

-- INSERT INTO lessons (lesson_id, title, course_id)
-- SELECT 7, 'Archived Lab Reference', (SELECT course_id FROM courses WHERE class_code = 'SE101-2025-OLD')
-- WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'Archived Lab Reference' AND course_id = (SELECT course_id FROM courses WHERE class_code = 'SE101-2025-OLD'))
--   AND NOT EXISTS (SELECT 1 FROM lessons WHERE lesson_id = 7);

-- -- ---------------------------------------------------------------------------
-- -- Assignments
-- -- ---------------------------------------------------------------------------
-- INSERT INTO assignments (assignment_id, title, description, submission_deadline, review_deadline, showcase_mode, lesson_id)
-- SELECT 1, 'UC14 Demo Assignment', 'Use this assignment to manually assign reviewer and target groups.', '2030-07-10 23:59:00.000000', '2030-07-17 23:59:00.000000', FALSE,
--        (SELECT lesson_id FROM lessons WHERE title = 'UC14 Peer Review Setup')
-- WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE title = 'UC14 Demo Assignment')
--   AND NOT EXISTS (SELECT 1 FROM assignments WHERE assignment_id = 1);

-- INSERT INTO assignments (assignment_id, title, description, submission_deadline, review_deadline, showcase_mode, lesson_id)
-- SELECT 2, 'SE101-A Progress Monitor Assignment', 'Main UC-08 assignment with mixed submission and peer review progress.', '2030-07-12 23:59:00.000000', '2030-07-19 23:59:00.000000', TRUE,
--        COALESCE((SELECT lesson_id FROM lessons WHERE title = 'SE101-A Team Project'), 2)
-- WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE title = 'SE101-A Progress Monitor Assignment')
--   AND NOT EXISTS (SELECT 1 FROM assignments WHERE assignment_id = 2);

-- INSERT INTO assignments (assignment_id, title, description, submission_deadline, review_deadline, showcase_mode, lesson_id)
-- SELECT 3, 'SE101-A Open Submission Assignment', 'Open assignment for groups that have not submitted yet.', '2030-08-01 23:59:00.000000', '2030-08-08 23:59:00.000000', FALSE,
--        COALESCE((SELECT lesson_id FROM lessons WHERE title = 'SE101-A Team Project'), 2)
-- WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE title = 'SE101-A Open Submission Assignment')
--   AND NOT EXISTS (SELECT 1 FROM assignments WHERE assignment_id = 3);

-- INSERT INTO assignments (assignment_id, title, description, submission_deadline, review_deadline, showcase_mode, lesson_id)
-- SELECT 4, 'SE101-B Design Critique', 'Nearly complete assignment for contrast with the main monitor scenario.', '2030-07-20 23:59:00.000000', '2030-07-27 23:59:00.000000', FALSE,
--        (SELECT lesson_id FROM lessons WHERE title = 'SE101-B Architecture Review')
-- WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE title = 'SE101-B Design Critique')
--   AND NOT EXISTS (SELECT 1 FROM assignments WHERE assignment_id = 4);

-- INSERT INTO assignments (assignment_id, title, description, submission_deadline, review_deadline, showcase_mode, lesson_id)
-- SELECT 5, 'WEB202 Portfolio Sprint', 'Web application sprint for assignment management demos.', '2030-08-05 23:59:00.000000', '2030-08-12 23:59:00.000000', TRUE,
--        (SELECT lesson_id FROM lessons WHERE title = 'WEB202 Sprint Portfolio')
-- WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE title = 'WEB202 Portfolio Sprint')
--   AND NOT EXISTS (SELECT 1 FROM assignments WHERE assignment_id = 5);

-- INSERT INTO assignments (assignment_id, title, description, submission_deadline, review_deadline, showcase_mode, lesson_id)
-- SELECT 6, 'DB301 Normalization Project', 'Database design assignment with published and unpublished grade results.', '2030-08-10 23:59:00.000000', '2030-08-17 23:59:00.000000', FALSE,
--        (SELECT lesson_id FROM lessons WHERE title = 'DB301 Normalization Lab')
-- WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE title = 'DB301 Normalization Project')
--   AND NOT EXISTS (SELECT 1 FROM assignments WHERE assignment_id = 6);

-- INSERT INTO assignments (assignment_id, title, description, submission_deadline, review_deadline, showcase_mode, lesson_id)
-- SELECT 7, 'Archived Lab Assignment', 'Closed assignment retained for archived course visibility.', '2026-01-20 23:59:00.000000', '2026-01-27 23:59:00.000000', FALSE,
--        (SELECT lesson_id FROM lessons WHERE title = 'Archived Lab Reference')
-- WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE title = 'Archived Lab Assignment')
--   AND NOT EXISTS (SELECT 1 FROM assignments WHERE assignment_id = 7);

-- -- ---------------------------------------------------------------------------
-- -- Student groups
-- -- ---------------------------------------------------------------------------
-- INSERT INTO student_groups (group_id, group_name, max_members, course_id, group_status)
-- SELECT 1, 'UC14 Group 1', 4, (SELECT course_id FROM courses WHERE class_code = 'UC14-DEMO-01'), 'READY'
-- WHERE NOT EXISTS (SELECT 1 FROM student_groups WHERE course_id = (SELECT course_id FROM courses WHERE class_code = 'UC14-DEMO-01') AND group_name = 'UC14 Group 1')
--   AND NOT EXISTS (SELECT 1 FROM student_groups WHERE group_id = 1);

-- INSERT INTO student_groups (group_id, group_name, max_members, course_id, group_status)
-- SELECT 2, 'UC14 Group 2', 4, (SELECT course_id FROM courses WHERE class_code = 'UC14-DEMO-01'), 'READY'
-- WHERE NOT EXISTS (SELECT 1 FROM student_groups WHERE course_id = (SELECT course_id FROM courses WHERE class_code = 'UC14-DEMO-01') AND group_name = 'UC14 Group 2')
--   AND NOT EXISTS (SELECT 1 FROM student_groups WHERE group_id = 2);

-- INSERT INTO student_groups (group_id, group_name, max_members, course_id, group_status)
-- SELECT 3, 'UC14 Group 3', 4, (SELECT course_id FROM courses WHERE class_code = 'UC14-DEMO-01'), 'FORMING'
-- WHERE NOT EXISTS (SELECT 1 FROM student_groups WHERE course_id = (SELECT course_id FROM courses WHERE class_code = 'UC14-DEMO-01') AND group_name = 'UC14 Group 3')
--   AND NOT EXISTS (SELECT 1 FROM student_groups WHERE group_id = 3);

-- INSERT INTO student_groups (group_id, group_name, max_members, course_id, group_status)
-- SELECT 4, 'UC08 Group 1 - Submitted', 4, COALESCE((SELECT course_id FROM courses WHERE class_code = 'SE101-2026-A'), 2), 'READY'
-- WHERE NOT EXISTS (SELECT 1 FROM student_groups WHERE course_id = COALESCE((SELECT course_id FROM courses WHERE class_code = 'SE101-2026-A'), 2) AND group_name = 'UC08 Group 1 - Submitted')
--   AND NOT EXISTS (SELECT 1 FROM student_groups WHERE group_id = 4);

-- INSERT INTO student_groups (group_id, group_name, max_members, course_id, group_status)
-- SELECT 5, 'UC08 Group 2 - Late', 4, COALESCE((SELECT course_id FROM courses WHERE class_code = 'SE101-2026-A'), 2), 'READY'
-- WHERE NOT EXISTS (SELECT 1 FROM student_groups WHERE course_id = COALESCE((SELECT course_id FROM courses WHERE class_code = 'SE101-2026-A'), 2) AND group_name = 'UC08 Group 2 - Late')
--   AND NOT EXISTS (SELECT 1 FROM student_groups WHERE group_id = 5);

-- INSERT INTO student_groups (group_id, group_name, max_members, course_id, group_status)
-- SELECT 6, 'UC08 Group 3 - Pending', 4, COALESCE((SELECT course_id FROM courses WHERE class_code = 'SE101-2026-A'), 2), 'FORMING'
-- WHERE NOT EXISTS (SELECT 1 FROM student_groups WHERE course_id = COALESCE((SELECT course_id FROM courses WHERE class_code = 'SE101-2026-A'), 2) AND group_name = 'UC08 Group 3 - Pending')
--   AND NOT EXISTS (SELECT 1 FROM student_groups WHERE group_id = 6);

-- INSERT INTO student_groups (group_id, group_name, max_members, course_id, group_status)
-- SELECT 7, 'UC08 Group 4 - Returned', 4, COALESCE((SELECT course_id FROM courses WHERE class_code = 'SE101-2026-A'), 2), 'READY'
-- WHERE NOT EXISTS (SELECT 1 FROM student_groups WHERE course_id = COALESCE((SELECT course_id FROM courses WHERE class_code = 'SE101-2026-A'), 2) AND group_name = 'UC08 Group 4 - Returned')
--   AND NOT EXISTS (SELECT 1 FROM student_groups WHERE group_id = 7);

-- INSERT INTO student_groups (group_id, group_name, max_members, course_id, group_status)
-- SELECT 8, 'UC08 Group 5 - Reviewed', 4, COALESCE((SELECT course_id FROM courses WHERE class_code = 'SE101-2026-A'), 2), 'READY'
-- WHERE NOT EXISTS (SELECT 1 FROM student_groups WHERE course_id = COALESCE((SELECT course_id FROM courses WHERE class_code = 'SE101-2026-A'), 2) AND group_name = 'UC08 Group 5 - Reviewed')
--   AND NOT EXISTS (SELECT 1 FROM student_groups WHERE group_id = 8);

-- INSERT INTO student_groups (group_id, group_name, max_members, course_id, group_status)
-- SELECT 9, 'UC08 Group 6 - Needs Review', 4, COALESCE((SELECT course_id FROM courses WHERE class_code = 'SE101-2026-A'), 2), 'LOCKED'
-- WHERE NOT EXISTS (SELECT 1 FROM student_groups WHERE course_id = COALESCE((SELECT course_id FROM courses WHERE class_code = 'SE101-2026-A'), 2) AND group_name = 'UC08 Group 6 - Needs Review')
--   AND NOT EXISTS (SELECT 1 FROM student_groups WHERE group_id = 9);

-- INSERT INTO student_groups (group_id, group_name, max_members, course_id, group_status)
-- SELECT 10, 'SE101-B Group Alpha', 4, (SELECT course_id FROM courses WHERE class_code = 'SE101-2026-B'), 'READY'
-- WHERE NOT EXISTS (SELECT 1 FROM student_groups WHERE course_id = (SELECT course_id FROM courses WHERE class_code = 'SE101-2026-B') AND group_name = 'SE101-B Group Alpha')
--   AND NOT EXISTS (SELECT 1 FROM student_groups WHERE group_id = 10);

-- INSERT INTO student_groups (group_id, group_name, max_members, course_id, group_status)
-- SELECT 11, 'SE101-B Group Beta', 4, (SELECT course_id FROM courses WHERE class_code = 'SE101-2026-B'), 'FORMING'
-- WHERE NOT EXISTS (SELECT 1 FROM student_groups WHERE course_id = (SELECT course_id FROM courses WHERE class_code = 'SE101-2026-B') AND group_name = 'SE101-B Group Beta')
--   AND NOT EXISTS (SELECT 1 FROM student_groups WHERE group_id = 11);

-- INSERT INTO student_groups (group_id, group_name, max_members, course_id, group_status)
-- SELECT 12, 'WEB202 Group Studio', 4, (SELECT course_id FROM courses WHERE class_code = 'WEB202-2026-A'), 'READY'
-- WHERE NOT EXISTS (SELECT 1 FROM student_groups WHERE course_id = (SELECT course_id FROM courses WHERE class_code = 'WEB202-2026-A') AND group_name = 'WEB202 Group Studio')
--   AND NOT EXISTS (SELECT 1 FROM student_groups WHERE group_id = 12);

-- INSERT INTO student_groups (group_id, group_name, max_members, course_id, group_status)
-- SELECT 13, 'DB301 Group Query', 4, (SELECT course_id FROM courses WHERE class_code = 'DB301-2026-A'), 'READY'
-- WHERE NOT EXISTS (SELECT 1 FROM student_groups WHERE course_id = (SELECT course_id FROM courses WHERE class_code = 'DB301-2026-A') AND group_name = 'DB301 Group Query')
--   AND NOT EXISTS (SELECT 1 FROM student_groups WHERE group_id = 13);

-- INSERT INTO student_groups (group_id, group_name, max_members, course_id, group_status)
-- SELECT 14, 'Join Open Group', 4, (SELECT course_id FROM courses WHERE class_code = 'JOIN-2026-A'), 'FORMING'
-- WHERE NOT EXISTS (SELECT 1 FROM student_groups WHERE course_id = (SELECT course_id FROM courses WHERE class_code = 'JOIN-2026-A') AND group_name = 'Join Open Group')
--   AND NOT EXISTS (SELECT 1 FROM student_groups WHERE group_id = 14);

-- INSERT INTO student_groups (group_id, group_name, max_members, course_id, group_status)
-- SELECT 15, 'Join Full Group', 2, (SELECT course_id FROM courses WHERE class_code = 'JOIN-2026-A'), 'READY'
-- WHERE NOT EXISTS (SELECT 1 FROM student_groups WHERE course_id = (SELECT course_id FROM courses WHERE class_code = 'JOIN-2026-A') AND group_name = 'Join Full Group')
--   AND NOT EXISTS (SELECT 1 FROM student_groups WHERE group_id = 15);

-- INSERT INTO student_groups (group_id, group_name, max_members, course_id, group_status)
-- SELECT 16, 'Join Locked Group', 4, (SELECT course_id FROM courses WHERE class_code = 'JOIN-2026-A'), 'LOCKED'
-- WHERE NOT EXISTS (SELECT 1 FROM student_groups WHERE course_id = (SELECT course_id FROM courses WHERE class_code = 'JOIN-2026-A') AND group_name = 'Join Locked Group')
--   AND NOT EXISTS (SELECT 1 FROM student_groups WHERE group_id = 16);

-- -- ---------------------------------------------------------------------------
-- -- Course enrollments and group members
-- -- ---------------------------------------------------------------------------
-- INSERT INTO course_enrollments (course_id, student_id)
-- SELECT COALESCE((SELECT course_id FROM courses WHERE class_code = 'SE101-2026-A'), 2), id FROM app_users
-- WHERE username IN ('student01', 'student02', 'student03', 'student04', 'student05', 'student06')
--   AND NOT EXISTS (
--     SELECT 1 FROM course_enrollments
--     WHERE course_id = COALESCE((SELECT course_id FROM courses WHERE class_code = 'SE101-2026-A'), 2)
--       AND student_id = app_users.id
--   );

-- INSERT INTO course_enrollments (course_id, student_id)
-- SELECT (SELECT course_id FROM courses WHERE class_code = 'UC14-DEMO-01'), id FROM app_users
-- WHERE username IN ('student01', 'student02', 'student03')
--   AND NOT EXISTS (
--     SELECT 1 FROM course_enrollments
--     WHERE course_id = (SELECT course_id FROM courses WHERE class_code = 'UC14-DEMO-01')
--       AND student_id = app_users.id
--   );

-- INSERT INTO course_enrollments (course_id, student_id)
-- SELECT (SELECT course_id FROM courses WHERE class_code = 'SE101-2026-B'), id FROM app_users
-- WHERE username IN ('student04', 'student05')
--   AND NOT EXISTS (
--     SELECT 1 FROM course_enrollments
--     WHERE course_id = (SELECT course_id FROM courses WHERE class_code = 'SE101-2026-B')
--       AND student_id = app_users.id
--   );

-- INSERT INTO course_enrollments (course_id, student_id)
-- SELECT (SELECT course_id FROM courses WHERE class_code = 'WEB202-2026-A'), id FROM app_users
-- WHERE username IN ('student05', 'student06')
--   AND NOT EXISTS (
--     SELECT 1 FROM course_enrollments
--     WHERE course_id = (SELECT course_id FROM courses WHERE class_code = 'WEB202-2026-A')
--       AND student_id = app_users.id
--   );

-- INSERT INTO course_enrollments (course_id, student_id)
-- SELECT (SELECT course_id FROM courses WHERE class_code = 'DB301-2026-A'), id FROM app_users
-- WHERE username IN ('student02', 'student06')
--   AND NOT EXISTS (
--     SELECT 1 FROM course_enrollments
--     WHERE course_id = (SELECT course_id FROM courses WHERE class_code = 'DB301-2026-A')
--       AND student_id = app_users.id
--   );

-- INSERT INTO course_enrollments (course_id, student_id)
-- SELECT (SELECT course_id FROM courses WHERE class_code = 'JOIN-2026-A'), id FROM app_users
-- WHERE username IN ('student02', 'student03', 'student04', 'student05', 'student06')
--   AND NOT EXISTS (
--     SELECT 1 FROM course_enrollments
--     WHERE course_id = (SELECT course_id FROM courses WHERE class_code = 'JOIN-2026-A')
--       AND student_id = app_users.id
--   );

-- INSERT INTO group_members (group_id, user_id)
-- SELECT group_id, user_id
-- FROM (
--   SELECT 1 AS group_id, (SELECT id FROM app_users WHERE username = 'student01') AS user_id
--   UNION ALL SELECT 2, (SELECT id FROM app_users WHERE username = 'student02')
--   UNION ALL SELECT 3, (SELECT id FROM app_users WHERE username = 'student03')
--   UNION ALL SELECT 4, (SELECT id FROM app_users WHERE username = 'student01')
--   UNION ALL SELECT 4, (SELECT id FROM app_users WHERE username = 'student02')
--   UNION ALL SELECT 5, (SELECT id FROM app_users WHERE username = 'student03')
--   UNION ALL SELECT 6, (SELECT id FROM app_users WHERE username = 'student04')
--   UNION ALL SELECT 7, (SELECT id FROM app_users WHERE username = 'student05')
--   UNION ALL SELECT 8, (SELECT id FROM app_users WHERE username = 'student06')
--   UNION ALL SELECT 10, (SELECT id FROM app_users WHERE username = 'student04')
--   UNION ALL SELECT 11, (SELECT id FROM app_users WHERE username = 'student05')
--   UNION ALL SELECT 12, (SELECT id FROM app_users WHERE username = 'student06')
--   UNION ALL SELECT 13, (SELECT id FROM app_users WHERE username = 'student02')
--   UNION ALL SELECT 15, (SELECT id FROM app_users WHERE username = 'student02')
--   UNION ALL SELECT 15, (SELECT id FROM app_users WHERE username = 'student03')
--   UNION ALL SELECT 16, (SELECT id FROM app_users WHERE username = 'student04')
-- ) seed_members
-- WHERE NOT EXISTS (
--   SELECT 1 FROM group_members
--   WHERE group_id = seed_members.group_id
--     AND user_id = seed_members.user_id
-- );

-- -- ---------------------------------------------------------------------------
-- -- Lesson and assignment materials
-- -- ---------------------------------------------------------------------------
-- INSERT INTO lesson_materials (title, material_type, lesson_id, assignment_id, url, label)
-- SELECT 'SE101-A Project Brief', 'LINK', NULL, 2, 'https://peergrade.test/demo/se101-a-project-brief', 'Project brief'
-- WHERE NOT EXISTS (SELECT 1 FROM lesson_materials WHERE title = 'SE101-A Project Brief');

-- INSERT INTO lesson_materials (title, material_type, lesson_id, assignment_id, url, label)
-- SELECT 'UC14 Review Rubric', 'LINK', NULL, 1, 'https://peergrade.test/demo/uc14-review-rubric', 'Review rubric'
-- WHERE NOT EXISTS (SELECT 1 FROM lesson_materials WHERE title = 'UC14 Review Rubric');

-- -- ---------------------------------------------------------------------------
-- -- Assignment submissions and attachments
-- -- ---------------------------------------------------------------------------
-- INSERT INTO assignment_submissions (assignment_id, group_id, submitted_by_id, submission_status, submitted_at, note)
-- SELECT 2, 4, (SELECT id FROM app_users WHERE username = 'student01'), 'SUBMITTED', '2030-07-10 20:15:00.000000', 'Final package submitted on time.'
-- WHERE NOT EXISTS (SELECT 1 FROM assignment_submissions WHERE assignment_id = 2 AND group_id = 4);

-- INSERT INTO assignment_submissions (assignment_id, group_id, submitted_by_id, submission_status, submitted_at, note)
-- SELECT 2, 5, (SELECT id FROM app_users WHERE username = 'student03'), 'LATE', '2030-07-13 09:30:00.000000', 'Submitted after the deadline due to integration delay.'
-- WHERE NOT EXISTS (SELECT 1 FROM assignment_submissions WHERE assignment_id = 2 AND group_id = 5);

-- INSERT INTO assignment_submissions (assignment_id, group_id, submitted_by_id, submission_status, submitted_at, note)
-- SELECT 2, 7, (SELECT id FROM app_users WHERE username = 'student05'), 'RETURNED', '2030-07-11 18:10:00.000000', 'Returned for missing peer evidence.'
-- WHERE NOT EXISTS (SELECT 1 FROM assignment_submissions WHERE assignment_id = 2 AND group_id = 7);

-- INSERT INTO assignment_submissions (assignment_id, group_id, submitted_by_id, submission_status, submitted_at, note)
-- SELECT 2, 8, (SELECT id FROM app_users WHERE username = 'student06'), 'SUBMITTED', '2030-07-09 21:00:00.000000', 'Complete submission with implementation notes.'
-- WHERE NOT EXISTS (SELECT 1 FROM assignment_submissions WHERE assignment_id = 2 AND group_id = 8);

-- INSERT INTO assignment_submissions (assignment_id, group_id, submitted_by_id, submission_status, submitted_at, note)
-- SELECT 2, 9, NULL, 'DRAFT', NULL, 'Draft created but not submitted.'
-- WHERE NOT EXISTS (SELECT 1 FROM assignment_submissions WHERE assignment_id = 2 AND group_id = 9);

-- INSERT INTO assignment_submissions (assignment_id, group_id, submitted_by_id, submission_status, submitted_at, note)
-- SELECT 4, 10, (SELECT id FROM app_users WHERE username = 'student04'), 'SUBMITTED', '2030-07-19 10:00:00.000000', 'Nearly complete course assignment submission.'
-- WHERE NOT EXISTS (SELECT 1 FROM assignment_submissions WHERE assignment_id = 4 AND group_id = 10);

-- INSERT INTO assignment_submissions (assignment_id, group_id, submitted_by_id, submission_status, submitted_at, note)
-- SELECT 5, 12, (SELECT id FROM app_users WHERE username = 'student06'), 'SUBMITTED', '2030-08-03 22:20:00.000000', 'Web sprint portfolio submission.'
-- WHERE NOT EXISTS (SELECT 1 FROM assignment_submissions WHERE assignment_id = 5 AND group_id = 12);

-- INSERT INTO submission_attachments (assignment_submission_id, attachment_type, title, url, label)
-- SELECT assignment_submission_id, 'LINK', 'Repository Link', 'https://peergrade.test/demo/se101-a-group1-repo', 'Repository'
-- FROM assignment_submissions
-- WHERE assignment_id = 2 AND group_id = 4
--   AND NOT EXISTS (SELECT 1 FROM submission_attachments WHERE title = 'Repository Link' AND url = 'https://peergrade.test/demo/se101-a-group1-repo');

-- INSERT INTO submission_attachments (assignment_submission_id, attachment_type, title, url, label)
-- SELECT assignment_submission_id, 'LINK', 'Late Submission Evidence', 'https://peergrade.test/demo/se101-a-group2-late', 'Submission evidence'
-- FROM assignment_submissions
-- WHERE assignment_id = 2 AND group_id = 5
--   AND NOT EXISTS (SELECT 1 FROM submission_attachments WHERE title = 'Late Submission Evidence');

-- -- ---------------------------------------------------------------------------
-- -- Peer review assignments and reviews
-- -- ---------------------------------------------------------------------------
-- INSERT INTO peer_review_assignments (assignment_id, reviewer_group_id, reviewee_group_id, assigned_by_id, review_assignment_status, assigned_at, due_at)
-- SELECT 2, 4, 5, (SELECT id FROM app_users WHERE username = 'lecturer01'), 'SUBMITTED', '2030-07-13 08:00:00.000000', '2030-07-19 23:59:00.000000'
-- WHERE NOT EXISTS (SELECT 1 FROM peer_review_assignments WHERE assignment_id = 2 AND reviewer_group_id = 4 AND reviewee_group_id = 5);

-- INSERT INTO peer_review_assignments (assignment_id, reviewer_group_id, reviewee_group_id, assigned_by_id, review_assignment_status, assigned_at, due_at)
-- SELECT 2, 5, 4, (SELECT id FROM app_users WHERE username = 'lecturer01'), 'ASSIGNED', '2030-07-13 08:05:00.000000', '2030-07-19 23:59:00.000000'
-- WHERE NOT EXISTS (SELECT 1 FROM peer_review_assignments WHERE assignment_id = 2 AND reviewer_group_id = 5 AND reviewee_group_id = 4);

-- INSERT INTO peer_review_assignments (assignment_id, reviewer_group_id, reviewee_group_id, assigned_by_id, review_assignment_status, assigned_at, due_at)
-- SELECT 2, 7, 8, (SELECT id FROM app_users WHERE username = 'lecturer01'), 'ASSIGNED', '2030-07-13 08:10:00.000000', '2030-07-19 23:59:00.000000'
-- WHERE NOT EXISTS (SELECT 1 FROM peer_review_assignments WHERE assignment_id = 2 AND reviewer_group_id = 7 AND reviewee_group_id = 8);

-- INSERT INTO peer_review_assignments (assignment_id, reviewer_group_id, reviewee_group_id, assigned_by_id, review_assignment_status, assigned_at, due_at)
-- SELECT 2, 8, 7, (SELECT id FROM app_users WHERE username = 'lecturer01'), 'SUBMITTED', '2030-07-13 08:15:00.000000', '2030-07-19 23:59:00.000000'
-- WHERE NOT EXISTS (SELECT 1 FROM peer_review_assignments WHERE assignment_id = 2 AND reviewer_group_id = 8 AND reviewee_group_id = 7);

-- INSERT INTO peer_review_assignments (assignment_id, reviewer_group_id, reviewee_group_id, assigned_by_id, review_assignment_status, assigned_at, due_at)
-- SELECT 2, 9, 4, (SELECT id FROM app_users WHERE username = 'lecturer01'), 'ASSIGNED', '2030-07-13 08:20:00.000000', '2030-07-19 23:59:00.000000'
-- WHERE NOT EXISTS (SELECT 1 FROM peer_review_assignments WHERE assignment_id = 2 AND reviewer_group_id = 9 AND reviewee_group_id = 4);

-- INSERT INTO peer_review_assignments (assignment_id, reviewer_group_id, reviewee_group_id, assigned_by_id, review_assignment_status, assigned_at, due_at)
-- SELECT 2, 4, 6, (SELECT id FROM app_users WHERE username = 'lecturer01'), 'CANCELLED', '2030-07-13 08:25:00.000000', '2030-07-19 23:59:00.000000'
-- WHERE NOT EXISTS (SELECT 1 FROM peer_review_assignments WHERE assignment_id = 2 AND reviewer_group_id = 4 AND reviewee_group_id = 6);

-- INSERT INTO peer_reviews (peer_review_assignment_id, submitted_by_id, review_status, score, comment, submitted_at)
-- SELECT (SELECT peer_review_assignment_id FROM peer_review_assignments WHERE assignment_id = 2 AND reviewer_group_id = 4 AND reviewee_group_id = 5),
--        (SELECT id FROM app_users WHERE username = 'student01'), 'SUBMITTED', 88.00, 'Solid work with clear teamwork evidence.', '2030-07-16 19:30:00.000000'
-- WHERE EXISTS (SELECT 1 FROM peer_review_assignments WHERE assignment_id = 2 AND reviewer_group_id = 4 AND reviewee_group_id = 5)
--   AND NOT EXISTS (
--     SELECT 1 FROM peer_reviews
--     WHERE peer_review_assignment_id = (SELECT peer_review_assignment_id FROM peer_review_assignments WHERE assignment_id = 2 AND reviewer_group_id = 4 AND reviewee_group_id = 5)
--   );

-- INSERT INTO peer_reviews (peer_review_assignment_id, submitted_by_id, review_status, score, comment, submitted_at)
-- SELECT (SELECT peer_review_assignment_id FROM peer_review_assignments WHERE assignment_id = 2 AND reviewer_group_id = 5 AND reviewee_group_id = 4),
--        (SELECT id FROM app_users WHERE username = 'student03'), 'DRAFT', NULL, 'Draft review started but not submitted.', NULL
-- WHERE EXISTS (SELECT 1 FROM peer_review_assignments WHERE assignment_id = 2 AND reviewer_group_id = 5 AND reviewee_group_id = 4)
--   AND NOT EXISTS (
--     SELECT 1 FROM peer_reviews
--     WHERE peer_review_assignment_id = (SELECT peer_review_assignment_id FROM peer_review_assignments WHERE assignment_id = 2 AND reviewer_group_id = 5 AND reviewee_group_id = 4)
--   );

-- INSERT INTO peer_reviews (peer_review_assignment_id, submitted_by_id, review_status, score, comment, submitted_at)
-- SELECT (SELECT peer_review_assignment_id FROM peer_review_assignments WHERE assignment_id = 2 AND reviewer_group_id = 8 AND reviewee_group_id = 7),
--        (SELECT id FROM app_users WHERE username = 'student06'), 'SUBMITTED', 82.50, 'Clear analysis with useful supporting evidence.', '2030-07-16 20:10:00.000000'
-- WHERE EXISTS (SELECT 1 FROM peer_review_assignments WHERE assignment_id = 2 AND reviewer_group_id = 8 AND reviewee_group_id = 7)
--   AND NOT EXISTS (
--     SELECT 1 FROM peer_reviews
--     WHERE peer_review_assignment_id = (SELECT peer_review_assignment_id FROM peer_review_assignments WHERE assignment_id = 2 AND reviewer_group_id = 8 AND reviewee_group_id = 7)
--   );

-- -- ---------------------------------------------------------------------------
-- -- Final grade and published result data
-- -- ---------------------------------------------------------------------------
-- INSERT INTO assignment_results (assignment_id, group_id, final_comment, score, is_published, published_at, published_by_id, graded_by_id, graded_at)
-- SELECT 2, 4, 'Strong delivery and peer review participation.', 91.50, TRUE, '2030-07-22 09:00:00.000000',
--        (SELECT id FROM app_users WHERE username = 'lecturer01'),
--        (SELECT id FROM app_users WHERE username = 'lecturer01'),
--        '2030-07-21 18:30:00.000000'
-- WHERE NOT EXISTS (SELECT 1 FROM assignment_results WHERE assignment_id = 2 AND group_id = 4);

-- INSERT INTO assignment_results (assignment_id, group_id, final_comment, score, is_published, graded_by_id, graded_at)
-- SELECT 2, 5, 'Late submission; review quality still under evaluation.', 78.00, FALSE,
--        (SELECT id FROM app_users WHERE username = 'lecturer01'),
--        '2030-07-21 18:45:00.000000'
-- WHERE NOT EXISTS (SELECT 1 FROM assignment_results WHERE assignment_id = 2 AND group_id = 5);

-- INSERT INTO assignment_results (assignment_id, group_id, final_comment, score, is_published, published_at, published_by_id, graded_by_id, graded_at)
-- SELECT 5, 12, 'Published showcase-ready web portfolio result.', 89.00, TRUE, '2030-08-15 10:00:00.000000',
--        (SELECT id FROM app_users WHERE username = 'lecturer01'),
--        (SELECT id FROM app_users WHERE username = 'lecturer01'),
--        '2030-08-14 17:30:00.000000'
-- WHERE NOT EXISTS (SELECT 1 FROM assignment_results WHERE assignment_id = 5 AND group_id = 12);

-- INSERT INTO result_appeals (student_id, content, assignment_result_id, appeal_status)
-- SELECT (SELECT id FROM app_users WHERE username = 'student03'),
--        'Please review the late penalty evidence attached by our group.',
--        (SELECT assignment_result_id FROM assignment_results WHERE assignment_id = 2 AND group_id = 5),
--        'PENDING'
-- WHERE EXISTS (SELECT 1 FROM assignment_results WHERE assignment_id = 2 AND group_id = 5)
--   AND NOT EXISTS (
--     SELECT 1 FROM result_appeals
--     WHERE assignment_result_id = (SELECT assignment_result_id FROM assignment_results WHERE assignment_id = 2 AND group_id = 5)
--   );

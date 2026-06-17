-- PeerGrade Hub foundation schema for MySQL 8.0.
-- Phase 2B uses an early-phase reset strategy, so V1 is intentionally rewritten.

CREATE TABLE IF NOT EXISTS app_users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(30) NOT NULL,
  phone_number VARCHAR(30),
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  CONSTRAINT uk_app_users_username UNIQUE (username),
  CONSTRAINT uk_app_users_email UNIQUE (email),
  CONSTRAINT chk_app_users_role CHECK (user_role IN ('STUDENT', 'LECTURER', 'ADMINISTRATOR')),
  CONSTRAINT chk_app_users_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS courses (
  course_id BIGINT NOT NULL AUTO_INCREMENT,
  course_name VARCHAR(255) NOT NULL,
  class_code VARCHAR(50) NOT NULL,
  invitation_code VARCHAR(50),
  semester VARCHAR(50) NOT NULL,
  lecturer_id BIGINT NOT NULL,
  description TEXT,
  group_formation_deadline DATETIME(6),
  course_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (course_id),
  CONSTRAINT uk_courses_class_code UNIQUE (class_code),
  CONSTRAINT uk_courses_invitation_code UNIQUE (invitation_code),
  CONSTRAINT fk_courses_lecturer FOREIGN KEY (lecturer_id) REFERENCES app_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_courses_status CHECK (course_status IN ('ACTIVE', 'ARCHIVED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS course_enrollments (
  course_enrollment_id BIGINT NOT NULL AUTO_INCREMENT,
  course_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  enrolled_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (course_enrollment_id),
  CONSTRAINT uk_course_enrollments_course_student UNIQUE (course_id, student_id),
  CONSTRAINT fk_course_enrollments_course FOREIGN KEY (course_id) REFERENCES courses (course_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_course_enrollments_student FOREIGN KEY (student_id) REFERENCES app_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS student_groups (
  group_id BIGINT NOT NULL AUTO_INCREMENT,
  group_name VARCHAR(100) NOT NULL,
  max_members INT NOT NULL,
  course_id BIGINT NOT NULL,
  group_status VARCHAR(30) NOT NULL DEFAULT 'FORMING',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (group_id),
  CONSTRAINT uk_student_groups_course_name UNIQUE (course_id, group_name),
  CONSTRAINT fk_student_groups_course FOREIGN KEY (course_id) REFERENCES courses (course_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_student_groups_status CHECK (group_status IN ('FORMING', 'LOCKED', 'READY')),
  CONSTRAINT chk_student_groups_max_members CHECK (max_members > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS group_members (
  group_member_id BIGINT NOT NULL AUTO_INCREMENT,
  group_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  joined_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (group_member_id),
  CONSTRAINT uk_group_members_group_user UNIQUE (group_id, user_id),
  CONSTRAINT fk_group_members_group FOREIGN KEY (group_id) REFERENCES student_groups (group_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_group_members_user FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lessons (
  lesson_id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  course_id BIGINT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (lesson_id),
  CONSTRAINT fk_lessons_course FOREIGN KEY (course_id) REFERENCES courses (course_id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignments (
  assignment_id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  submission_deadline DATETIME(6) NOT NULL,
  review_deadline DATETIME(6) NOT NULL,
  showcase_mode BOOLEAN NOT NULL DEFAULT FALSE,
  lesson_id BIGINT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (assignment_id),
  CONSTRAINT fk_assignments_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (lesson_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_assignments_dates CHECK (review_deadline > submission_deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lesson_materials (
  material_id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  material_type VARCHAR(30) NOT NULL,
  lesson_id BIGINT,
  assignment_id BIGINT,
  file_name VARCHAR(255),
  file_path TEXT,
  file_size_mb DOUBLE,
  file_type VARCHAR(100),
  url TEXT,
  label VARCHAR(255),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (material_id),
  CONSTRAINT fk_lesson_materials_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (lesson_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_lesson_materials_assignment FOREIGN KEY (assignment_id) REFERENCES assignments (assignment_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_lesson_materials_type CHECK (material_type IN ('FILE', 'LINK')),
  CONSTRAINT chk_lesson_materials_owner CHECK (
    (lesson_id IS NOT NULL AND assignment_id IS NULL)
    OR
    (lesson_id IS NULL AND assignment_id IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignment_submissions (
  assignment_submission_id BIGINT NOT NULL AUTO_INCREMENT,
  assignment_id BIGINT NOT NULL,
  group_id BIGINT NOT NULL,
  submitted_by_id BIGINT,
  submission_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  submitted_at DATETIME(6),
  note TEXT,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (assignment_submission_id),
  CONSTRAINT uk_assignment_submissions_assignment_group UNIQUE (assignment_id, group_id),
  CONSTRAINT fk_assignment_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES assignments (assignment_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_assignment_submissions_group FOREIGN KEY (group_id) REFERENCES student_groups (group_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_assignment_submissions_submitted_by FOREIGN KEY (submitted_by_id) REFERENCES app_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_assignment_submissions_status CHECK (submission_status IN ('DRAFT', 'SUBMITTED', 'LATE', 'RETURNED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS submission_attachments (
  submission_attachment_id BIGINT NOT NULL AUTO_INCREMENT,
  assignment_submission_id BIGINT NOT NULL,
  attachment_type VARCHAR(30) NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_name VARCHAR(255),
  file_path TEXT,
  file_size_mb DOUBLE,
  file_type VARCHAR(100),
  url TEXT,
  label VARCHAR(255),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (submission_attachment_id),
  CONSTRAINT fk_submission_attachments_submission FOREIGN KEY (assignment_submission_id) REFERENCES assignment_submissions (assignment_submission_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_submission_attachments_type CHECK (attachment_type IN ('FILE', 'LINK')),
  CONSTRAINT chk_submission_attachments_payload CHECK (
    (attachment_type = 'FILE' AND file_path IS NOT NULL AND url IS NULL)
    OR
    (attachment_type = 'LINK' AND url IS NOT NULL AND file_path IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS peer_review_assignments (
  peer_review_assignment_id BIGINT NOT NULL AUTO_INCREMENT,
  assignment_id BIGINT NOT NULL,
  reviewer_group_id BIGINT NOT NULL,
  reviewee_group_id BIGINT NOT NULL,
  assigned_by_id BIGINT,
  review_assignment_status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED',
  assigned_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  due_at DATETIME(6),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (peer_review_assignment_id),
  CONSTRAINT uk_peer_review_assignments_pair UNIQUE (assignment_id, reviewer_group_id, reviewee_group_id),
  CONSTRAINT fk_peer_review_assignments_assignment FOREIGN KEY (assignment_id) REFERENCES assignments (assignment_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_peer_review_assignments_reviewer_group FOREIGN KEY (reviewer_group_id) REFERENCES student_groups (group_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_peer_review_assignments_reviewee_group FOREIGN KEY (reviewee_group_id) REFERENCES student_groups (group_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_peer_review_assignments_assigned_by FOREIGN KEY (assigned_by_id) REFERENCES app_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_peer_review_assignments_status CHECK (review_assignment_status IN ('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'CANCELLED')),
  CONSTRAINT chk_peer_review_assignments_groups CHECK (reviewer_group_id <> reviewee_group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS peer_reviews (
  peer_review_id BIGINT NOT NULL AUTO_INCREMENT,
  peer_review_assignment_id BIGINT NOT NULL,
  submitted_by_id BIGINT,
  review_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  score DECIMAL(5, 2),
  comment TEXT,
  submitted_at DATETIME(6),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (peer_review_id),
  CONSTRAINT uk_peer_reviews_assignment UNIQUE (peer_review_assignment_id),
  CONSTRAINT fk_peer_reviews_assignment FOREIGN KEY (peer_review_assignment_id) REFERENCES peer_review_assignments (peer_review_assignment_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_peer_reviews_submitted_by FOREIGN KEY (submitted_by_id) REFERENCES app_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_peer_reviews_status CHECK (review_status IN ('DRAFT', 'SUBMITTED', 'RETURNED')),
  CONSTRAINT chk_peer_reviews_score CHECK (score IS NULL OR (score >= 0 AND score <= 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignment_results (
  assignment_result_id BIGINT NOT NULL AUTO_INCREMENT,
  assignment_id BIGINT NOT NULL,
  group_id BIGINT NOT NULL,
  final_comment TEXT,
  score DECIMAL(5, 2) NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at DATETIME(6),
  published_by_id BIGINT,
  graded_by_id BIGINT,
  graded_at DATETIME(6),
  unpublished_at DATETIME(6),
  unpublished_by_id BIGINT,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (assignment_result_id),
  CONSTRAINT uk_assignment_results_assignment_group UNIQUE (assignment_id, group_id),
  CONSTRAINT fk_assignment_results_assignment FOREIGN KEY (assignment_id) REFERENCES assignments (assignment_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_assignment_results_group FOREIGN KEY (group_id) REFERENCES student_groups (group_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_assignment_results_published_by FOREIGN KEY (published_by_id) REFERENCES app_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_assignment_results_graded_by FOREIGN KEY (graded_by_id) REFERENCES app_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_assignment_results_unpublished_by FOREIGN KEY (unpublished_by_id) REFERENCES app_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_assignment_results_score CHECK (score >= 0 AND score <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS result_appeals (
  appeal_id BIGINT NOT NULL AUTO_INCREMENT,
  student_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  assignment_result_id BIGINT NOT NULL,
  appeal_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  resolution_note TEXT,
  resolved_at DATETIME(6),
  resolved_by_id BIGINT,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (appeal_id),
  CONSTRAINT uk_result_appeals_result UNIQUE (assignment_result_id),
  CONSTRAINT fk_result_appeals_student FOREIGN KEY (student_id) REFERENCES app_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_result_appeals_result FOREIGN KEY (assignment_result_id) REFERENCES assignment_results (assignment_result_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_result_appeals_resolved_by FOREIGN KEY (resolved_by_id) REFERENCES app_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_result_appeals_status CHECK (appeal_status IN ('PENDING', 'APPROVED', 'REJECTED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

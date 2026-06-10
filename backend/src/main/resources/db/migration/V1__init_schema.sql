-- 1. app_users
CREATE TABLE IF NOT EXISTS app_users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(30) NOT NULL,
  phone_number VARCHAR(30),
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_user_role CHECK (user_role IN ('STUDENT', 'LECTURER', 'ADMINISTRATOR')),
  CONSTRAINT chk_user_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED'))
);

-- 2. courses
CREATE TABLE IF NOT EXISTS courses (
  course_id BIGSERIAL PRIMARY KEY,
  course_name VARCHAR(255) NOT NULL,
  class_code VARCHAR(50) NOT NULL UNIQUE,
  semester VARCHAR(50) NOT NULL,
  lecturer_id BIGINT NOT NULL REFERENCES app_users(id),
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. student_groups
CREATE TABLE IF NOT EXISTS student_groups (
  group_id BIGSERIAL PRIMARY KEY,
  group_name VARCHAR(100) NOT NULL,
  max_members INTEGER NOT NULL,
  course_id BIGINT NOT NULL REFERENCES courses(course_id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_student_groups_course_name UNIQUE (course_id, group_name)
);

-- 4. group_members
CREATE TABLE IF NOT EXISTS group_members (
  group_member_id BIGSERIAL PRIMARY KEY,
  group_id BIGINT NOT NULL REFERENCES student_groups(group_id),
  user_id BIGINT NOT NULL REFERENCES app_users(id),
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_group_members_group_user UNIQUE (group_id, user_id)
);

-- 5. lessons
CREATE TABLE IF NOT EXISTS lessons (
  lesson_id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  course_id BIGINT NOT NULL REFERENCES courses(course_id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. assignments
CREATE TABLE IF NOT EXISTS assignments (
  assignment_id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  deadline TIMESTAMP NOT NULL,
  review_deadline TIMESTAMP NOT NULL,
  showcase_mode BOOLEAN NOT NULL DEFAULT FALSE,
  lesson_id BIGINT NOT NULL REFERENCES lessons(lesson_id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_assignment_dates CHECK (review_deadline > deadline)
);

-- 7. lesson_materials
CREATE TABLE IF NOT EXISTS lesson_materials (
  material_id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  material_type VARCHAR(30) NOT NULL,
  lesson_id BIGINT REFERENCES lessons(lesson_id),
  assignment_id BIGINT REFERENCES assignments(assignment_id),
  file_name VARCHAR(255),
  file_path TEXT,
  file_size_mb DOUBLE PRECISION,
  file_type VARCHAR(100),
  url TEXT,
  label VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_material_type CHECK (material_type IN ('FILE', 'LINK')),
  CONSTRAINT chk_lesson_material_owner CHECK (
    (lesson_id IS NOT NULL AND assignment_id IS NULL)
    OR
    (lesson_id IS NULL AND assignment_id IS NOT NULL)
  )
);

-- 8. assignment_results
CREATE TABLE IF NOT EXISTS assignment_results (
  assignment_result_id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT NOT NULL REFERENCES assignments(assignment_id),
  group_id BIGINT NOT NULL REFERENCES student_groups(group_id),
  comments TEXT,
  score NUMERIC(5, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_assignment_results_assignment_group UNIQUE (assignment_id, group_id),
  CONSTRAINT chk_score_range CHECK (score >= 0 AND score <= 100)
);

-- 9. result_appeals
CREATE TABLE IF NOT EXISTS result_appeals (
  appeal_id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES app_users(id),
  content TEXT NOT NULL,
  assignment_result_id BIGINT NOT NULL UNIQUE REFERENCES assignment_results(assignment_result_id),
  appeal_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  resolution_note TEXT,
  resolved_at TIMESTAMP,
  resolved_by_id BIGINT REFERENCES app_users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_appeal_status CHECK (appeal_status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

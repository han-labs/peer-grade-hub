INSERT INTO app_users (
  username,
  email,
  password_hash,
  full_name,
  user_role,
  phone_number,
  status
) VALUES
(
  'admin01',
  'admin01@peergrade.test',
  '$2a$10$E07VOeats4RoFqod7T.nZOLGusJ1msnFKhOnvyjz/Nm7VAKOnDYyi',
  'Demo Administrator',
  'ADMINISTRATOR',
  NULL,
  'ACTIVE'
),
(
  'lecturer01',
  'lecturer01@peergrade.test',
  '$2a$10$L3fLaOL88K74duwUgszHa.UWPCPrbLp4UC9DL.g85/heqmbn7bQwq',
  'Demo Lecturer',
  'LECTURER',
  NULL,
  'ACTIVE'
),
(
  'student01',
  'student01@peergrade.test',
  '$2a$10$m2yKEWJs9ieIJBAL5s4c/uaIZRUCmFAY6Kmg.uopLwr5msYWlipPu',
  'Demo Student',
  'STUDENT',
  NULL,
  'ACTIVE'
);

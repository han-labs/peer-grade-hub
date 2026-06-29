package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.dto.response.dashboard.AdminDashboardResponse;
import edu.hcmute.peergradehub.dto.response.dashboard.LecturerDashboardResponse;
import edu.hcmute.peergradehub.dto.response.dashboard.StudentDashboardResponse;

public interface DashboardService {

    AdminDashboardResponse getAdminDashboard(Long userId);

    LecturerDashboardResponse getLecturerDashboard(Long userId);

    StudentDashboardResponse getStudentDashboard(Long userId);
}

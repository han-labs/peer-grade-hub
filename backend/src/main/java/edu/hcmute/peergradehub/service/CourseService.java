package edu.hcmute.peergradehub.service;

import java.util.List;

import edu.hcmute.peergradehub.dto.request.course.CreateCourseRequest;
import edu.hcmute.peergradehub.dto.request.course.UpdateCourseRequest;
import edu.hcmute.peergradehub.dto.response.course.CourseSummaryResponse;
import edu.hcmute.peergradehub.dto.response.course.CourseWorkspaceResponse;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.User;

public interface CourseService {
    Course createCourse(String courseName, String classCode, String semester, User lecturer, String description);
    
    List<CourseSummaryResponse> getLecturerCourses(Long actorId);
    CourseWorkspaceResponse createCourse(CreateCourseRequest request, Long actorId);
    CourseWorkspaceResponse getCourseWorkspace(Long courseId, Long actorId);
    CourseWorkspaceResponse updateCourse(Long courseId, UpdateCourseRequest request, Long actorId);
    List<CourseSummaryResponse> getActiveCourses(Long actorId);
}

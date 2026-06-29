package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.dto.request.course.CreateLessonRequest;
import edu.hcmute.peergradehub.dto.response.course.LessonResponse;
import edu.hcmute.peergradehub.dto.response.lesson.LessonAssignmentsResponse;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.Lesson;
import java.util.List;
public interface LessonService {
    Lesson createLesson(String title, Course course);
    LessonResponse createLesson(Long courseId, CreateLessonRequest request, Long actorId);
    LessonAssignmentsResponse getLessonAssignments(Long lessonId, Long actorId);
    // ===== NEW FOR UC-10 STUDENT NAVIGATION =====
    
    /**
     * Get all lessons of a course for a student.
     * Student must be enrolled in the course.
     */
    List<LessonResponse> getStudentLessons(Long courseId, Long studentId);
}

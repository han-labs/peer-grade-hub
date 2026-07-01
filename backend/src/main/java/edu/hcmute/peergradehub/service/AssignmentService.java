package edu.hcmute.peergradehub.service;
import edu.hcmute.peergradehub.dto.response.lesson.LessonAssignmentsResponse;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.Lesson;

import java.time.LocalDateTime;

public interface AssignmentService {
    Assignment createAssignment(String title, String description, LocalDateTime submissionDeadline,
                                LocalDateTime reviewDeadline, Lesson lesson);

    Assignment updateAssignment(Assignment assignment, String title, String description,
                                LocalDateTime submissionDeadline, LocalDateTime reviewDeadline);

    Assignment setShowcaseMode(Assignment assignment, boolean showcaseMode);
    // ===== NEW FOR UC-10 STUDENT NAVIGATION =====
    
    /**
     * Get all assignments of a lesson for a student.
     * Student must be enrolled in the course.
     * Includes isPublished status for each assignment.
     */
    LessonAssignmentsResponse getStudentAssignments(Long lessonId, Long studentId);

    // ===== UC-04: MANAGE ASSIGNMENTS =====
    Assignment createAssignment(Long lessonId, edu.hcmute.peergradehub.dto.request.course.CreateAssignmentRequest request, Long actorId);

    Assignment updateAssignment(Long assignmentId, edu.hcmute.peergradehub.dto.request.course.CreateAssignmentRequest request, Long actorId);

    edu.hcmute.peergradehub.dto.response.lesson.AssignmentDetailResponse getAssignmentDetail(Long assignmentId, Long actorId);

    void deleteAssignment(Long assignmentId, Long actorId);

    edu.hcmute.peergradehub.dto.response.course.LessonMaterialResponse uploadAssignmentFile(org.springframework.web.multipart.MultipartFile file, Long actorId);
}

package edu.hcmute.peergradehub.service.impl;

import edu.hcmute.peergradehub.dao.AssignmentDao;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.Lesson;
import edu.hcmute.peergradehub.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import edu.hcmute.peergradehub.dao.CourseEnrollmentDao;
import edu.hcmute.peergradehub.dao.AssignmentResultDao;
import edu.hcmute.peergradehub.dto.response.lesson.LessonAssignmentsResponse;
import edu.hcmute.peergradehub.dao.LessonDao;
import java.util.stream.Collectors;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.enumeration.CourseStatus;
import java.util.List;
import java.time.LocalDateTime;
import edu.hcmute.peergradehub.exception.BadRequestException;   
import edu.hcmute.peergradehub.exception.ForbiddenException;    
import edu.hcmute.peergradehub.exception.NotFoundException;    

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentDao assignmentRepository;
    private final LessonDao lessonRepository;
    private final CourseEnrollmentDao courseEnrollmentDao;
    private final AssignmentResultDao assignmentResultDao;
    @Override
    @Transactional
    public Assignment createAssignment(String title, String description, LocalDateTime submissionDeadline,
                                       LocalDateTime reviewDeadline, Lesson lesson) {
        Assignment assignment = Assignment.builder()
                .title(title)
                .description(description)
                .submissionDeadline(submissionDeadline)
                .reviewDeadline(reviewDeadline)
                .lesson(lesson)
                .build();
        validateReviewDeadline(assignment);
        return assignmentRepository.save(assignment);
    }

    @Override
    @Transactional
    public Assignment updateAssignment(Assignment assignment, String title, String description,
                                       LocalDateTime submissionDeadline, LocalDateTime reviewDeadline) {
        Assignment deadlineCandidate = Assignment.builder()
                .submissionDeadline(submissionDeadline)
                .reviewDeadline(reviewDeadline)
                .build();
        validateReviewDeadline(deadlineCandidate);

        assignment.setTitle(title);
        assignment.setDescription(description);
        assignment.setSubmissionDeadline(submissionDeadline);
        assignment.setReviewDeadline(reviewDeadline);
        return assignmentRepository.save(assignment);
    }

    @Override
    @Transactional
    public Assignment setShowcaseMode(Assignment assignment, boolean showcaseMode) {
        assignment.setShowcaseMode(showcaseMode);
        return assignmentRepository.save(assignment);
    }

    private void validateReviewDeadline(Assignment assignment) {
        if (!assignment.hasValidReviewDeadline()) {
            throw new IllegalArgumentException("Review deadline must be after the submission deadline.");
        }
    }

    @Override
    public LessonAssignmentsResponse getStudentAssignments(Long lessonId, Long studentId) {
        // 1. Lấy lesson
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new NotFoundException("Lesson not found."));
        
        // 2. Lấy course từ lesson
        Course course = lesson.getCourse();
        if (course == null) {
            throw new NotFoundException("Course not found for this lesson.");
        }
        
        // 3. Kiểm tra student đã join course chưa
        boolean isEnrolled = courseEnrollmentDao.existsByCourseIdAndStudentId(course.getId(), studentId);
        if (!isEnrolled) {
            throw new ForbiddenException("You are not enrolled in this course.");
        }
        
        // 4. Kiểm tra course ACTIVE
        if (course.getCourseStatus() != CourseStatus.ACTIVE) {
            throw new BadRequestException("This course is not active.");
        }
        
        // 5. Lấy assignments của lesson
        List<Assignment> assignments = assignmentRepository.findByLessonId(lessonId);
        
        // 6. Map sang response, thêm isPublished
        List<LessonAssignmentsResponse.AssignmentSummary> assignmentSummaries = assignments.stream()
                .map(assignment -> {
                    // Kiểm tra xem assignment này đã có result published chưa
                    // Cần inject AssignmentResultDao
                    boolean isPublished = assignmentResultDao.existsPublishedByAssignmentIdAndGroupId(
                            assignment.getId(), 
                            null // Không check group, chỉ check có result nào published không
                    );
                    // Hoặc đơn giản hơn: lấy assignment và kiểm tra result
                    // Hiện tại có thể bỏ qua hoặc để false
                    return new LessonAssignmentsResponse.AssignmentSummary(
                            assignment.getId(),
                            assignment.getTitle(),
                            assignment.getDescription(),
                            assignment.getSubmissionDeadline(),
                            assignment.getReviewDeadline(),
                            assignment.getShowcaseMode()
                    );
                })
                .collect(Collectors.toList());
        
        return new LessonAssignmentsResponse(
                lessonId,
                lesson.getTitle(),
                course.getId(),
                course.getCourseName(),
                assignmentSummaries
        );
    }

}

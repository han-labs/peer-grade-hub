package edu.hcmute.peergradehub.assignment.service;

import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.dao.AssignmentDao;
import edu.hcmute.peergradehub.entity.Lesson;
import edu.hcmute.peergradehub.service.impl.AssignmentServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import edu.hcmute.peergradehub.dto.request.course.CreateAssignmentRequest;
import edu.hcmute.peergradehub.exception.BadRequestException;
import edu.hcmute.peergradehub.exception.ForbiddenException;
import edu.hcmute.peergradehub.exception.NotFoundException;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.User;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssignmentServiceTest {

    @Mock
    private AssignmentDao assignmentRepository;
    @Mock
    private edu.hcmute.peergradehub.dao.LessonDao lessonRepository;
    @Mock
    private edu.hcmute.peergradehub.dao.CourseEnrollmentDao courseEnrollmentDao;
    @Mock
    private edu.hcmute.peergradehub.dao.AssignmentResultDao assignmentResultDao;
    @Mock
    private edu.hcmute.peergradehub.dao.UserDao userDao;
    @Mock
    private edu.hcmute.peergradehub.mapper.LessonMapper lessonMapper;
    @Mock
    private edu.hcmute.peergradehub.mapper.CourseMapper courseMapper;

    @InjectMocks
    private AssignmentServiceImpl assignmentService;

    @Test
    void createAssignment_Success() {
        Lesson lesson = Lesson.builder().build();
        LocalDateTime submissionDeadline = LocalDateTime.of(2026, 6, 10, 12, 0);
        LocalDateTime reviewDeadline = LocalDateTime.of(2026, 6, 15, 12, 0);

        when(assignmentRepository.save(any(Assignment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Assignment result = assignmentService.createAssignment("Assg 1", "Desc", submissionDeadline, reviewDeadline, lesson);

        assertNotNull(result);
        assertEquals("Assg 1", result.getTitle());
        assertEquals(submissionDeadline, result.getSubmissionDeadline());
        assertEquals(reviewDeadline, result.getReviewDeadline());
        verify(assignmentRepository).save(any(Assignment.class));
    }

    @Test
    void createAssignment_ThrowsException_WhenReviewDeadlineNotAfterDeadline() {
        Lesson lesson = Lesson.builder().build();
        LocalDateTime submissionDeadline = LocalDateTime.of(2026, 6, 10, 12, 0);
        LocalDateTime reviewDeadline = LocalDateTime.of(2026, 6, 10, 11, 59);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
            assignmentService.createAssignment("Assg 1", "Desc", submissionDeadline, reviewDeadline, lesson)
        );
        assertEquals("Review deadline must be after the submission deadline.", ex.getMessage());
        verify(assignmentRepository, never()).save(any());
    }

    @Test
    void createAssignmentUseCase_Success() {
        User lecturer = User.builder().id(1L).build();
        Course course = Course.builder().id(10L).lecturer(lecturer).build();
        Lesson lesson = Lesson.builder().id(100L).course(course).build();
        
        LocalDateTime subDeadline = LocalDateTime.of(2026, 7, 10, 12, 0);
        LocalDateTime revDeadline = LocalDateTime.of(2026, 7, 15, 12, 0);
        CreateAssignmentRequest request = new CreateAssignmentRequest("Test Title", "Desc", subDeadline, revDeadline, 5, java.util.Collections.emptyList());
        
        when(lessonRepository.findById(100L)).thenReturn(java.util.Optional.of(lesson));
        when(assignmentRepository.save(any(Assignment.class))).thenAnswer(inv -> inv.getArgument(0));

        Assignment result = assignmentService.createAssignment(100L, request, 1L);

        assertNotNull(result);
        assertEquals("Test Title", result.getTitle());
        assertEquals(5, result.getAppealDays());
        verify(assignmentRepository).save(any(Assignment.class));
    }

    @Test
    void createAssignmentUseCase_ThrowsException_WhenTitleEmpty() {
        CreateAssignmentRequest request = new CreateAssignmentRequest("", "Desc", LocalDateTime.now(), LocalDateTime.now(), 5, java.util.Collections.emptyList());
        
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
            assignmentService.createAssignment(100L, request, 1L)
        );
        assertEquals("Assignment title is required. Please enter a title before saving.", ex.getMessage());
    }

    @Test
    void createAssignmentUseCase_ThrowsException_WhenUnauthorized() {
        User lecturer = User.builder().id(2L).build(); // different lecturer
        Course course = Course.builder().id(10L).lecturer(lecturer).build();
        Lesson lesson = Lesson.builder().id(100L).course(course).build();
        
        CreateAssignmentRequest request = new CreateAssignmentRequest("Test Title", "Desc", LocalDateTime.now(), LocalDateTime.now().plusDays(1), 5, java.util.Collections.emptyList());
        
        when(lessonRepository.findById(100L)).thenReturn(java.util.Optional.of(lesson));

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
            assignmentService.createAssignment(100L, request, 1L)
        );
        assertEquals("You are not authorized to perform this action.", ex.getMessage());
    }

    @Test
    void updateAssignmentUseCase_Success() {
        User lecturer = User.builder().id(1L).build();
        Course course = Course.builder().id(10L).lecturer(lecturer).build();
        Lesson lesson = Lesson.builder().id(100L).course(course).build();
        Assignment assignment = Assignment.builder().id(500L).lesson(lesson).materials(new java.util.ArrayList<>()).build();
        
        LocalDateTime subDeadline = LocalDateTime.of(2026, 7, 10, 12, 0);
        LocalDateTime revDeadline = LocalDateTime.of(2026, 7, 15, 12, 0);
        CreateAssignmentRequest request = new CreateAssignmentRequest("Updated Title", "New Desc", subDeadline, revDeadline, 10, java.util.Collections.emptyList());
        
        when(assignmentRepository.findById(500L)).thenReturn(java.util.Optional.of(assignment));
        when(assignmentRepository.save(any(Assignment.class))).thenAnswer(inv -> inv.getArgument(0));

        Assignment result = assignmentService.updateAssignment(500L, request, 1L);

        assertNotNull(result);
        assertEquals("Updated Title", result.getTitle());
        assertEquals("New Desc", result.getDescription());
        assertEquals(10, result.getAppealDays());
    }

    @Test
    void deleteAssignmentUseCase_Success() {
        User lecturer = User.builder().id(1L).build();
        Course course = Course.builder().id(10L).lecturer(lecturer).build();
        Lesson lesson = Lesson.builder().id(100L).course(course).build();
        Assignment assignment = Assignment.builder().id(500L).lesson(lesson).build();
        
        when(assignmentRepository.findById(500L)).thenReturn(java.util.Optional.of(assignment));
        when(assignmentResultDao.existsPublishedByAssignmentIdAndGroupId(500L, null)).thenReturn(false);

        assignmentService.deleteAssignment(500L, 1L);

        verify(assignmentRepository).delete(assignment);
    }

    @Test
    void deleteAssignmentUseCase_ThrowsException_WhenGradesPublished() {
        User lecturer = User.builder().id(1L).build();
        Course course = Course.builder().id(10L).lecturer(lecturer).build();
        Lesson lesson = Lesson.builder().id(100L).course(course).build();
        Assignment assignment = Assignment.builder().id(500L).lesson(lesson).build();
        
        when(assignmentRepository.findById(500L)).thenReturn(java.util.Optional.of(assignment));
        when(assignmentResultDao.existsPublishedByAssignmentIdAndGroupId(500L, null)).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
            assignmentService.deleteAssignment(500L, 1L)
        );
        assertEquals("Cannot delete assignment because grades have already been published.", ex.getMessage());
    }
}

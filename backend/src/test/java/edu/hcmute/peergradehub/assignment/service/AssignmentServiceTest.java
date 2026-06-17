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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssignmentServiceTest {

    @Mock
    private AssignmentDao assignmentRepository;

    @InjectMocks
    private AssignmentServiceImpl assignmentService;

    @Test
    void createAssignment_Success() {
        Lesson lesson = Lesson.builder().build();
        LocalDateTime deadline = LocalDateTime.of(2026, 6, 10, 12, 0);
        LocalDateTime reviewDeadline = LocalDateTime.of(2026, 6, 15, 12, 0);

        when(assignmentRepository.save(any(Assignment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Assignment result = assignmentService.createAssignment("Assg 1", "Desc", deadline, reviewDeadline, lesson);

        assertNotNull(result);
        assertEquals("Assg 1", result.getTitle());
        assertEquals(deadline, result.getDeadline());
        assertEquals(reviewDeadline, result.getReviewDeadline());
        verify(assignmentRepository).save(any(Assignment.class));
    }

    @Test
    void createAssignment_ThrowsException_WhenReviewDeadlineNotAfterDeadline() {
        Lesson lesson = Lesson.builder().build();
        LocalDateTime deadline = LocalDateTime.of(2026, 6, 10, 12, 0);
        LocalDateTime reviewDeadline = LocalDateTime.of(2026, 6, 10, 11, 59);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
            assignmentService.createAssignment("Assg 1", "Desc", deadline, reviewDeadline, lesson)
        );
        assertEquals("Review deadline must be after the submission deadline.", ex.getMessage());
        verify(assignmentRepository, never()).save(any());
    }
}

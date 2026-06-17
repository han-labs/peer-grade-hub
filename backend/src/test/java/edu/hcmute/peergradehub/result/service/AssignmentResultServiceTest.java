package edu.hcmute.peergradehub.result.service;

import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.entity.AssignmentResult;
import edu.hcmute.peergradehub.dao.AssignmentResultDao;
import edu.hcmute.peergradehub.service.impl.AssignmentResultServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssignmentResultServiceTest {

    @Mock
    private AssignmentResultDao assignmentResultRepository;

    @InjectMocks
    private AssignmentResultServiceImpl assignmentResultService;

    @Test
    void saveResult_CreateSuccess() {
        Assignment assignment = Assignment.builder().id(1L).build();
        StudentGroup group = StudentGroup.builder().id(2L).build();
        BigDecimal score = BigDecimal.valueOf(95.5);

        when(assignmentResultRepository.findByAssignmentIdAndGroupId(1L, 2L)).thenReturn(Optional.empty());
        when(assignmentResultRepository.save(any(AssignmentResult.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AssignmentResult result = assignmentResultService.saveResult(assignment, group, score, "Great work!");

        assertNotNull(result);
        assertEquals(assignment, result.getAssignment());
        assertEquals(group, result.getGroup());
        assertEquals(score, result.getScore());
        assertEquals("Great work!", result.getComments());
        verify(assignmentResultRepository).save(any(AssignmentResult.class));
    }

    @Test
    void saveResult_UpdateSuccess() {
        Assignment assignment = Assignment.builder().id(1L).build();
        StudentGroup group = StudentGroup.builder().id(2L).build();
        BigDecimal oldScore = BigDecimal.valueOf(80.0);
        BigDecimal newScore = BigDecimal.valueOf(90.0);
        AssignmentResult existing = AssignmentResult.builder().id(100L).assignment(assignment).group(group).score(oldScore).comments("Old").build();

        when(assignmentResultRepository.findByAssignmentIdAndGroupId(1L, 2L)).thenReturn(Optional.of(existing));
        when(assignmentResultRepository.save(any(AssignmentResult.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AssignmentResult result = assignmentResultService.saveResult(assignment, group, newScore, "Updated");

        assertNotNull(result);
        assertEquals(existing.getId(), result.getId());
        assertEquals(newScore, result.getScore());
        assertEquals("Updated", result.getComments());
        verify(assignmentResultRepository).save(any(AssignmentResult.class));
    }

    @Test
    void saveResult_ThrowsException_WhenScoreLessThanZero() {
        Assignment assignment = Assignment.builder().id(1L).build();
        StudentGroup group = StudentGroup.builder().id(2L).build();
        BigDecimal score = BigDecimal.valueOf(-5.0);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
            assignmentResultService.saveResult(assignment, group, score, "Bad score")
        );
        assertEquals("Score must be between 0 and 100.", ex.getMessage());
        verify(assignmentResultRepository, never()).save(any());
    }

    @Test
    void saveResult_ThrowsException_WhenScoreGreaterThan100() {
        Assignment assignment = Assignment.builder().id(1L).build();
        StudentGroup group = StudentGroup.builder().id(2L).build();
        BigDecimal score = BigDecimal.valueOf(100.5);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
            assignmentResultService.saveResult(assignment, group, score, "Too high")
        );
        assertEquals("Score must be between 0 and 100.", ex.getMessage());
        verify(assignmentResultRepository, never()).save(any());
    }
}

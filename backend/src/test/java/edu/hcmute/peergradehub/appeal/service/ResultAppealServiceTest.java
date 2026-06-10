package edu.hcmute.peergradehub.appeal.service;

import edu.hcmute.peergradehub.appeal.model.AppealStatus;
import edu.hcmute.peergradehub.appeal.model.ResultAppeal;
import edu.hcmute.peergradehub.appeal.repository.ResultAppealRepository;
import edu.hcmute.peergradehub.assignment.model.Assignment;
import edu.hcmute.peergradehub.course.model.Course;
import edu.hcmute.peergradehub.group.model.StudentGroup;
import edu.hcmute.peergradehub.group.repository.GroupMemberRepository;
import edu.hcmute.peergradehub.lesson.model.Lesson;
import edu.hcmute.peergradehub.result.model.AssignmentResult;
import edu.hcmute.peergradehub.user.model.User;
import edu.hcmute.peergradehub.user.model.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResultAppealServiceTest {

    @Mock
    private ResultAppealRepository resultAppealRepository;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @InjectMocks
    private ResultAppealService resultAppealService;

    @Test
    void submitAppeal_Success() {
        StudentGroup group = StudentGroup.builder().id(2L).build();
        AssignmentResult result = AssignmentResult.builder().id(10L).group(group).build();
        User student = User.builder().id(5L).build();

        when(groupMemberRepository.existsByGroupIdAndUserId(2L, 5L)).thenReturn(true);
        when(resultAppealRepository.existsByAssignmentResultId(10L)).thenReturn(false);
        when(resultAppealRepository.save(any(ResultAppeal.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResultAppeal appeal = resultAppealService.submitAppeal(result, student, "Please review my score.");

        assertNotNull(appeal);
        assertEquals(result, appeal.getAssignmentResult());
        assertEquals(student, appeal.getStudent());
        assertEquals("Please review my score.", appeal.getContent());
        verify(resultAppealRepository).save(any(ResultAppeal.class));
    }

    @Test
    void submitAppeal_ThrowsException_WhenStudentNotGroupMember() {
        StudentGroup group = StudentGroup.builder().id(2L).build();
        AssignmentResult result = AssignmentResult.builder().id(10L).group(group).build();
        User student = User.builder().id(5L).build();

        when(groupMemberRepository.existsByGroupIdAndUserId(2L, 5L)).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
            resultAppealService.submitAppeal(result, student, "Please review my score.")
        );
        assertEquals("Student does not belong to the group that received this grade.", ex.getMessage());
        verify(resultAppealRepository, never()).save(any());
    }

    @Test
    void submitAppeal_ThrowsException_WhenAppealAlreadyExists() {
        StudentGroup group = StudentGroup.builder().id(2L).build();
        AssignmentResult result = AssignmentResult.builder().id(10L).group(group).build();
        User student = User.builder().id(5L).build();

        when(groupMemberRepository.existsByGroupIdAndUserId(2L, 5L)).thenReturn(true);
        when(resultAppealRepository.existsByAssignmentResultId(10L)).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
            resultAppealService.submitAppeal(result, student, "Please review my score.")
        );
        assertEquals("An appeal has already been submitted for this result.", ex.getMessage());
        verify(resultAppealRepository, never()).save(any());
    }

    @Test
    void resolveAppeal_Success() {
        User lecturer = User.builder().id(1L).userRole(UserRole.LECTURER).build();
        Course course = Course.builder().lecturer(lecturer).build();
        Lesson lesson = Lesson.builder().course(course).build();
        Assignment assignment = Assignment.builder().lesson(lesson).build();
        AssignmentResult result = AssignmentResult.builder().assignment(assignment).build();
        
        ResultAppeal appeal = ResultAppeal.builder().assignmentResult(result).appealStatus(AppealStatus.PENDING).build();

        when(resultAppealRepository.save(any(ResultAppeal.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResultAppeal resolved = resultAppealService.resolveAppeal(appeal, lecturer, AppealStatus.APPROVED, "Score adjusted.");

        assertNotNull(resolved);
        assertEquals(AppealStatus.APPROVED, resolved.getAppealStatus());
        assertEquals("Score adjusted.", resolved.getResolutionNote());
        assertEquals(lecturer, resolved.getResolvedBy());
        assertNotNull(resolved.getResolvedAt());
        verify(resultAppealRepository).save(any(ResultAppeal.class));
    }

    @Test
    void resolveAppeal_ThrowsException_WhenNotLecturer() {
        User student = User.builder().id(2L).userRole(UserRole.STUDENT).build();
        ResultAppeal appeal = ResultAppeal.builder().build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
            resultAppealService.resolveAppeal(appeal, student, AppealStatus.APPROVED, "Adjusted")
        );
        assertEquals("Only lecturers can resolve grade appeals.", ex.getMessage());
        verify(resultAppealRepository, never()).save(any());
    }

    @Test
    void resolveAppeal_ThrowsException_WhenNotCourseOwner() {
        User ownerLecturer = User.builder().id(1L).userRole(UserRole.LECTURER).build();
        User otherLecturer = User.builder().id(3L).userRole(UserRole.LECTURER).build();
        
        Course course = Course.builder().lecturer(ownerLecturer).build();
        Lesson lesson = Lesson.builder().course(course).build();
        Assignment assignment = Assignment.builder().lesson(lesson).build();
        AssignmentResult result = AssignmentResult.builder().assignment(assignment).build();
        
        ResultAppeal appeal = ResultAppeal.builder().assignmentResult(result).build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
            resultAppealService.resolveAppeal(appeal, otherLecturer, AppealStatus.APPROVED, "Adjusted")
        );
        assertEquals("Only the lecturer who owns/manages the course can resolve this appeal.", ex.getMessage());
        verify(resultAppealRepository, never()).save(any());
    }
}

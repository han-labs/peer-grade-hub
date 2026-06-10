package edu.hcmute.peergradehub.group.service;

import edu.hcmute.peergradehub.course.model.Course;
import edu.hcmute.peergradehub.group.model.GroupMember;
import edu.hcmute.peergradehub.group.model.StudentGroup;
import edu.hcmute.peergradehub.group.repository.GroupMemberRepository;
import edu.hcmute.peergradehub.group.repository.StudentGroupRepository;
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
class GroupServiceTest {

    @Mock
    private StudentGroupRepository studentGroupRepository;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @InjectMocks
    private GroupService groupService;

    @Test
    void joinGroup_Success() {
        Course course = Course.builder().id(1L).build();
        StudentGroup group = StudentGroup.builder().id(10L).maxMembers(5).course(course).build();
        User student = User.builder().id(20L).userRole(UserRole.STUDENT).build();

        when(groupMemberRepository.existsByCourseIdAndUserId(1L, 20L)).thenReturn(false);
        when(groupMemberRepository.countByGroupId(10L)).thenReturn(2L);
        when(groupMemberRepository.save(any(GroupMember.class))).thenAnswer(invocation -> invocation.getArgument(0));

        GroupMember result = groupService.joinGroup(group, student);

        assertNotNull(result);
        assertEquals(group, result.getGroup());
        assertEquals(student, result.getUser());
        verify(groupMemberRepository).save(any(GroupMember.class));
    }

    @Test
    void joinGroup_ThrowsException_WhenUserNotStudent() {
        StudentGroup group = StudentGroup.builder().build();
        User lecturer = User.builder().userRole(UserRole.LECTURER).build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
            groupService.joinGroup(group, lecturer)
        );
        assertEquals("Only students can join groups.", ex.getMessage());
    }

    @Test
    void joinGroup_ThrowsException_WhenAlreadyInAnotherGroup() {
        Course course = Course.builder().id(1L).build();
        StudentGroup group = StudentGroup.builder().id(10L).course(course).build();
        User student = User.builder().id(20L).userRole(UserRole.STUDENT).build();

        when(groupMemberRepository.existsByCourseIdAndUserId(1L, 20L)).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
            groupService.joinGroup(group, student)
        );
        assertEquals("Student is already a member of a group in this course.", ex.getMessage());
    }

    @Test
    void joinGroup_ThrowsException_WhenGroupFull() {
        Course course = Course.builder().id(1L).build();
        StudentGroup group = StudentGroup.builder().id(10L).maxMembers(3).course(course).build();
        User student = User.builder().id(20L).userRole(UserRole.STUDENT).build();

        when(groupMemberRepository.existsByCourseIdAndUserId(1L, 20L)).thenReturn(false);
        when(groupMemberRepository.countByGroupId(10L)).thenReturn(3L);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
            groupService.joinGroup(group, student)
        );
        assertEquals("Group has reached its maximum capacity.", ex.getMessage());
    }
}

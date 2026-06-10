package edu.hcmute.peergradehub.group.service;

import edu.hcmute.peergradehub.course.model.Course;
import edu.hcmute.peergradehub.group.model.GroupMember;
import edu.hcmute.peergradehub.group.model.StudentGroup;
import edu.hcmute.peergradehub.group.repository.GroupMemberRepository;
import edu.hcmute.peergradehub.group.repository.StudentGroupRepository;
import edu.hcmute.peergradehub.user.model.User;
import edu.hcmute.peergradehub.user.model.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GroupService {

    private final StudentGroupRepository studentGroupRepository;
    private final GroupMemberRepository groupMemberRepository;

    @Transactional
    public StudentGroup createGroup(String groupName, Integer maxMembers, Course course) {
        if (studentGroupRepository.existsByCourseIdAndGroupName(course.getId(), groupName)) {
            throw new IllegalArgumentException("Group name must be unique within the course.");
        }
        StudentGroup group = StudentGroup.builder()
                .groupName(groupName)
                .maxMembers(maxMembers)
                .course(course)
                .build();
        return studentGroupRepository.save(group);
    }

    @Transactional
    public GroupMember joinGroup(StudentGroup group, User student) {
        if (student.getUserRole() != UserRole.STUDENT) {
            throw new IllegalArgumentException("Only students can join groups.");
        }
        
        // Check if student is already in another group of the same course
        if (groupMemberRepository.existsByCourseIdAndUserId(group.getCourse().getId(), student.getId())) {
            throw new IllegalArgumentException("Student is already a member of a group in this course.");
        }

        // Check if group is full
        long currentMembersCount = groupMemberRepository.countByGroupId(group.getId());
        if (currentMembersCount >= group.getMaxMembers()) {
            throw new IllegalArgumentException("Group has reached its maximum capacity.");
        }

        GroupMember member = GroupMember.builder()
                .group(group)
                .user(student)
                .build();
        return groupMemberRepository.save(member);
    }

    @Transactional
    public void removeMember(Long groupMemberId) {
        groupMemberRepository.deleteById(groupMemberId);
    }
}

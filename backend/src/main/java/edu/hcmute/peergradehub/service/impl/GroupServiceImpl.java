package edu.hcmute.peergradehub.service.impl;

import edu.hcmute.peergradehub.dao.GroupMemberDao;
import edu.hcmute.peergradehub.dao.StudentGroupDao;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.GroupMember;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GroupServiceImpl implements GroupService {

    private final StudentGroupDao studentGroupRepository;
    private final GroupMemberDao groupMemberRepository;

    @Override
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

    @Override
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

    @Override
    @Transactional
    public void removeMember(Long groupMemberId) {
        groupMemberRepository.deleteById(groupMemberId);
    }
}

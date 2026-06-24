package edu.hcmute.peergradehub.service.impl;

import edu.hcmute.peergradehub.dao.GroupMemberDao;
import edu.hcmute.peergradehub.dao.StudentGroupDao;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.GroupMember;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.service.GroupService;
import edu.hcmute.peergradehub.dao.CourseDao;
import edu.hcmute.peergradehub.dao.UserDao;
import edu.hcmute.peergradehub.dto.request.group.GenerateGroupsRequest;
import edu.hcmute.peergradehub.dto.request.group.UpdateGroupDeadlineRequest;
import edu.hcmute.peergradehub.dto.response.group.GroupActionResponse;
import edu.hcmute.peergradehub.dto.response.group.GroupManagementResponse;
import edu.hcmute.peergradehub.enumeration.CourseStatus;
import edu.hcmute.peergradehub.enumeration.GroupStatus;
import edu.hcmute.peergradehub.exception.BadRequestException;
import edu.hcmute.peergradehub.exception.ConflictException;
import edu.hcmute.peergradehub.exception.ForbiddenException;
import edu.hcmute.peergradehub.exception.NotFoundException;
import edu.hcmute.peergradehub.mapper.GroupMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GroupServiceImpl implements GroupService {

    private final StudentGroupDao studentGroupRepository;
    private final GroupMemberDao groupMemberRepository;
    private final UserDao userDao;
    private final CourseDao courseDao;
    private final GroupMapper groupMapper;

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
        int currentMembersCount = Math.toIntExact(groupMemberRepository.countByGroupId(group.getId()));
        if (!group.hasCapacity(currentMembersCount)) {
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

    private Course validateActorAndCourseForGroupManagement(Long courseId, Long actorId) {
        User actor = userDao.findById(actorId)
                .orElseThrow(() -> new ForbiddenException("You are not authorized to manage groups for this course."));

        if (actor.getUserRole() != UserRole.LECTURER || !actor.isActive()) {
            throw new ForbiddenException("You are not authorized to manage groups for this course.");
        }

        return courseDao.findByIdAndLecturerId(courseId, actorId)
                .orElseThrow(() -> new ForbiddenException("You are not authorized to manage groups for this course."));
    }

    private void ensureCourseModifiable(Course course) {
        if (course.getCourseStatus() != CourseStatus.ACTIVE) {
            throw new BadRequestException("This course is archived and groups cannot be modified.");
        }
    }

    private GroupManagementResponse buildManagementResponse(Course course) {
        List<StudentGroup> groups = studentGroupRepository.findByCourseIdOrderByIdAsc(course.getId());
        List<Long> groupIds = groups.stream().map(StudentGroup::getId).toList();
        List<GroupMember> allMembers = groupIds.isEmpty() ? new ArrayList<>() : groupMemberRepository.findByGroupIdIn(groupIds);
        Map<Long, List<GroupMember>> membersByGroupId = allMembers.stream()
                .collect(Collectors.groupingBy(member -> member.getGroup().getId()));
        
        return groupMapper.toManagementResponse(course, groups, membersByGroupId);
    }

    private void autoLockIfDeadlinePassed(Course course) {
        if (course.getGroupFormationDeadline() != null && LocalDateTime.now().isAfter(course.getGroupFormationDeadline())) {
            List<StudentGroup> groups = studentGroupRepository.findByCourseId(course.getId());
            boolean modified = false;
            for (StudentGroup group : groups) {
                if (group.getGroupStatus() != GroupStatus.LOCKED) {
                    group.setGroupStatus(GroupStatus.LOCKED);
                    modified = true;
                }
            }
            if (modified) {
                studentGroupRepository.saveAll(groups);
            }
        }
    }

    @Override
    @Transactional
    public GroupManagementResponse generateGroups(Long courseId, GenerateGroupsRequest request, Long actorId) {
        Course course = validateActorAndCourseForGroupManagement(courseId, actorId);
        ensureCourseModifiable(course);

        if (request.numberOfGroups() == null || request.numberOfGroups() < 1) {
            throw new BadRequestException("Number of Groups must be at least 1.");
        }
        if (request.maxGroupSize() == null || request.maxGroupSize() < 1) {
            throw new BadRequestException("Max Group Size must be at least 1.");
        }
        if (request.groupFormationDeadline() == null || !request.groupFormationDeadline().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("The group formation deadline must be a future date and time.");
        }

        course.setGroupFormationDeadline(request.groupFormationDeadline());
        courseDao.save(course);

        if (studentGroupRepository.existsByCourseId(courseId)) {
            return buildManagementResponse(course);
        }

        List<StudentGroup> newGroups = new ArrayList<>();
        for (int i = 1; i <= request.numberOfGroups(); i++) {
            String groupName = "Group " + i;
            if (studentGroupRepository.existsByCourseIdAndGroupName(courseId, groupName)) {
                throw new ConflictException("A group with this name already exists in this course.");
            }
            StudentGroup newGroup = StudentGroup.builder()
                    .groupName(groupName)
                    .maxMembers(request.maxGroupSize())
                    .course(course)
                    .groupStatus(GroupStatus.FORMING)
                    .build();
            newGroups.add(newGroup);
        }
        studentGroupRepository.saveAll(newGroups);

        return buildManagementResponse(course);
    }

    @Override
    @Transactional
    public GroupManagementResponse getGroupManagement(Long courseId, Long actorId) {
        Course course = validateActorAndCourseForGroupManagement(courseId, actorId);
        autoLockIfDeadlinePassed(course);
        return buildManagementResponse(course);
    }

    @Override
    @Transactional
    public GroupManagementResponse updateGroupFormationDeadline(Long courseId, UpdateGroupDeadlineRequest request, Long actorId) {
        Course course = validateActorAndCourseForGroupManagement(courseId, actorId);
        ensureCourseModifiable(course);

        if (request.groupFormationDeadline() == null || !request.groupFormationDeadline().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("The group formation deadline must be a future date and time.");
        }

        course.setGroupFormationDeadline(request.groupFormationDeadline());
        courseDao.save(course);

        return buildManagementResponse(course);
    }

    @Override
    @Transactional
    public GroupActionResponse removeGroupMember(Long courseId, Long groupId, Long groupMemberId, Long actorId) {
        Course course = validateActorAndCourseForGroupManagement(courseId, actorId);
        ensureCourseModifiable(course);

        StudentGroup group = studentGroupRepository.findByIdAndCourseId(groupId, courseId)
                .orElseThrow(() -> new ForbiddenException("You are not authorized to manage groups for this course."));

        if (group.getGroupStatus() == GroupStatus.LOCKED) {
            throw new BadRequestException("Groups are locked. Please unlock groups before modifying rosters.");
        }

        GroupMember groupMember = groupMemberRepository.findByIdAndGroupId(groupMemberId, groupId)
                .orElseThrow(() -> new BadRequestException("Selected member is not found in this group roster."));

        groupMemberRepository.delete(groupMember);

        return groupMapper.toActionResponse("Group member removed successfully.", buildManagementResponse(course));
    }

    @Override
    @Transactional
    public GroupActionResponse lockAllGroups(Long courseId, Long actorId) {
        Course course = validateActorAndCourseForGroupManagement(courseId, actorId);
        ensureCourseModifiable(course);

        List<StudentGroup> groups = studentGroupRepository.findByCourseId(courseId);
        for (StudentGroup group : groups) {
            group.setGroupStatus(GroupStatus.LOCKED);
        }
        studentGroupRepository.saveAll(groups);

        return groupMapper.toActionResponse("Groups locked successfully.", buildManagementResponse(course));
    }

    @Override
    @Transactional
    public GroupActionResponse unlockGroups(Long courseId, Long actorId) {
        Course course = validateActorAndCourseForGroupManagement(courseId, actorId);
        ensureCourseModifiable(course);

        if (course.getGroupFormationDeadline() == null || !course.getGroupFormationDeadline().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("Please extend the Group Formation Deadline before unlocking groups.");
        }

        List<StudentGroup> groups = studentGroupRepository.findByCourseId(courseId);
        for (StudentGroup group : groups) {
            group.setGroupStatus(GroupStatus.FORMING);
        }
        studentGroupRepository.saveAll(groups);

        return groupMapper.toActionResponse("Groups unlocked successfully.", buildManagementResponse(course));
    }
}

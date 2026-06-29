package edu.hcmute.peergradehub.service.impl;

import edu.hcmute.peergradehub.dao.CourseDao;
import edu.hcmute.peergradehub.dao.CourseEnrollmentDao;
import edu.hcmute.peergradehub.dao.GroupMemberDao;
import edu.hcmute.peergradehub.dao.StudentGroupDao;
import edu.hcmute.peergradehub.dao.UserDao;
import edu.hcmute.peergradehub.dto.response.student.GroupSelectionResponse;
import edu.hcmute.peergradehub.dto.response.student.InvitationPreviewResponse;
import edu.hcmute.peergradehub.dto.response.student.JoinCourseResponse;
import edu.hcmute.peergradehub.dto.response.student.JoinGroupResponse;
import edu.hcmute.peergradehub.dto.response.student.LeaveGroupResponse;
import edu.hcmute.peergradehub.entity.CourseEnrollment;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.GroupMember;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.CourseStatus;
import edu.hcmute.peergradehub.enumeration.GroupStatus;
import edu.hcmute.peergradehub.enumeration.UserRole;
import edu.hcmute.peergradehub.exception.BadRequestException;
import edu.hcmute.peergradehub.exception.ConflictException;
import edu.hcmute.peergradehub.exception.ForbiddenException;
import edu.hcmute.peergradehub.exception.NotFoundException;
import edu.hcmute.peergradehub.service.StudentParticipationFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
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
public class StudentParticipationFacadeImpl implements StudentParticipationFacade {

    private static final String INVALID_INVITATION_MESSAGE =
            "Invalid or expired invitation link. Please check the link and try again, or contact your lecturer.";
    private static final String COURSE_UNAVAILABLE_MESSAGE =
            "This course is no longer available. Please contact your lecturer for assistance.";
    private static final String GROUP_DEADLINE_PASSED_MESSAGE =
            "The group formation deadline has passed. You cannot join or change groups anymore. Please contact your lecturer if you need assistance.";
    private static final String GROUP_DATA_CONFLICT_MESSAGE =
            "Cannot add you to the group due to a data conflict. Please contact your lecturer or the system administrator.";
    private static final String NOT_IN_GROUP_MESSAGE =
            "You are not currently a member of any group in this course.";

    private final UserDao userDao;
    private final CourseDao courseDao;
    private final CourseEnrollmentDao courseEnrollmentDao;
    private final StudentGroupDao studentGroupDao;
    private final GroupMemberDao groupMemberDao;

    @Override
    public InvitationPreviewResponse previewInvitation(String invitationCode, Long studentId) {
        User student = validateActiveStudent(studentId);
        Course course = validateAvailableCourseInvitation(invitationCode);

        boolean alreadyJoined = courseEnrollmentDao.existsByCourseIdAndStudentId(course.getId(), student.getId());

        return new InvitationPreviewResponse(
                course.getId(),
                course.getCourseName(),
                course.getClassCode(),
                course.getInvitationCode(),
                course.getDescription(),
                course.getLecturer() != null ? course.getLecturer().getFullName() : null,
                alreadyJoined
        );
    }

    @Override
    @Transactional
    public JoinCourseResponse joinCourse(String invitationCode, Long studentId) {
        User student = validateActiveStudent(studentId);
        Course course = validateAvailableCourseInvitation(invitationCode);

        if (courseEnrollmentDao.existsByCourseIdAndStudentId(course.getId(), student.getId())) {
            return joinedCourseResponse(course, true);
        }

        CourseEnrollment enrollment = CourseEnrollment.builder()
                .course(course)
                .student(student)
                .build();

        try {
            courseEnrollmentDao.save(enrollment);
        } catch (DataIntegrityViolationException exception) {
            return joinedCourseResponse(course, true);
        }

        return joinedCourseResponse(course, false);
    }

    private User validateActiveStudent(Long studentId) {
        User student = userDao.findById(studentId)
                .orElseThrow(() -> new ForbiddenException("Only active students can join courses."));

        if (student.getUserRole() != UserRole.STUDENT || !student.isActive()) {
            throw new ForbiddenException("Only active students can join courses.");
        }

        return student;
    }

    private Course validateAvailableCourseInvitation(String invitationCode) {
        String normalizedInvitationCode = normalizeInvitationCode(invitationCode);
        Course course = courseDao.findByInvitationCode(normalizedInvitationCode)
                .orElseThrow(() -> new NotFoundException(INVALID_INVITATION_MESSAGE));

        if (course.getCourseStatus() != CourseStatus.ACTIVE) {
            throw new BadRequestException(COURSE_UNAVAILABLE_MESSAGE);
        }

        return course;
    }

    private String normalizeInvitationCode(String invitationCode) {
        if (invitationCode == null || invitationCode.isBlank()) {
            throw new NotFoundException(INVALID_INVITATION_MESSAGE);
        }
        return invitationCode.trim();
    }

    private JoinCourseResponse joinedCourseResponse(Course course, boolean alreadyJoined) {
        return new JoinCourseResponse(
                course.getId(),
                course.getCourseName(),
                course.getClassCode(),
                alreadyJoined,
                alreadyJoined
                        ? "You are already a member of this course. Redirecting to group selection."
                        : "You have successfully joined " + course.getCourseName() + ". You can now view course materials and join a group."
        );
    }

    @Override
    public GroupSelectionResponse getGroupSelection(Long courseId, Long studentId) {
        User student = validateActiveStudent(studentId);
        Course course = courseDao.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found."));

        if (!courseEnrollmentDao.existsByCourseIdAndStudentId(course.getId(), student.getId())) {
            throw new ForbiddenException("You are not enrolled in this course.");
        }

        List<StudentGroup> groups = studentGroupDao.findByCourseIdOrderByIdAsc(course.getId());
        List<Long> groupIds = groups.stream()
                .map(StudentGroup::getId)
                .toList();
        List<GroupMember> members = groupIds.isEmpty()
                ? new ArrayList<>()
                : groupMemberDao.findByGroupIdIn(groupIds);
        Map<Long, List<GroupMember>> membersByGroupId = members.stream()
                .collect(Collectors.groupingBy(member -> member.getGroup().getId()));

        Long currentGroupId = members.stream()
                .filter(member -> member.getUser().getId().equals(student.getId()))
                .map(member -> member.getGroup().getId())
                .findFirst()
                .orElse(null);

        LocalDateTime groupFormationDeadline = course.getGroupFormationDeadline();
        boolean deadlinePassed = groupFormationDeadline != null && LocalDateTime.now().isAfter(groupFormationDeadline);

        return new GroupSelectionResponse(
                course.getId(),
                course.getCourseName(),
                groupFormationDeadline,
                deadlinePassed,
                currentGroupId,
                groups.stream()
                        .map(group -> toGroupOptionResponse(group, membersByGroupId.getOrDefault(group.getId(), List.of())))
                        .toList()
        );
    }

    private GroupSelectionResponse.GroupOptionResponse toGroupOptionResponse(
            StudentGroup group,
            List<GroupMember> members
    ) {
        int currentMembers = members.size();
        boolean full = group.getMaxMembers() != null && currentMembers >= group.getMaxMembers();
        boolean locked = group.getGroupStatus() == GroupStatus.LOCKED;

        return new GroupSelectionResponse.GroupOptionResponse(
                group.getId(),
                group.getGroupName(),
                group.getMaxMembers(),
                currentMembers,
                full,
                locked,
                members.stream()
                        .map(member -> new GroupSelectionResponse.GroupMemberPreviewResponse(
                                member.getUser().getFullName()
                        ))
                        .toList()
        );
    }

    @Override
    @Transactional
    public JoinGroupResponse joinGroup(Long courseId, Long groupId, Long studentId) {
        User student = validateActiveStudent(studentId);
        Course course = courseDao.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found."));

        if (!courseEnrollmentDao.existsByCourseIdAndStudentId(course.getId(), student.getId())) {
            throw new ForbiddenException("You are not enrolled in this course.");
        }

        StudentGroup selectedGroup = studentGroupDao.findById(groupId)
                .orElseThrow(() -> new NotFoundException("Group not found."));

        if (!selectedGroup.getCourse().getId().equals(course.getId())) {
            throw new BadRequestException("Group does not belong to the specified course.");
        }

        if (course.getGroupFormationDeadline() != null
                && LocalDateTime.now().isAfter(course.getGroupFormationDeadline())) {
            throw new ConflictException(GROUP_DEADLINE_PASSED_MESSAGE);
        }

        if (selectedGroup.getGroupStatus() == GroupStatus.LOCKED) {
            throw new ConflictException("This group is locked. Please choose another group.");
        }

        long currentMembers = groupMemberDao.countByGroupId(selectedGroup.getId());
        if (selectedGroup.getMaxMembers() != null && currentMembers >= selectedGroup.getMaxMembers()) {
            throw new ConflictException("Cannot join " + selectedGroup.getGroupName()
                    + " because this group is full. Please choose another group.");
        }

        studentGroupDao.findGroupByStudentAndCourse(student.getId(), course.getId())
                .ifPresent(currentGroup -> {
                    throw new ConflictException("You are already a member of " + currentGroup.getGroupName()
                            + ". Please leave your current group before joining another group.");
                });

        GroupMember groupMember = GroupMember.builder()
                .group(selectedGroup)
                .user(student)
                .build();

        try {
            groupMemberDao.saveAndFlush(groupMember);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException(GROUP_DATA_CONFLICT_MESSAGE);
        }

        return new JoinGroupResponse(
                courseId,
                selectedGroup.getId(),
                selectedGroup.getGroupName(),
                selectedGroup.getId(),
                "You have joined " + selectedGroup.getGroupName() + ". You can now work with your group members on assignments."
        );
    }

    @Override
    @Transactional
    public LeaveGroupResponse leaveGroup(Long courseId, Long studentId) {
        User student = validateActiveStudent(studentId);
        Course course = courseDao.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found."));

        if (!courseEnrollmentDao.existsByCourseIdAndStudentId(course.getId(), student.getId())) {
            throw new ForbiddenException("You are not enrolled in this course.");
        }

        GroupMember currentMembership = groupMemberDao.findByCourseIdAndUserId(course.getId(), student.getId())
                .orElseThrow(() -> new BadRequestException(NOT_IN_GROUP_MESSAGE));
        StudentGroup currentGroup = currentMembership.getGroup();

        if (course.getGroupFormationDeadline() != null
                && LocalDateTime.now().isAfter(course.getGroupFormationDeadline())) {
            throw new ConflictException(GROUP_DEADLINE_PASSED_MESSAGE);
        }

        if (currentGroup.getGroupStatus() == GroupStatus.LOCKED) {
            throw new ConflictException("This group is locked. You cannot leave this group at this time.");
        }

        groupMemberDao.delete(currentMembership);

        return new LeaveGroupResponse(
                courseId,
                currentGroup.getId(),
                currentGroup.getGroupName(),
                null,
                "You have left " + currentGroup.getGroupName() + ". You can now join another group."
        );
    }
}

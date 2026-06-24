package edu.hcmute.peergradehub.mapper;

import edu.hcmute.peergradehub.dto.response.group.GroupActionResponse;
import edu.hcmute.peergradehub.dto.response.group.GroupManagementResponse;
import edu.hcmute.peergradehub.dto.response.group.GroupMemberResponse;
import edu.hcmute.peergradehub.dto.response.group.StudentGroupResponse;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.GroupMember;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.entity.User;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class GroupMapper {

    public GroupMemberResponse toMemberResponse(GroupMember member) {
        if (member == null) {
            return null;
        }
        User user = member.getUser();
        if (user == null) {
            return null;
        }

        return new GroupMemberResponse(
                member.getId(),
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                member.getJoinedAt()
        );
    }

    public StudentGroupResponse toGroupResponse(StudentGroup group, List<GroupMember> members) {
        if (group == null) {
            return null;
        }

        List<GroupMemberResponse> memberResponses = members != null
                ? members.stream()
                         .map(this::toMemberResponse)
                         .collect(Collectors.toList())
                : Collections.emptyList();

        String status = group.getGroupStatus() != null ? group.getGroupStatus().name() : null;

        return new StudentGroupResponse(
                group.getId(),
                group.getGroupName(),
                group.getMaxMembers(),
                status,
                memberResponses.size(),
                memberResponses
        );
    }

    public GroupManagementResponse toManagementResponse(Course course, List<StudentGroup> groups, Map<Long, List<GroupMember>> membersByGroupId) {
        if (course == null) {
            return null;
        }

        List<StudentGroupResponse> groupResponses = groups != null
                ? groups.stream()
                        .map(group -> {
                            List<GroupMember> members = membersByGroupId != null
                                    ? membersByGroupId.getOrDefault(group.getId(), Collections.emptyList())
                                    : Collections.emptyList();
                            return toGroupResponse(group, members);
                        })
                        .collect(Collectors.toList())
                : Collections.emptyList();

        return new GroupManagementResponse(
                course.getId(),
                course.getCourseName(),
                course.getGroupFormationDeadline(),
                groupResponses
        );
    }

    public GroupActionResponse toActionResponse(String message, GroupManagementResponse groupManagement) {
        return new GroupActionResponse(message, groupManagement);
    }
}

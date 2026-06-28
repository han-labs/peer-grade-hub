package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.dto.request.group.AddGroupsRequest;
import edu.hcmute.peergradehub.dto.request.group.GenerateGroupsRequest;
import edu.hcmute.peergradehub.dto.request.group.UpdateGroupDeadlineRequest;
import edu.hcmute.peergradehub.dto.request.group.UpdateMaxGroupSizeRequest;
import edu.hcmute.peergradehub.dto.response.group.GroupActionResponse;
import edu.hcmute.peergradehub.dto.response.group.GroupManagementResponse;
import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.GroupMember;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.entity.User;

public interface GroupService {
    StudentGroup createGroup(String groupName, Integer maxMembers, Course course);

    GroupMember joinGroup(StudentGroup group, User student);

    void removeMember(Long groupMemberId);

    GroupManagementResponse generateGroups(Long courseId, GenerateGroupsRequest request, Long actorId);

    GroupManagementResponse getGroupManagement(Long courseId, Long actorId);

    GroupManagementResponse updateGroupFormationDeadline(Long courseId, UpdateGroupDeadlineRequest request, Long actorId);

    GroupActionResponse removeGroupMember(Long courseId, Long groupId, Long groupMemberId, Long actorId);

    GroupActionResponse lockAllGroups(Long courseId, Long actorId);

    GroupActionResponse unlockGroups(Long courseId, Long actorId);

    GroupActionResponse addGroups(Long courseId, AddGroupsRequest request, Long actorId);

    GroupActionResponse updateMaxGroupSize(Long courseId, UpdateMaxGroupSizeRequest request, Long actorId);

    GroupActionResponse deleteGroup(Long courseId, Long groupId, Long actorId);
}

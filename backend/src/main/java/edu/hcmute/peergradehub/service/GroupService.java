package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.entity.Course;
import edu.hcmute.peergradehub.entity.GroupMember;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.entity.User;

public interface GroupService {
    StudentGroup createGroup(String groupName, Integer maxMembers, Course course);

    GroupMember joinGroup(StudentGroup group, User student);

    void removeMember(Long groupMemberId);
}

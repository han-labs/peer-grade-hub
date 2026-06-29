package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.dto.response.student.GroupSelectionResponse;
import edu.hcmute.peergradehub.dto.response.student.InvitationPreviewResponse;
import edu.hcmute.peergradehub.dto.response.student.JoinCourseResponse;
import edu.hcmute.peergradehub.dto.response.student.JoinGroupResponse;
import edu.hcmute.peergradehub.dto.response.student.LeaveGroupResponse;

public interface StudentParticipationFacade {
    InvitationPreviewResponse previewInvitation(String invitationCode, Long studentId);

    JoinCourseResponse joinCourse(String invitationCode, Long studentId);

    GroupSelectionResponse getGroupSelection(Long courseId, Long studentId);

    JoinGroupResponse joinGroup(Long courseId, Long groupId, Long studentId);

    LeaveGroupResponse leaveGroup(Long courseId, Long studentId);
}

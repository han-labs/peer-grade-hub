package edu.hcmute.peergradehub.dto.response.student;

public record InvitationPreviewResponse(
        Long courseId,
        String courseName,
        String classCode,
        String invitationCode,
        String description,
        String lecturerName,
        Boolean alreadyJoined
) {
}

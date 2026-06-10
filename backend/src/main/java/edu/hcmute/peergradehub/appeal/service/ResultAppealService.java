package edu.hcmute.peergradehub.appeal.service;

import edu.hcmute.peergradehub.appeal.model.AppealStatus;
import edu.hcmute.peergradehub.appeal.model.ResultAppeal;
import edu.hcmute.peergradehub.appeal.repository.ResultAppealRepository;
import edu.hcmute.peergradehub.group.repository.GroupMemberRepository;
import edu.hcmute.peergradehub.result.model.AssignmentResult;
import edu.hcmute.peergradehub.user.model.User;
import edu.hcmute.peergradehub.user.model.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResultAppealService {

    private final ResultAppealRepository resultAppealRepository;
    private final GroupMemberRepository groupMemberRepository;

    @Transactional
    public ResultAppeal submitAppeal(AssignmentResult result, User student, String content) {
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Appeal content cannot be empty.");
        }

        // Verify if student belongs to the group that owns the result
        boolean isGroupMember = groupMemberRepository.existsByGroupIdAndUserId(
                result.getGroup().getId(),
                student.getId()
        );
        if (!isGroupMember) {
            throw new IllegalArgumentException("Student does not belong to the group that received this grade.");
        }

        // Prevent duplicate appeals
        if (resultAppealRepository.existsByAssignmentResultId(result.getId())) {
            throw new IllegalArgumentException("An appeal has already been submitted for this result.");
        }

        ResultAppeal appeal = ResultAppeal.builder()
                .assignmentResult(result)
                .student(student)
                .content(content)
                .build();

        return resultAppealRepository.save(appeal);
    }

    @Transactional
    public ResultAppeal resolveAppeal(ResultAppeal appeal, User resolver, AppealStatus status, String resolutionNote) {
        if (resolver.getUserRole() != UserRole.LECTURER) {
            throw new IllegalArgumentException("Only lecturers can resolve grade appeals.");
        }
        
        User courseLecturer = appeal.getAssignmentResult().getAssignment().getLesson().getCourse().getLecturer();
        if (resolver.getId() == null || !resolver.getId().equals(courseLecturer.getId())) {
            throw new IllegalArgumentException("Only the lecturer who owns/manages the course can resolve this appeal.");
        }

        if (status == AppealStatus.PENDING) {
            throw new IllegalArgumentException("Cannot resolve an appeal with PENDING status.");
        }

        appeal.setAppealStatus(status);
        appeal.setResolutionNote(resolutionNote);
        appeal.setResolvedAt(LocalDateTime.now());
        appeal.setResolvedBy(resolver);

        return resultAppealRepository.save(appeal);
    }
}

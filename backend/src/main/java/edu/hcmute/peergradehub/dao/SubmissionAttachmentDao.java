package edu.hcmute.peergradehub.dao;

import edu.hcmute.peergradehub.entity.SubmissionAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionAttachmentDao extends JpaRepository<SubmissionAttachment, Long> {
    List<SubmissionAttachment> findByAssignmentSubmissionId(Long assignmentSubmissionId);
}

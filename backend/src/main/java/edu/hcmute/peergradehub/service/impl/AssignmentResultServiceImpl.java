package edu.hcmute.peergradehub.service.impl;

import edu.hcmute.peergradehub.dao.AssignmentResultDao;
import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.StudentGroup;
import edu.hcmute.peergradehub.entity.AssignmentResult;
import edu.hcmute.peergradehub.service.AssignmentResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssignmentResultServiceImpl implements AssignmentResultService {

    private final AssignmentResultDao assignmentResultRepository;

    @Override
    @Transactional
    public AssignmentResult saveResult(Assignment assignment, StudentGroup group, BigDecimal score, String finalComment) {
        if (score == null || score.compareTo(BigDecimal.ZERO) < 0 || score.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Score must be between 0 and 100.");
        }

        Optional<AssignmentResult> existingResultOpt = assignmentResultRepository
                .findByAssignmentIdAndGroupId(assignment.getId(), group.getId());

        AssignmentResult result;
        if (existingResultOpt.isPresent()) {
            result = existingResultOpt.get();
            result.setScore(score);
            result.setFinalComment(finalComment);
        } else {
            result = AssignmentResult.builder()
                    .assignment(assignment)
                    .group(group)
                    .score(score)
                    .finalComment(finalComment)
                    .build();
        }

        return assignmentResultRepository.save(result);
    }
}

package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.entity.Assignment;
import edu.hcmute.peergradehub.entity.AssignmentResult;
import edu.hcmute.peergradehub.entity.StudentGroup;

import java.math.BigDecimal;

public interface AssignmentResultService {
    AssignmentResult saveResult(Assignment assignment, StudentGroup group, BigDecimal score, String comments);
}

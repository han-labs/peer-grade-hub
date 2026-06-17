package edu.hcmute.peergradehub.service;

import edu.hcmute.peergradehub.entity.AssignmentResult;
import edu.hcmute.peergradehub.entity.ResultAppeal;
import edu.hcmute.peergradehub.entity.User;
import edu.hcmute.peergradehub.enumeration.AppealStatus;

public interface ResultAppealService {
    ResultAppeal submitAppeal(AssignmentResult result, User student, String content);

    ResultAppeal resolveAppeal(ResultAppeal appeal, User resolver, AppealStatus status, String resolutionNote);
}

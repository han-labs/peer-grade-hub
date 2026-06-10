package edu.hcmute.peergradehub.group.repository;

import edu.hcmute.peergradehub.group.model.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    List<GroupMember> findByGroupId(Long groupId);
    long countByGroupId(Long groupId);
    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    @Query("SELECT COUNT(gm) > 0 FROM GroupMember gm WHERE gm.group.course.id = :courseId AND gm.user.id = :userId")
    boolean existsByCourseIdAndUserId(@Param("courseId") Long courseId, @Param("userId") Long userId);
}

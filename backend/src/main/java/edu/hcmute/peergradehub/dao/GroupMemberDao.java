package edu.hcmute.peergradehub.dao;

import edu.hcmute.peergradehub.entity.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberDao extends JpaRepository<GroupMember, Long> {
    List<GroupMember> findByGroupId(Long groupId);
    long countByGroupId(Long groupId);
    boolean existsByGroupIdAndUserId(Long groupId, Long userId);
    List<GroupMember> findByGroupIdIn(List<Long> groupIds);
    Optional<GroupMember> findByIdAndGroupId(Long id, Long groupId);

    @Query("SELECT COUNT(gm) > 0 FROM GroupMember gm WHERE gm.group.course.id = :courseId AND gm.user.id = :userId")
    boolean existsByCourseIdAndUserId(@Param("courseId") Long courseId, @Param("userId") Long userId);
}

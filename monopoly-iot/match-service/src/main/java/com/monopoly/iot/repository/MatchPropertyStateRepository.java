package com.monopoly.iot.repository;

import com.monopoly.iot.model.MatchPropertyState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MatchPropertyStateRepository extends JpaRepository<MatchPropertyState, Long> {
    java.util.List<MatchPropertyState> findByMatchId(Long matchId);
    MatchPropertyState findByMatchIdAndPropertyId(Long matchId, Long propertyId);

    @Modifying
    @Query("DELETE FROM MatchPropertyState s WHERE s.matchId = :matchId")
    void deleteByMatchId(@Param("matchId") Long matchId);
}


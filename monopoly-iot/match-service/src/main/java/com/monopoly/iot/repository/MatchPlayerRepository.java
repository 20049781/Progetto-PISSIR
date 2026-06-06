package com.monopoly.iot.repository;

import com.monopoly.iot.model.MatchPlayer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MatchPlayerRepository extends JpaRepository<MatchPlayer, Long> {
    java.util.List<MatchPlayer> findByMatchId(Long matchId);
    java.util.List<MatchPlayer> findByUserId(Long userId);
    MatchPlayer findByMatchIdAndPlayerOrder(Long matchId, Integer playerOrder);

    @Modifying
    @Query("DELETE FROM MatchPlayer p WHERE p.matchId = :matchId")
    void deleteByMatchId(@Param("matchId") Long matchId);
}


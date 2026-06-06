package com.monopoly.iot.repository;

import com.monopoly.iot.model.SensorEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SensorEventRepository extends JpaRepository<SensorEvent, Long> {
    @Modifying
    @Query("DELETE FROM SensorEvent e WHERE e.matchId = :matchId")
    void deleteByMatchId(@Param("matchId") Long matchId);
}


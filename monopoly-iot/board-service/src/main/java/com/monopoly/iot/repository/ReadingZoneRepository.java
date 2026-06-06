package com.monopoly.iot.repository;

import com.monopoly.iot.model.ReadingZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReadingZoneRepository extends JpaRepository<ReadingZone, Long> {

    @Modifying
    @Query("DELETE FROM ReadingZone z WHERE z.gameTableId = :gameTableId")
    void deleteByGameTableId(@Param("gameTableId") Long gameTableId);
}


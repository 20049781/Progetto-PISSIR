package com.monopoly.iot.repository;

import com.monopoly.iot.model.SensorEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SensorEventRepository extends JpaRepository<SensorEvent, Long> {
    List<SensorEvent> findByMatchIdAndZoneIdAndTaggedObjectIdAndDetectedAt(Long matchId, Long zoneId, Long taggedObjectId, String detectedAt);
}

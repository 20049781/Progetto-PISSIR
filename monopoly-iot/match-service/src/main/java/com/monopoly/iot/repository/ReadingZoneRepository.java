package com.monopoly.iot.repository;

import com.monopoly.iot.model.ReadingZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReadingZoneRepository extends JpaRepository<ReadingZone, Long> {
}

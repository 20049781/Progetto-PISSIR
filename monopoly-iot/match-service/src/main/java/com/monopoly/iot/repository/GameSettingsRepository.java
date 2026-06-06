package com.monopoly.iot.repository;

import com.monopoly.iot.model.GameSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GameSettingsRepository extends JpaRepository<GameSettings, Long> {
}

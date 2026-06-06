package com.monopoly.iot.repository;

import com.monopoly.iot.model.GameTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GameTableRepository extends JpaRepository<GameTable, Long> {
}

package com.monopoly.iot.repository;

import com.monopoly.iot.model.MonopolyProperty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MonopolyPropertyRepository extends JpaRepository<MonopolyProperty, Long> {
    MonopolyProperty findByPropertyCode(String propertyCode);
}

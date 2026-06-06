package com.monopoly.iot.repository;

import com.monopoly.iot.model.TaggedObject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaggedObjectRepository extends JpaRepository<TaggedObject, Long> {
}

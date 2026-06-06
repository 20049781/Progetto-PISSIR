package com.monopoly.iot.controller;

import com.monopoly.iot.model.ReadingZone;
import com.monopoly.iot.repository.ReadingZoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/reading-zones")
public class ReadingZoneController {

    @Autowired
    private ReadingZoneRepository repository;

    @GetMapping
    public List<ReadingZone> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReadingZone> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

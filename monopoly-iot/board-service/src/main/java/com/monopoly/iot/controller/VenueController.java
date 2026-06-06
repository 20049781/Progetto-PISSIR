package com.monopoly.iot.controller;

import com.monopoly.iot.model.Venue;
import com.monopoly.iot.repository.VenueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/venues")
public class VenueController {

    @Autowired
    private VenueRepository repository;

    @Autowired
    private com.monopoly.iot.repository.GameTableRepository gameTableRepository;

    @GetMapping
    public List<Venue> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Venue> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Venue create(@RequestBody Venue entity) {
        return repository.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Venue> update(@PathVariable Long id, @RequestBody Venue details) {
        return repository.findById(id).map(existing -> {
            return ResponseEntity.ok(repository.save(details));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return repository.findById(id).map(existing -> {
            repository.delete(existing);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/list")
    public ResponseEntity<List<java.util.Map<String, Object>>> getAllVenuesWithBoards() {
        List<com.monopoly.iot.model.Venue> venues = repository.findAll();
        List<com.monopoly.iot.model.GameTable> allTables = gameTableRepository.findAll();
        
        List<java.util.Map<String, Object>> response = new java.util.ArrayList<>();
        
        for (com.monopoly.iot.model.Venue v : venues) {
            java.util.Map<String, Object> venueMap = new java.util.HashMap<>();
            venueMap.put("id", v.getId());
            venueMap.put("name", v.getName());
            venueMap.put("city", v.getCity());
            venueMap.put("location", v.getLocation() != null ? v.getLocation() : v.getCity());
            
            List<java.util.Map<String, Object>> tables = new java.util.ArrayList<>();
            for (com.monopoly.iot.model.GameTable t : allTables) {
                if (t.getVenueId() != null && t.getVenueId().equals(v.getId())) {
                    java.util.Map<String, Object> tMap = new java.util.HashMap<>();
                    tMap.put("id", t.getId());
                    tMap.put("code", t.getTableCode());
                    tMap.put("name", t.getDisplayName());
                    tMap.put("status", t.getStatus());
                    tables.add(tMap);
                }
            }
            venueMap.put("tables", tables);
            response.add(venueMap);
        }
        
        return ResponseEntity.ok(response);
    }
}

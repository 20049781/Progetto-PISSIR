package com.monopoly.iot.controller;

import com.monopoly.iot.model.GameTable;
import com.monopoly.iot.repository.GameTableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gametables")
public class GameTableController {

    @Autowired
    private GameTableRepository repository;

    @GetMapping
    public List<GameTable> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<GameTable> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Autowired
    private com.monopoly.iot.repository.ReadingZoneRepository readingZoneRepository;

    @PostMapping
    public GameTable create(@RequestBody GameTable entity) {
        GameTable savedTable = repository.save(entity);
        
        // Inizializzazione automatica sensori per il nuovo tavolo clonando il template standard (Tavolo 1)
        try {
            List<com.monopoly.iot.model.ReadingZone> templates = readingZoneRepository.findAll();
            for (com.monopoly.iot.model.ReadingZone t : templates) {
                if (t.getGameTableId() != null && t.getGameTableId().equals(1L)) {
                    com.monopoly.iot.model.ReadingZone newZone = new com.monopoly.iot.model.ReadingZone();
                    newZone.setGameTableId(savedTable.getId());
                    newZone.setZoneName(t.getZoneName());
                    newZone.setZoneType(t.getZoneType());
                    newZone.setPlayerSlot(t.getPlayerSlot());
                    
                    // Sostituisce '1-' o 'TBL1-' o aggiunge il prefisso '<nuovoId>-' nel codice sensore hardware
                    String originalCode = t.getZoneCode();
                    String newCode = originalCode;
                    if (originalCode != null) {
                        if (originalCode.startsWith("1-")) {
                            newCode = savedTable.getId() + "-" + originalCode.substring(2);
                        } else if (originalCode.startsWith("TBL1-")) {
                            newCode = savedTable.getId() + "-" + originalCode.substring(5);
                        } else {
                            newCode = savedTable.getId() + "-" + originalCode;
                        }
                    }
                    newZone.setZoneCode(newCode);
                    
                    readingZoneRepository.save(newZone);
                }
            }
        } catch (Exception e) {
            System.err.println("Errore nell'inizializzazione automatica dei sensori per il tavolo " + savedTable.getId() + ": " + e.getMessage());
        }
        
        return savedTable;
    }

    @PutMapping("/{id}")
    public ResponseEntity<GameTable> update(@PathVariable Long id, @RequestBody GameTable details) {
        return repository.findById(id).map(existing -> {
            return ResponseEntity.ok(repository.save(details));
        }).orElse(ResponseEntity.notFound().build());
    }


}

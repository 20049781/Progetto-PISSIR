package com.monopoly.iot.controller;

import com.monopoly.iot.model.GameSettings;
import com.monopoly.iot.repository.GameSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/game-settings")
public class GameSettingsController {

    @Autowired
    private GameSettingsRepository repository;

    @GetMapping
    public GameSettings getSettings() {
        List<GameSettings> list = repository.findAll();
        if (list.isEmpty()) {
            GameSettings defaultSettings = new GameSettings();
            return repository.save(defaultSettings);
        }
        return list.get(0);
    }

    @PutMapping
    public GameSettings updateSettings(@RequestBody GameSettings details) {
        List<GameSettings> list = repository.findAll();
        GameSettings settings;
        if (list.isEmpty()) {
            settings = new GameSettings();
        } else {
            settings = list.get(0);
        }

        settings.setInitialBalance(details.getInitialBalance() != null ? details.getInitialBalance() : 1500);
        settings.setMaxPlayers(details.getMaxPlayers() != null ? details.getMaxPlayers() : 4);
        settings.setSensorModeActive(details.getSensorModeActive() != null ? details.getSensorModeActive() : true);

        return repository.save(settings);
    }
}

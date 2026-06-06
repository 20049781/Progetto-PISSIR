package com.monopoly.iot.controller;

import com.monopoly.iot.model.Match;
import com.monopoly.iot.repository.MatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/matches")
public class MatchController {

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @GetMapping
    public List<Match> getAllMatches() {
        return matchRepository.findAll();
    }

    @PostMapping("/start")
    public ResponseEntity<?> startMatch(@RequestBody Match match) {
        if (match.getId() != null) {
            java.util.List<com.monopoly.iot.model.MatchPlayer> players = matchPlayerRepository.findByMatchId(match.getId());
            if (players.size() < 2) {
                return ResponseEntity.badRequest().body("Impossibile avviare la partita: sono necessari almeno 2 giocatori.");
            }
        }
        match.setStatus("STARTED");
        match.setStartTime(java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(matchRepository.save(match));
    }

    @PostMapping("/{id}/pause")
    public ResponseEntity<Match> pauseMatch(@PathVariable Long id) {
        return matchRepository.findById(id).map(match -> {
            match.setStatus("PAUSED");
            return ResponseEntity.ok(matchRepository.save(match));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/start-match")
    public ResponseEntity<String> startMatchById(@PathVariable Long id) {
        return matchRepository.findById(id).map(match -> {
            if (!"CREATED".equals(match.getStatus()) && !"PAUSED".equals(match.getStatus())) {
                return ResponseEntity.badRequest().body("La partita non è in stato valido per essere avviata.");
            }
            java.util.List<com.monopoly.iot.model.MatchPlayer> players = matchPlayerRepository.findByMatchId(id);
            if (players.size() < 2) {
                return ResponseEntity.badRequest().body("Impossibile avviare la partita: sono necessari almeno 2 giocatori.");
            }
            match.setStatus("STARTED");
            match.setStartTime(java.time.LocalDateTime.now().toString());
            // Imposta il primo turno al giocatore con playerOrder = 1
            if (!players.isEmpty()) {
                Long firstPlayerId = players.get(0).getId();
                for (com.monopoly.iot.model.MatchPlayer p : players) {
                    if (p.getPlayerOrder() != null && p.getPlayerOrder() == 1) {
                        firstPlayerId = p.getId();
                        break;
                    }
                }
                match.setCurrentTurnPlayerId(firstPlayerId);
            }
            matchRepository.save(match);
            return ResponseEntity.ok("Partita #" + id + " avviata con successo!");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<Match> endMatch(@PathVariable Long id) {
        return matchRepository.findById(id).map(match -> {
            match.setStatus("FINISHED");
            match.setEndTime(java.time.LocalDateTime.now().toString());
            if (match.getStartTime() == null) {
                match.setStartTime(java.time.LocalDateTime.now().minusHours(1).toString());
            }
            List<com.monopoly.iot.model.MatchPlayer> players = matchPlayerRepository.findByMatchId(id);
            
            java.util.Map<Long, Integer> propertyPrices = new java.util.HashMap<>();
            for (com.monopoly.iot.model.MonopolyProperty prop : monopolyPropertyRepository.findAll()) {
                propertyPrices.put(prop.getId(), prop.getPurchasePrice() != null ? prop.getPurchasePrice() : 0);
            }

            java.util.List<com.monopoly.iot.model.MatchPropertyState> matchProperties = matchPropertyStateRepository.findByMatchId(id);
            java.util.Map<Long, Integer> playerPropertiesValue = new java.util.HashMap<>();
            for (com.monopoly.iot.model.MatchPropertyState state : matchProperties) {
                if (state.getOwnerMatchPlayerId() != null) {
                    int price = propertyPrices.getOrDefault(state.getPropertyId(), 0);
                    playerPropertiesValue.put(
                        state.getOwnerMatchPlayerId(),
                        playerPropertiesValue.getOrDefault(state.getOwnerMatchPlayerId(), 0) + price
                    );
                }
            }

            Long winnerId = null;
            int maxNetWorth = -1;
            for(com.monopoly.iot.model.MatchPlayer p : players) {
                if (p.getBankrupt() == null || p.getBankrupt() == 0) {
                    int netWorth = (p.getCurrentBalance() != null ? p.getCurrentBalance() : 0) + playerPropertiesValue.getOrDefault(p.getId(), 0);
                    if (netWorth > maxNetWorth) {
                        maxNetWorth = netWorth;
                        winnerId = p.getUserId();
                    }
                }
            }
            if (winnerId != null) {
                match.setWinnerPlayerId(winnerId);
            }
            
            for(com.monopoly.iot.model.MatchPlayer p : players) {
                if (p.getUserId() == null) continue;
                int won = p.getUserId().equals(winnerId) ? 1 : 0;
                int netWorth = (p.getCurrentBalance() != null ? p.getCurrentBalance() : 0) + playerPropertiesValue.getOrDefault(p.getId(), 0);
                int earn = netWorth;
                String now = java.time.LocalDateTime.now().toString();
                
                int updated = jdbcTemplate.update(
                    "UPDATE player_statistics SET matches_played = matches_played + 1, " +
                     "matches_won = matches_won + ?, total_earnings = total_earnings + ?, " +
                     "last_updated_at = ? WHERE user_id = ?",
                    won, earn, now, p.getUserId());
                    
                if (updated == 0) {
                    jdbcTemplate.update(
                        "INSERT INTO player_statistics (user_id, matches_played, matches_won, total_earnings, total_spent, tournaments_played, tournaments_won, last_updated_at) " +
                        "VALUES (?, 1, ?, ?, 0, 0, 0, ?)",
                        p.getUserId(), won, earn, now);
                }
            }
            
            if (match.getGameTableId() != null) {
                String now = java.time.LocalDateTime.now().toString();
                int updated = jdbcTemplate.update(
                    "UPDATE game_table_statistics SET matches_played = matches_played + 1, last_updated_at = ? WHERE game_table_id = ?",
                    now, match.getGameTableId());
                if (updated == 0) {
                    jdbcTemplate.update(
                        "INSERT INTO game_table_statistics (game_table_id, matches_played, total_events, last_updated_at) VALUES (?, 1, 0, ?)",
                        match.getGameTableId(), now);
                }
                
                try {
                    Long venueId = jdbcTemplate.queryForObject("SELECT venue_id FROM game_tables WHERE id = ?", Long.class, match.getGameTableId());
                    if (venueId != null) {
                        int vup = jdbcTemplate.update(
                            "UPDATE venue_statistics SET matches_hosted = matches_hosted + 1, last_updated_at = ? WHERE venue_id = ?",
                            now, venueId);
                        if (vup == 0) {
                            jdbcTemplate.update(
                                "INSERT INTO venue_statistics (venue_id, matches_hosted, tournaments_hosted, active_tables, last_updated_at) VALUES (?, 1, 0, 1, ?)",
                                venueId, now);
                        }
                    }
                } catch (org.springframework.dao.EmptyResultDataAccessException e) {
                    // Ignora se il tavolo non è associato ad alcuna sede
                }
            }
            
            return ResponseEntity.ok(matchRepository.save(match));
        }).orElse(ResponseEntity.notFound().build());
    }

    @org.springframework.transaction.annotation.Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMatch(@PathVariable Long id) {
        return matchRepository.findById(id).map(match -> {
            // Elimina gli eventi sensore associati
            sensorEventRepository.deleteByMatchId(id);
            // Elimina gli stati delle proprietà della partita
            matchPropertyStateRepository.deleteByMatchId(id);
            // Elimina i giocatori iscritti al match
            matchPlayerRepository.deleteByMatchId(id);
            // Elimina la partita
            matchRepository.delete(match);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @Autowired
    private com.monopoly.iot.service.GameEngineService gameEngineService;

    @Autowired
    private com.monopoly.iot.repository.SensorEventRepository sensorEventRepository;

    @Autowired
    private com.monopoly.iot.repository.MatchPlayerRepository matchPlayerRepository;

    @Autowired
    private com.monopoly.iot.repository.MatchPropertyStateRepository matchPropertyStateRepository;

    @Autowired
    private com.monopoly.iot.repository.MonopolyPropertyRepository monopolyPropertyRepository;

    @PutMapping("/{id}/schedule")
    public ResponseEntity<?> scheduleMatch(@PathVariable Long id, @RequestBody java.util.Map<String, Object> payload) {
        return matchRepository.findById(id).map(match -> {
            if (payload.containsKey("scheduledTime")) {
                match.setScheduledTime(payload.get("scheduledTime").toString());
            }
            if (payload.containsKey("gameTableId")) {
                match.setGameTableId(Long.valueOf(payload.get("gameTableId").toString()));
            }
            matchRepository.save(match);
            return ResponseEntity.ok(match);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/players")
    public List<com.monopoly.iot.model.MatchPlayer> getMatchPlayers(@PathVariable Long id) {
        return matchPlayerRepository.findByMatchId(id);
    }

    @GetMapping("/{id}/properties")
    public List<com.monopoly.iot.model.MatchPropertyState> getMatchProperties(@PathVariable Long id) {
        return matchPropertyStateRepository.findByMatchId(id);
    }

    @GetMapping("/{id}/events")
    public List<com.monopoly.iot.model.SensorEvent> getMatchEvents(@PathVariable Long id) {
        return sensorEventRepository.findAll().stream()
                .filter(e -> e.getMatchId().equals(id))
                .sorted((e1, e2) -> e2.getId().compareTo(e1.getId()))
                .limit(1000)
                .collect(java.util.stream.Collectors.toList());
    }

    @PostMapping("/simulate-event")
    public ResponseEntity<?> simulateSensorEvent(@RequestBody com.monopoly.iot.model.SensorEvent event) {
        try {
            if (event.getMatchId() == null) {
                return ResponseEntity.badRequest().body("matchId mancante");
            }

            Match match = matchRepository.findById(event.getMatchId()).orElse(null);
            if (match == null) {
                return ResponseEntity.badRequest().body("Partita #" + event.getMatchId() + " non trovata");
            }
            if (!"STARTED".equals(match.getStatus())) {
                return ResponseEntity.badRequest().body("La partita #" + event.getMatchId() + " non e' avviata");
            }

            event.setDetectedAt(java.time.LocalDateTime.now().toString());
            event.setProcessed(0);
            com.monopoly.iot.model.SensorEvent saved = sensorEventRepository.save(event);
            gameEngineService.processSensorEvent(saved);
            return ResponseEntity.ok(saved);
        } catch (Throwable t) {
            t.printStackTrace();
            return ResponseEntity.status(500).body("Error in game engine: " + t.getMessage() + "\n" + java.util.Arrays.toString(t.getStackTrace()));
        }
    }

    @Autowired
    private com.monopoly.iot.repository.GameTableRepository gameTableRepository;


    @Autowired
    private com.monopoly.iot.repository.GameSettingsRepository gameSettingsRepository;

    private com.monopoly.iot.model.GameSettings getActiveSettings() {
        java.util.List<com.monopoly.iot.model.GameSettings> list = gameSettingsRepository.findAll();
        if (list.isEmpty()) {
            com.monopoly.iot.model.GameSettings defaultSettings = new com.monopoly.iot.model.GameSettings();
            return gameSettingsRepository.save(defaultSettings);
        }
        return list.get(0);
    }

    @PostMapping("/create")
    public ResponseEntity<?> createMatch(@RequestBody Match matchDetails) {
        if (matchDetails.getGameTableId() == null) {
            return ResponseEntity.badRequest().body("ID Tavolo mancante");
        }
        
        com.monopoly.iot.model.GameSettings settings = getActiveSettings();
        Match match = new Match();
        match.setGameTableId(matchDetails.getGameTableId());
        match.setScheduledTime(matchDetails.getScheduledTime() != null ? matchDetails.getScheduledTime() : "Subito");
        match.setMaxPlayers(matchDetails.getMaxPlayers() != null ? matchDetails.getMaxPlayers() : settings.getMaxPlayers());
        match.setStatus("CREATED");
        
        Match saved = matchRepository.save(match);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/join")
    public ResponseEntity<String> joinMatch(@RequestBody java.util.Map<String, Long> payload) {
        Long userId = payload.get("userId");
        if (userId == null) return ResponseEntity.badRequest().body("userId missing");
        
        Long matchId = payload.get("matchId");
        Match targetMatch = null;
        com.monopoly.iot.model.GameSettings settings = getActiveSettings();
        
        if (matchId != null) {
            targetMatch = matchRepository.findById(matchId).orElse(null);
            if (targetMatch == null) {
                return ResponseEntity.badRequest().body("Match non trovato");
            }
            if (!"CREATED".equals(targetMatch.getStatus())) {
                return ResponseEntity.badRequest().body("La partita non è più in attesa di giocatori.");
            }
        } else {
            // Cerca le partite esistenti in stato CREATED (in attesa)
            List<Match> waitingMatches = matchRepository.findByStatus("CREATED");
            // Matchmaking semplice: cerca una partita con posti ancora disponibili
            if (!waitingMatches.isEmpty()) {
                targetMatch = waitingMatches.get(0);
            } else {
                // Crea una nuova partita se non ce ne sono in attesa
                List<com.monopoly.iot.model.GameTable> tables = gameTableRepository.findAll();
                if (tables.isEmpty()) return ResponseEntity.status(500).body("No game tables available");
                
                targetMatch = new Match();
                targetMatch.setGameTableId(tables.get(0).getId());
                targetMatch.setStatus("CREATED");
                targetMatch.setMaxPlayers(settings.getMaxPlayers());
                targetMatch.setScheduledTime("Subito");
                targetMatch.setCurrentTurnPlayerId(userId); // Temporaneo
                targetMatch = matchRepository.save(targetMatch);
            }
        }
        
        // Verifica se il giocatore è già iscritto a questa partita
        List<com.monopoly.iot.model.MatchPlayer> existingPlayers = matchPlayerRepository.findByMatchId(targetMatch.getId());
        for(com.monopoly.iot.model.MatchPlayer mp : existingPlayers) {
            if (mp.getUserId().equals(userId)) {
                return ResponseEntity.ok("Già iscritto alla Partita #" + targetMatch.getId());
            }
        }
        
        // Verifica se è stato raggiunto il numero massimo di giocatori
        int max = targetMatch.getMaxPlayers() != null ? targetMatch.getMaxPlayers() : settings.getMaxPlayers();
        if (existingPlayers.size() >= max) {
            return ResponseEntity.badRequest().body("La partita ha raggiunto il numero massimo di giocatori.");
        }
        
        // Crea il giocatore della partita
        com.monopoly.iot.model.MatchPlayer mp = new com.monopoly.iot.model.MatchPlayer();
        mp.setMatchId(targetMatch.getId());
        mp.setUserId(userId);
        mp.setPlayerOrder(existingPlayers.size() + 1);
        mp.setCurrentBalance(settings.getInitialBalance());
        mp.setInGame(1);
        mp.setBankrupt(0);
        com.monopoly.iot.model.MatchPlayer savedMp = matchPlayerRepository.save(mp);
        
        // NOTA: La partita non si avvia automaticamente al raggiungimento dei giocatori massimi.
        // Il gestore della sede deve avviarla manualmente tramite l'API /start-match.
        matchRepository.save(targetMatch);
        
        return ResponseEntity.ok("Iscritto con successo alla Partita #" + targetMatch.getId());
    }

    @PostMapping("/{id}/reset")
    public ResponseEntity<String> resetMatchWithId(@PathVariable Long id) {
        sensorEventRepository.findAll().stream()
                .filter(e -> e.getMatchId().equals(id))
                .forEach(e -> sensorEventRepository.delete(e));
        
        matchPropertyStateRepository.findByMatchId(id)
                .forEach(state -> matchPropertyStateRepository.delete(state));
        
        List<com.monopoly.iot.model.MatchPlayer> players = matchPlayerRepository.findByMatchId(id);
        players.forEach(p -> {
            p.setCurrentBalance(1500);
            p.setBankrupt(0);
            p.setInGame(1);
            matchPlayerRepository.save(p);
        });
        
        matchRepository.findById(id).ifPresent(match -> {
            Long firstPlayerId = players.isEmpty() ? null : players.get(0).getId();
            for (com.monopoly.iot.model.MatchPlayer p : players) {
                if (p.getPlayerOrder() == 1) {
                    firstPlayerId = p.getId();
                    break;
                }
            }
            match.setCurrentTurnPlayerId(firstPlayerId);
            match.setStatus("STARTED");
            match.setStartTime(java.time.LocalDateTime.now().toString());
            match.setEndTime(null);
            matchRepository.save(match);
        });
        
        return ResponseEntity.ok("Reset completed successfully for Match #" + id + "!");
    }

    @PostMapping("/reset")
    public ResponseEntity<String> resetMatch() {
        return resetMatchWithId(1L);
    }

    @PostMapping("/leave")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<String> leaveMatch(@RequestBody java.util.Map<String, Long> payload) {
        Long userId = payload.get("userId");
        if (userId == null) return ResponseEntity.badRequest().body("userId missing");
        
        Long matchId = payload.get("matchId");
        if (matchId == null) return ResponseEntity.badRequest().body("matchId missing");
        
        Match targetMatch = matchRepository.findById(matchId).orElse(null);
        if (targetMatch == null) {
            return ResponseEntity.badRequest().body("Match non trovato");
        }
        if (!"CREATED".equals(targetMatch.getStatus())) {
            return ResponseEntity.badRequest().body("Impossibile annullare l'iscrizione: la partita è già iniziata o terminata.");
        }
        
        List<com.monopoly.iot.model.MatchPlayer> matchPlayers = matchPlayerRepository.findByMatchId(matchId);
        com.monopoly.iot.model.MatchPlayer toRemove = null;
        for (com.monopoly.iot.model.MatchPlayer mp : matchPlayers) {
            if (mp.getUserId().equals(userId)) {
                toRemove = mp;
                break;
            }
        }
        
        if (toRemove == null) {
            return ResponseEntity.badRequest().body("Non sei iscritto a questa partita.");
        }
        
        matchPlayerRepository.delete(toRemove);
        
        // Riordina dinamicamente playerOrder per i giocatori rimanenti
        List<com.monopoly.iot.model.MatchPlayer> remaining = matchPlayerRepository.findByMatchId(matchId);
        int order = 1;
        for (com.monopoly.iot.model.MatchPlayer mp : remaining) {
            mp.setPlayerOrder(order++);
            matchPlayerRepository.save(mp);
        }
        
        return ResponseEntity.ok("Iscrizione annullata con successo!");
    }

    @PostMapping("/{id}/rotate-turn")
    public ResponseEntity<Match> rotateMatchTurn(@PathVariable Long id) {
        return matchRepository.findById(id).map(match -> {
            List<com.monopoly.iot.model.MatchPlayer> players = matchPlayerRepository.findByMatchId(id);
            if (players.size() <= 1) return ResponseEntity.ok(match);
            int currentIndex = -1;
            for (int i = 0; i < players.size(); i++) {
                if (players.get(i).getId().equals(match.getCurrentTurnPlayerId())) {
                    currentIndex = i;
                    break;
                }
            }
            
            int nextIndex = currentIndex;
            for (int k = 1; k <= players.size(); k++) {
                int testIndex = (currentIndex + k) % players.size();
                com.monopoly.iot.model.MatchPlayer nextPlayer = players.get(testIndex);
                if (nextPlayer.getBankrupt() == null || nextPlayer.getBankrupt() == 0) {
                    nextIndex = testIndex;
                    break;
                }
            }
            
            match.setCurrentTurnPlayerId(players.get(nextIndex).getId());
            return ResponseEntity.ok(matchRepository.save(match));
        }).orElse(ResponseEntity.notFound().build());
    }
}

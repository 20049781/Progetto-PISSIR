package com.monopoly.iot.controller;

import com.monopoly.iot.model.*;
import com.monopoly.iot.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/tournaments")
public class TournamentController {

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private TournamentPlayerRepository tournamentPlayerRepository;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private MatchPlayerRepository matchPlayerRepository;

    @Autowired
    private GameTableRepository gameTableRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public List<Tournament> getAllTournaments() {
        List<Tournament> list = tournamentRepository.findAll();
        List<Match> allMatches = matchRepository.findAll();
        for (Tournament t : list) {
            if ("ONGOING".equals(t.getStatus())) {
                List<Match> tMatches = allMatches.stream()
                        .filter(m -> t.getId().equals(m.getTournamentId()))
                        .toList();
                if (!tMatches.isEmpty()) {
                    boolean allFinished = tMatches.stream().allMatch(m -> "FINISHED".equals(m.getStatus()) || "CANCELLED".equals(m.getStatus()));
                    if (allFinished) {
                        t.setStatus("FINISHED");
                        t.setEndDate(java.time.LocalDateTime.now().toString());
                        tournamentRepository.save(t);
                    }
                }
            }
        }
        return list;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createTournament(@RequestBody Map<String, Object> payload) {
        try {
            String name = (String) payload.get("name");
            List<Integer> playerIds = (List<Integer>) payload.get("playerIds");
            Long venueId = payload.containsKey("venueId") ? Long.valueOf(payload.get("venueId").toString()) : null;

            if (name == null || playerIds == null || playerIds.size() < 2) {
                return ResponseEntity.badRequest().body("Nome o numero di giocatori non valido (min 2).");
            }

            Tournament t = new Tournament();
            t.setName(name);
            t.setGameTypeId(1L); // Tipo di gioco predefinito: Monopoly
            t.setStatus("ONGOING");
            t.setStartDate(java.time.LocalDateTime.now().toString());
            t.setCreatedAt(java.time.LocalDateTime.now().toString());
            t.setCreatedByUserId(1L); // Amministratore predefinito se non fornito
            Tournament savedT = tournamentRepository.save(t);

            if (venueId != null) {
                jdbcTemplate.update("INSERT INTO tournament_venues (tournament_id, venue_id) VALUES (?, ?)", savedT.getId(), venueId);
            }

            // Mescola i giocatori per formare gironi casuali
            List<Integer> shuffled = new ArrayList<>(playerIds);
            Collections.shuffle(shuffled);

            // Registra i giocatori al torneo
            for (Integer pid : shuffled) {
                TournamentPlayer tp = new TournamentPlayer();
                tp.setTournamentId(savedT.getId());
                tp.setUserId(Long.valueOf(pid));
                tp.setRegisteredAt(java.time.LocalDateTime.now().toString());
                tp.setPoints(0);
                tournamentPlayerRepository.save(tp);
            }

            // Trova i tavoli occupati (con partite in corso o create)
            List<Match> activeMatches = matchRepository.findAll().stream()
                    .filter(m -> "CREATED".equals(m.getStatus()) || "STARTED".equals(m.getStatus()))
                    .toList();
            Set<Long> busyTableIds = new HashSet<>();
            for (Match am : activeMatches) {
                if (am.getGameTableId() != null) {
                    busyTableIds.add(am.getGameTableId());
                }
            }

            List<GameTable> allTables = gameTableRepository.findAll();
            List<GameTable> freeTables = allTables.stream()
                    .filter(gt -> !busyTableIds.contains(gt.getId()))
                    .toList();

            int tableIndex = 0;

            // Genera il primo turno (gruppi di massimo 4 giocatori)
            int n = shuffled.size();
            int numGroups = (int) Math.ceil(n / 4.0);
            int baseSize = n / numGroups;
            int remainder = n % numGroups;

            int playerIndex = 0;
            for (int i = 0; i < numGroups; i++) {
                int currentGroupSize = baseSize + (i < remainder ? 1 : 0);
                
                Long assignedTableId;
                if (!freeTables.isEmpty()) {
                    assignedTableId = freeTables.get(tableIndex % freeTables.size()).getId();
                } else if (!allTables.isEmpty()) {
                    assignedTableId = allTables.get(tableIndex % allTables.size()).getId();
                } else {
                    assignedTableId = 1L;
                }

                Match m = new Match();
                m.setTournamentId(savedT.getId());
                m.setGameTableId(assignedTableId);
                m.setStatus("CREATED");
                m.setMaxPlayers(currentGroupSize);
                m.setScheduledTime(java.time.LocalDateTime.now().toString());
                Match savedMatch = matchRepository.save(m);

                for (int j = 0; j < currentGroupSize; j++) {
                    Long pId = Long.valueOf(shuffled.get(playerIndex++));
                    MatchPlayer mp = new MatchPlayer();
                    mp.setMatchId(savedMatch.getId());
                    mp.setUserId(pId);
                    mp.setPlayerOrder(j + 1);
                    mp.setCurrentBalance(1500);
                    mp.setInGame(1);
                    mp.setBankrupt(0);
                    matchPlayerRepository.save(mp);

                    if (j == 0) {
                        savedMatch.setCurrentTurnPlayerId(pId);
                        matchRepository.save(savedMatch);
                    }
                }

                tableIndex++;
            }

            return ResponseEntity.ok(savedT);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Errore interno: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/bracket")
    public ResponseEntity<?> getTournamentBracket(@PathVariable Long id) {
        List<Match> matches = matchRepository.findAll().stream()
                .filter(m -> id.equals(m.getTournamentId()))
                .toList();

        List<Map<String, Object>> bracket = new ArrayList<>();
        for (Match m : matches) {
            Map<String, Object> matchData = new HashMap<>();
            matchData.put("id", m.getId());
            matchData.put("status", m.getStatus());
            matchData.put("winnerId", m.getWinnerPlayerId());

            List<MatchPlayer> players = matchPlayerRepository.findByMatchId(m.getId());
            List<Map<String, Object>> pList = new ArrayList<>();
            for (MatchPlayer mp : players) {
                Map<String, Object> pData = new HashMap<>();
                pData.put("userId", mp.getUserId());
                pData.put("balance", mp.getCurrentBalance());
                pList.add(pData);
            }
            matchData.put("players", pList);
            bracket.add(matchData);
        }

        return ResponseEntity.ok(bracket);
    }

    @Autowired private SensorEventRepository sensorEventRepository;
    @Autowired private MatchPropertyStateRepository matchPropertyStateRepository;
    @Autowired private MonopolyPropertyRepository monopolyPropertyRepository;

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTournament(@PathVariable Long id) {
        return tournamentRepository.findById(id).map(tournament -> {
            // Trova tutte le partite per questo torneo
            List<Match> matches = matchRepository.findAll().stream()
                    .filter(m -> id.equals(m.getTournamentId()))
                    .toList();
            
            for (Match match : matches) {
                Long matchId = match.getId();
                // Elimina gli eventi sensore associati
                sensorEventRepository.findAll().stream()
                        .filter(e -> e.getMatchId().equals(matchId))
                        .forEach(e -> sensorEventRepository.delete(e));
                // Elimina gli stati delle proprietà
                matchPropertyStateRepository.findByMatchId(matchId)
                        .forEach(state -> matchPropertyStateRepository.delete(state));
                // Elimina i giocatori del match
                matchPlayerRepository.findByMatchId(matchId)
                        .forEach(p -> matchPlayerRepository.delete(p));
                // Elimina la partita stessa
                matchRepository.delete(match);
            }

            // Elimina i giocatori del torneo
            tournamentPlayerRepository.findAll().stream()
                    .filter(tp -> id.equals(tp.getTournamentId()))
                    .forEach(tp -> tournamentPlayerRepository.delete(tp));

            // Elimina i collegamenti torneo-sede
            jdbcTemplate.update("DELETE FROM tournament_venues WHERE tournament_id = ?", id);

            // Elimina infine il torneo
            tournamentRepository.delete(tournament);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/advance-round")
    public ResponseEntity<?> advanceRound(@PathVariable Long id) {
        return tournamentRepository.findById(id).map(tournament -> {
            List<Match> tournamentMatches = matchRepository.findAll().stream()
                    .filter(m -> id.equals(m.getTournamentId()))
                    .toList();

            List<Long> readyWinners = new ArrayList<>();
            for (Match m : tournamentMatches) {
                if ("FINISHED".equals(m.getStatus())) {
                    Long winnerId = m.getWinnerPlayerId();
                    
                    // Fallback: se la partita è FINISHED ma manca il winnerPlayerId, lo calcoliamo
                    if (winnerId == null) {
                        List<MatchPlayer> players = matchPlayerRepository.findByMatchId(m.getId());
                        
                        java.util.Map<Long, Integer> propertyPrices = new java.util.HashMap<>();
                        for (com.monopoly.iot.model.MonopolyProperty prop : monopolyPropertyRepository.findAll()) {
                            propertyPrices.put(prop.getId(), prop.getPurchasePrice() != null ? prop.getPurchasePrice() : 0);
                        }

                        java.util.List<com.monopoly.iot.model.MatchPropertyState> matchProperties = matchPropertyStateRepository.findByMatchId(m.getId());
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

                        int maxNetWorth = -1;
                        for(MatchPlayer p : players) {
                            if (p.getBankrupt() == null || p.getBankrupt() == 0) {
                                int netWorth = (p.getCurrentBalance() != null ? p.getCurrentBalance() : 0) + playerPropertiesValue.getOrDefault(p.getId(), 0);
                                if (netWorth > maxNetWorth) {
                                    maxNetWorth = netWorth;
                                    winnerId = p.getUserId();
                                }
                            }
                        }
                        if (winnerId != null) {
                            m.setWinnerPlayerId(winnerId);
                            matchRepository.save(m);
                        }
                    }

                    if (winnerId != null) {
                        boolean alreadyAdvanced = false;
                        final Long finalWinnerId = winnerId;
                        for (Match laterMatch : tournamentMatches) {
                            if (laterMatch.getId() > m.getId()) {
                                List<MatchPlayer> laterPlayers = matchPlayerRepository.findByMatchId(laterMatch.getId());
                                if (laterPlayers.stream().anyMatch(mp -> finalWinnerId.equals(mp.getUserId()))) {
                                    alreadyAdvanced = true;
                                    break;
                                }
                            }
                        }
                        if (!alreadyAdvanced) {
                        readyWinners.add(winnerId);
                    }
                    }
                }
            }

            if (readyWinners.size() < 2) {
                return ResponseEntity.badRequest().body("Non ci sono abbastanza vincitori pronti per generare un nuovo match.");
            }
            Collections.shuffle(readyWinners);
            
            // Trova i tavoli occupati (con partite in corso o create)
            List<Match> activeMatches = matchRepository.findAll().stream()
                    .filter(m -> "CREATED".equals(m.getStatus()) || "STARTED".equals(m.getStatus()))
                    .toList();
            Set<Long> busyTableIds = new HashSet<>();
            for (Match am : activeMatches) {
                if (am.getGameTableId() != null) {
                    busyTableIds.add(am.getGameTableId());
                }
            }

            List<GameTable> allTables = gameTableRepository.findAll();
            List<GameTable> freeTables = allTables.stream()
                    .filter(t -> !busyTableIds.contains(t.getId()))
                    .toList();

            int tableIndex = 0;
            int matchesCreated = 0;
 
            int n = readyWinners.size();
            int numGroups = (int) Math.ceil(n / 4.0);
            int baseSize = n / numGroups;
            int remainder = n % numGroups;
            
            int playerIndex = 0;
            for (int i = 0; i < numGroups; i++) {
                int currentGroupSize = baseSize + (i < remainder ? 1 : 0);
                
                Long assignedTableId;
                if (!freeTables.isEmpty()) {
                    assignedTableId = freeTables.get(tableIndex % freeTables.size()).getId();
                } else if (!allTables.isEmpty()) {
                    assignedTableId = allTables.get(tableIndex % allTables.size()).getId();
                } else {
                    assignedTableId = 1L;
                }
 
                Match newM = new Match();
                newM.setTournamentId(id);
                newM.setGameTableId(assignedTableId);
                newM.setStatus("CREATED");
                newM.setMaxPlayers(currentGroupSize);
                newM.setScheduledTime(java.time.LocalDateTime.now().plusDays(1).toString()); // Valore predefinito: domani
                Match savedM = matchRepository.save(newM);
                
                for (int j = 0; j < currentGroupSize; j++) {
                    Long pId = readyWinners.get(playerIndex++);
                    MatchPlayer mp = new MatchPlayer();
                    mp.setMatchId(savedM.getId());
                    mp.setUserId(pId);
                    mp.setPlayerOrder(j + 1);
                    mp.setCurrentBalance(1500);
                    mp.setInGame(1);
                    mp.setBankrupt(0);
                    matchPlayerRepository.save(mp);
                }
 
                tableIndex++;
                matchesCreated++;
            }

            return ResponseEntity.ok(Collections.singletonMap("matchesCreated", matchesCreated));
        }).orElse(ResponseEntity.notFound().build());
    }
}

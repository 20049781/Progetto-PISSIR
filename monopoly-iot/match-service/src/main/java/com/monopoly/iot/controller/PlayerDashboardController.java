package com.monopoly.iot.controller;

import com.monopoly.iot.model.*;
import com.monopoly.iot.dto.*;
import com.monopoly.iot.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/users")
public class PlayerDashboardController {

    @Autowired
    private MatchPlayerRepository matchPlayerRepository;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private GameTableRepository gameTableRepository;

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private TournamentPlayerRepository tournamentPlayerRepository;

    @Autowired
    private MatchPropertyStateRepository matchPropertyStateRepository;

    @Autowired
    private MonopolyPropertyRepository monopolyPropertyRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/{id}/dashboard")
    public ResponseEntity<PlayerDashboardDTO> getPlayerDashboard(@PathVariable Long id) {
        // Recupera il profilo utente da user-service (Porta 8081)
        User user;
        try {
            user = restTemplate.getForObject("http://localhost:8081/api/users/" + id, User.class);
        } catch (Exception e) {
            user = new User();
            user.setId(id);
            user.setUsername("Giocatore " + id);
            user.setWantsTournament(false);
        }

        PlayerDashboardDTO dto = new PlayerDashboardDTO();
        dto.setUsername(user.getUsername());
        dto.setWantsTournament(user.getWantsTournament() != null ? user.getWantsTournament() : false);
        
        List<MatchPlayer> playedMatches = matchPlayerRepository.findByUserId(id);
        dto.setTotalMatches(playedMatches.size());
        
        int wins = 0;
        int totalBalance = 0;
        List<MatchHistoryDTO> history = new ArrayList<>();
        
        for (MatchPlayer mp : playedMatches) {
            totalBalance += (mp.getCurrentBalance() != null ? mp.getCurrentBalance() : 0);
            
            Match match = matchRepository.findById(mp.getMatchId()).orElse(null);
            boolean isVictory = false;
            if (match != null && "FINISHED".equals(match.getStatus())) {
                if (mp.getBankrupt() == null || mp.getBankrupt() == 0) {
                    isVictory = true;
                    wins++;
                }
            }
            
            MatchHistoryDTO hDto = new MatchHistoryDTO();
            hDto.setId("#" + mp.getMatchId());
            hDto.setName(match != null ? "Tavolo " + match.getGameTableId() : "Partita Sconosciuta");
            
            String duration = "N/D";
            if (match != null && match.getStartTime() != null) {
                try {
                    java.time.LocalDateTime start = java.time.LocalDateTime.parse(match.getStartTime());
                    java.time.LocalDateTime end = match.getEndTime() != null
                        ? java.time.LocalDateTime.parse(match.getEndTime())
                        : java.time.LocalDateTime.now();
                    long minutes = java.time.Duration.between(start, end).toMinutes();
                    if (minutes < 60) {
                        duration = minutes + " min";
                    } else {
                        long hours = minutes / 60;
                        long mins = minutes % 60;
                        duration = hours + "h " + mins + "m";
                    }
                } catch (Exception e) {
                    duration = "N/D";
                }
            }
            hDto.setDuration(duration);
            hDto.setRevenue((mp.getCurrentBalance() != null && mp.getCurrentBalance() > 1500 ? "+" : "") + "M " + (mp.getCurrentBalance() != null ? mp.getCurrentBalance() : 0));
            if (match != null && "CREATED".equals(match.getStatus())) {
                hDto.setOutcome("In Attesa");
            } else if (match != null && "STARTED".equals(match.getStatus())) {
                hDto.setOutcome("In Corso");
            } else {
                hDto.setOutcome(isVictory ? "Vittoria" : "Sconfitta");
            }
            hDto.setVictory(isVictory);
            history.add(hDto);
        }
        
        double winRate = playedMatches.size() > 0 ? ((double) wins / playedMatches.size()) * 100 : 0.0;
        dto.setWinLossRatio(Math.round(winRate * 10.0) / 10.0);
        
        double avg = playedMatches.size() > 0 ? (double) totalBalance / playedMatches.size() : 0.0;
        dto.setAvgBalance("₮ " + Math.round(avg));
        
        // Ranking confrontando tutti i punteggi utenti da user-service
        List<User> allUsers;
        try {
            User[] usersArr = restTemplate.getForObject("http://localhost:8081/api/users", User[].class);
            allUsers = usersArr != null ? Arrays.asList(usersArr) : new ArrayList<>();
        } catch (Exception e) {
            allUsers = new ArrayList<>();
            allUsers.add(user);
        }

        Map<Long, Integer> userScores = new HashMap<>();
        Map<Long, Integer> propertyPrices = new HashMap<>();
        for (MonopolyProperty prop : monopolyPropertyRepository.findAll()) {
            propertyPrices.put(prop.getId(), prop.getPurchasePrice() != null ? prop.getPurchasePrice() : 0);
        }

        for (User u : allUsers) {
            int score = 0;
            List<MatchPlayer> uPlayed = matchPlayerRepository.findByUserId(u.getId());
            for (MatchPlayer mp : uPlayed) {
                Match m = matchRepository.findById(mp.getMatchId()).orElse(null);
                if (m != null && "FINISHED".equals(m.getStatus())) {
                    List<MatchPlayer> matchParticipants = matchPlayerRepository.findByMatchId(m.getId());
                    List<MatchPropertyState> matchProperties = matchPropertyStateRepository.findByMatchId(m.getId());
                    Map<Long, Integer> playerPropertiesValue = new HashMap<>();
                    for (MatchPropertyState state : matchProperties) {
                        if (state.getOwnerMatchPlayerId() != null) {
                            int price = propertyPrices.getOrDefault(state.getPropertyId(), 0);
                            playerPropertiesValue.put(
                                state.getOwnerMatchPlayerId(),
                                playerPropertiesValue.getOrDefault(state.getOwnerMatchPlayerId(), 0) + price
                            );
                        }
                    }

                    matchParticipants.sort((p1, p2) -> {
                        int b1 = p1.getBankrupt() != null ? p1.getBankrupt() : 0;
                        int b2 = p2.getBankrupt() != null ? p2.getBankrupt() : 0;
                        if (b1 != b2) {
                            return Integer.compare(b1, b2);
                        }
                        int net1 = (p1.getCurrentBalance() != null ? p1.getCurrentBalance() : 0) + playerPropertiesValue.getOrDefault(p1.getId(), 0);
                        int net2 = (p2.getCurrentBalance() != null ? p2.getCurrentBalance() : 0) + playerPropertiesValue.getOrDefault(p2.getId(), 0);
                        return Integer.compare(net2, net1);
                    });
                    
                    int position = 1;
                    for (int i = 0; i < matchParticipants.size(); i++) {
                        if (matchParticipants.get(i).getUserId().equals(u.getId())) {
                            position = i + 1;
                            break;
                        }
                    }
                    
                    int positionPoints = 0;
                    if (position == 1) positionPoints = 1000;
                    else if (position == 2) positionPoints = 500;
                    else if (position == 3) positionPoints = 300;
                    else if (position == 4) positionPoints = 200;
                    else if (position == 5) positionPoints = 100;
                    else positionPoints = 50;
                    
                    score += positionPoints;
                    score += (mp.getCurrentBalance() != null ? mp.getCurrentBalance() : 0);
                    score += playerPropertiesValue.getOrDefault(mp.getId(), 0);
                }
            }
            userScores.put(u.getId(), score);
        }

        List<Map.Entry<Long, Integer>> sortedUsers = new ArrayList<>(userScores.entrySet());
        sortedUsers.sort((e1, e2) -> e2.getValue().compareTo(e1.getValue()));

        int rankPosition = 1;
        for (int i = 0; i < sortedUsers.size(); i++) {
            if (sortedUsers.get(i).getKey().equals(id)) {
                rankPosition = i + 1;
                break;
            }
        }
        dto.setRanking(rankPosition);
        
        String tierLabel = "Esordiente (Tier C)";
        if (rankPosition == 1) {
            tierLabel = "Leggenda (Tier S+)";
        } else if (rankPosition <= 3) {
            tierLabel = "Campione (Tier A)";
        } else if (rankPosition <= 10) {
            tierLabel = "Professionista (Tier B)";
        }
        dto.setTier(tierLabel);
        
        double percentile = allUsers.size() > 0 ? ((double) rankPosition / allUsers.size()) * 100 : 100.0;
        String topPercentileLabel;
        if (percentile <= 10) {
            topPercentileLabel = "Top 10%";
        } else if (percentile <= 25) {
            topPercentileLabel = "Top 25%";
        } else if (percentile <= 50) {
            topPercentileLabel = "Top 50%";
        } else {
            topPercentileLabel = "Top " + Math.round(percentile) + "%";
        }
        dto.setTopPercentile(topPercentileLabel);
        
        double stdDev = 0.0;
        if (playedMatches.size() > 0) {
            double mean = (double) totalBalance / playedMatches.size();
            double tempSum = 0.0;
            for (MatchPlayer mp : playedMatches) {
                double bal = mp.getCurrentBalance() != null ? mp.getCurrentBalance() : 0;
                tempSum += Math.pow(bal - mean, 2);
            }
            stdDev = Math.sqrt(tempSum / playedMatches.size());
        }
        dto.setStdDevBalance("₮ " + Math.round(stdDev));
        
        dto.setTopAssets(new ArrayList<>());
        dto.setRecentEntries(history);
        
        List<UpcomingTournamentDTO> upcoming = new ArrayList<>();
        List<Match> waitingMatches = matchRepository.findByStatus("CREATED");
        for (Match m : waitingMatches) {
            UpcomingTournamentDTO u = new UpcomingTournamentDTO();
            GameTable table = gameTableRepository.findById(m.getGameTableId()).orElse(null);
            
            int maxPlayers = m.getMaxPlayers() != null ? m.getMaxPlayers() : 4;
            List<MatchPlayer> matchPlayers = matchPlayerRepository.findByMatchId(m.getId());
            int currentPlayers = matchPlayers.size();
            String schedTime = m.getScheduledTime() != null ? m.getScheduledTime() : "Subito";
            
            boolean isAlreadySubscribed = false;
            for (MatchPlayer mp : matchPlayers) {
                if (mp.getUserId().equals(id)) {
                    isAlreadySubscribed = true;
                    break;
                }
            }
            
            u.setName(table != null ? table.getDisplayName() : "Partita #" + m.getId());
            u.setTime("Inizio: " + schedTime + " • Iscritti: " + currentPlayers + "/" + maxPlayers);
            u.setActive(currentPlayers < maxPlayers && !isAlreadySubscribed);
            u.setJoined(isAlreadySubscribed);
            u.setMatchId(m.getId());
            u.setScheduledTime(schedTime);
            upcoming.add(u);
        }
        dto.setUpcomingTournaments(upcoming);
        
        List<UpcomingTournamentDTO> subscribed = new ArrayList<>();
        for (MatchPlayer mp : playedMatches) {
            Match m = matchRepository.findById(mp.getMatchId()).orElse(null);
            if (m != null && ("CREATED".equals(m.getStatus()) || "STARTED".equals(m.getStatus()))) {
                UpcomingTournamentDTO s = new UpcomingTournamentDTO();
                GameTable table = gameTableRepository.findById(m.getGameTableId()).orElse(null);
                
                int maxPlayers = m.getMaxPlayers() != null ? m.getMaxPlayers() : 4;
                String schedTime = m.getScheduledTime() != null ? m.getScheduledTime() : "Subito";
                
                s.setName(table != null ? table.getDisplayName() : "Partita #" + m.getId());
                s.setTime(schedTime);
                s.setMatchId(m.getId());
                s.setScheduledTime(schedTime);
                s.setActive("STARTED".equals(m.getStatus()));
                subscribed.add(s);
            }
        }
        dto.setSubscribedMatches(subscribed);
        
        List<WonTournamentDTO> wonTournaments = new ArrayList<>();
        List<Tournament> allTournaments = tournamentRepository.findAll();
        for (Tournament t : allTournaments) {
            List<Match> tMatches = matchRepository.findAll().stream()
                .filter(m -> t.getId().equals(m.getTournamentId()))
                .toList();
            
            if (tMatches.isEmpty()) continue;
            
            boolean allFinished = tMatches.stream().allMatch(m -> "FINISHED".equals(m.getStatus()));
            if (!allFinished) continue;
            
            Match finalMatch = tMatches.stream()
                .max(Comparator.comparing(Match::getId))
                .orElse(null);
            
            if (finalMatch != null) {
                Long winnerUserId = finalMatch.getWinnerPlayerId();
                if (winnerUserId == null) {
                    List<MatchPlayer> matchPlayers = matchPlayerRepository.findByMatchId(finalMatch.getId());
                    List<MatchPropertyState> matchProperties = matchPropertyStateRepository.findByMatchId(finalMatch.getId());
                    Map<Long, Integer> playerPropertiesValue = new HashMap<>();
                    for (MatchPropertyState state : matchProperties) {
                        if (state.getOwnerMatchPlayerId() != null) {
                            int price = propertyPrices.getOrDefault(state.getPropertyId(), 0);
                            playerPropertiesValue.put(
                                state.getOwnerMatchPlayerId(),
                                playerPropertiesValue.getOrDefault(state.getOwnerMatchPlayerId(), 0) + price
                            );
                        }
                    }

                    int maxNetWorth = -1;
                    for(MatchPlayer p : matchPlayers) {
                        if (p.getBankrupt() == null || p.getBankrupt() == 0) {
                            int netWorth = (p.getCurrentBalance() != null ? p.getCurrentBalance() : 0) + playerPropertiesValue.getOrDefault(p.getId(), 0);
                            if (netWorth > maxNetWorth) {
                                maxNetWorth = netWorth;
                                winnerUserId = p.getUserId();
                            }
                        }
                    }
                    if (winnerUserId != null) {
                        finalMatch.setWinnerPlayerId(winnerUserId);
                        matchRepository.save(finalMatch);
                    }
                }
                
                if (id.equals(winnerUserId)) {
                    WonTournamentDTO wDto = new WonTournamentDTO();
                    wDto.setId(t.getId());
                    wDto.setName(t.getName());
                
                    String rawDate = t.getEndDate() != null ? t.getEndDate() : (t.getStartDate() != null ? t.getStartDate() : "");
                    String formattedDate = "N/D";
                    if (!rawDate.isEmpty()) {
                        try {
                            java.time.LocalDateTime dt = java.time.LocalDateTime.parse(rawDate);
                            formattedDate = dt.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                        } catch (Exception e) {
                            try {
                                formattedDate = rawDate.substring(0, 10);
                            } catch (Exception ex) {
                                formattedDate = rawDate;
                            }
                        }
                    }
                    wDto.setDate(formattedDate);
                    
                    int participants = (int) tournamentPlayerRepository.findAll().stream()
                        .filter(tp -> t.getId().equals(tp.getTournamentId()))
                        .count();
                    wDto.setParticipants(participants);
                    
                    wonTournaments.add(wDto);
                }
            }
        }
        dto.setWonTournaments(wonTournaments);
        
        return ResponseEntity.ok(dto);
    }
}

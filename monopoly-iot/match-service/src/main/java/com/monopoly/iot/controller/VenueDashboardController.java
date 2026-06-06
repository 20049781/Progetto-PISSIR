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
@RequestMapping("/api/venues")
public class VenueDashboardController {

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private MatchPlayerRepository matchPlayerRepository;

    @Autowired
    private SensorEventRepository sensorEventRepository;

    @Autowired
    private GameTableRepository gameTableRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/dashboard/{userId}")
    public ResponseEntity<VenueDashboardDTO> getVenueDashboard(@PathVariable Long userId) {
        // Recupera tutti i locali da board-service (Porta 8083)
        List<Venue> allVenues;
        try {
            Venue[] venuesArr = restTemplate.getForObject("http://localhost:8083/api/venues", Venue[].class);
            allVenues = venuesArr != null ? Arrays.asList(venuesArr) : new ArrayList<>();
        } catch (Exception e) {
            allVenues = new ArrayList<>();
        }

        Venue myVenue = null;
        for (Venue v : allVenues) {
            if (v.getOwnerUserId() != null && v.getOwnerUserId().equals(userId)) {
                myVenue = v;
                break;
            }
        }
        
        if (myVenue == null) return ResponseEntity.notFound().build();
        
        VenueDashboardDTO dto = new VenueDashboardDTO();
        dto.setVenueName(myVenue.getName());
        dto.setMatchesToday(12);
        dto.setMatchesTrend(8);
        dto.setTopBoardName("Nexus-01");
        dto.setTopBoardOccupancy(100);
        
        List<GameTable> tables = gameTableRepository.findAll();
        List<BoardStatusDTO> boards = new ArrayList<>();
        
        int totalMatches = 0;
        int maxOccupancy = 0;
        String topBoard = "";
        
        for (GameTable t : tables) {
            if (t.getVenueId() != null && t.getVenueId().equals(myVenue.getId())) {
                BoardStatusDTO b = new BoardStatusDTO();
                b.setBoardName(t.getDisplayName());
                
                List<Match> matches = matchRepository.findAll();
                Match activeMatch = null;
                for (Match m : matches) {
                    if (m.getGameTableId().equals(t.getId())) {
                        totalMatches++;
                        if ("STARTED".equals(m.getStatus()) || "CREATED".equals(m.getStatus())) {
                            activeMatch = m;
                        }
                    }
                }
                
                if (activeMatch != null) {
                    b.setMatchId(activeMatch.getId());
                    if ("STARTED".equals(activeMatch.getStatus())) {
                        b.setStatus("IN_MATCH");
                    } else {
                        b.setStatus("WAITING");
                    }
                    List<MatchPlayer> mps = matchPlayerRepository.findByMatchId(activeMatch.getId());
                    b.setCurrentPlayers(mps.size());
                    int matchMax = activeMatch.getMaxPlayers() != null ? activeMatch.getMaxPlayers() : 4;
                    b.setMaxPlayers(matchMax);
                    b.setDuration("");
                    
                    int occupancy = matchMax > 0 ? (mps.size() * 100) / matchMax : 0;
                    if (occupancy > maxOccupancy) {
                        maxOccupancy = occupancy;
                        topBoard = t.getDisplayName();
                    }
                } else {
                    b.setStatus(t.getStatus());
                    b.setCurrentPlayers(0);
                    b.setMaxPlayers(0);
                }
                boards.add(b);
            }
        }
        
        dto.setMatchesToday(totalMatches);
        dto.setMatchesTrend(0);
        dto.setTopBoardName(topBoard.isEmpty() ? "Nessuno" : topBoard);
        dto.setTopBoardOccupancy(maxOccupancy);
        dto.setActiveBoards(boards);
        
        List<LiveEventDTO> events = new ArrayList<>();
        List<SensorEvent> sEvents = sensorEventRepository.findAll();
        sEvents.sort((e1, e2) -> e2.getId().compareTo(e1.getId()));
        int count = 0;
        for (SensorEvent se : sEvents) {
            if (count >= 5) break;
            LiveEventDTO le = new LiveEventDTO();
            le.setTime(se.getDetectedAt() != null ? se.getDetectedAt().substring(11, 16) : "N/A");
            le.setType("SYSTEM");
            le.setSource("Sensore");
            le.setMessage("Evento Sensore: " + se.getEventType() + " " + se.getRawPayload());
            events.add(le);
            count++;
        }
        
        dto.setLiveEvents(events);
        
        return ResponseEntity.ok(dto);
    }
}

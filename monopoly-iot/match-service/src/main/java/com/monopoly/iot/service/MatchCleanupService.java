package com.monopoly.iot.service;

import com.monopoly.iot.model.Match;
import com.monopoly.iot.repository.MatchRepository;
import com.monopoly.iot.repository.MatchPlayerRepository;
import com.monopoly.iot.repository.MatchPropertyStateRepository;
import com.monopoly.iot.repository.SensorEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MatchCleanupService {

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private MatchPlayerRepository matchPlayerRepository;

    @Autowired
    private MatchPropertyStateRepository matchPropertyStateRepository;

    @Autowired
    private SensorEventRepository sensorEventRepository;

    /**
     * Esegue la pulizia delle partite finite.
     * Disattivato per mantenere lo storico dei match per la classifica globale.
     */
    // @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void cleanupFinishedMatches() {
        List<Match> finishedMatches = matchRepository.findByStatus("FINISHED");
        for (Match match : finishedMatches) {
            Long id = match.getId();
            
            // Elimina gli eventi sensore associati
            sensorEventRepository.findAll().stream()
                    .filter(e -> e.getMatchId().equals(id))
                    .forEach(e -> sensorEventRepository.delete(e));
                    
            // Elimina gli stati delle proprietà della partita
            matchPropertyStateRepository.findByMatchId(id)
                    .forEach(state -> matchPropertyStateRepository.delete(state));
                    
            // Elimina i giocatori iscritti al match
            matchPlayerRepository.findByMatchId(id)
                    .forEach(p -> matchPlayerRepository.delete(p));
                    
            // Elimina la partita stessa
            matchRepository.delete(match);
            
            System.out.println("Automatic cleanup: deleted finished match #" + id);
        }
    }
}

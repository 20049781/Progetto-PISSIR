package com.monopoly.iot.service;

import com.monopoly.iot.model.SensorEvent;
import com.monopoly.iot.repository.SensorEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Servizio di sincronizzazione periodica.
 * Ogni 30 secondi legge gli eventi pendenti nel buffer offline
 * e tenta di salvarli nel database.
 * Ogni 10 minuti compatta il buffer rimuovendo gli eventi già sincronizzati.
 */
@Service
public class DbSyncService {

    @Autowired
    private OfflineEventBuffer offlineBuffer;

    @Autowired
    private SensorEventRepository sensorEventRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    private final AtomicBoolean syncRunning = new AtomicBoolean(false);
    private final AtomicBoolean dbReachable = new AtomicBoolean(true);
    private volatile String lastSyncAt = "Mai";
    private volatile int lastSyncedCount = 0;
    private final AtomicInteger compactionCycleCounter = new AtomicInteger(0);

    /**
     * Sincronizzazione automatica ogni 30 secondi.
     */
    @Scheduled(fixedDelay = 30000)
    public void syncPendingEvents() {
        if (syncRunning.get()) {
            System.out.println("[DbSync] Sincronizzazione già in corso, salto questo ciclo.");
            return;
        }
        syncRunning.set(true);
        try {
            List<Map<String, Object>> pending = offlineBuffer.getPendingEvents();
            if (pending.isEmpty()) {
                dbReachable.set(true);
                return;
            }

            System.out.println("[DbSync] Trovati " + pending.size() + " eventi da sincronizzare.");
            int syncedCount = 0;

            for (Map<String, Object> record : pending) {
                String bufferId = (String) record.get("bufferId");
                try {
                    SensorEvent event = offlineBuffer.recordToSensorEvent(record);

                    // Controlla se l'evento è già presente nel DB (evita duplicati)
                    List<SensorEvent> existing = sensorEventRepository.findByMatchIdAndZoneIdAndTaggedObjectIdAndDetectedAt(
                            event.getMatchId(), event.getZoneId(), event.getTaggedObjectId(), event.getDetectedAt());
                    
                    SensorEvent savedEvent;
                    if (existing.isEmpty()) {
                        savedEvent = sensorEventRepository.save(event);
                    } else {
                        savedEvent = existing.get(0);
                    }

                    // Processa nel game engine tramite chiamata REST al match-service
                    String matchServiceUrl = "http://localhost:8082/api/matches/simulate-event";
                    restTemplate.postForEntity(matchServiceUrl, savedEvent, SensorEvent.class);

                    // Marca come sincronizzato nel buffer
                    offlineBuffer.markAsSynced(bufferId);
                    syncedCount++;
                    dbReachable.set(true);

                } catch (Exception e) {
                    System.err.println("[DbSync] Errore nel sincronizzare o inviare bufferId=" + bufferId
                            + ": " + e.getMessage());
                    dbReachable.set(false);
                    // Interrompi il ciclo se il DB o il server di gioco non sono raggiungibili
                    break;
                }
            }

            if (syncedCount > 0) {
                lastSyncedCount = syncedCount;
                lastSyncAt = LocalDateTime.now().toString();
                System.out.println("[DbSync] Sincronizzati " + syncedCount + " eventi nel DB.");
            }

            // Compaction ogni 20 cicli (~10 minuti)
            int cycle = compactionCycleCounter.incrementAndGet();
            if (cycle % 20 == 0) {
                int removed = offlineBuffer.compact();
                if (removed > 0) {
                    System.out.println("[DbSync] Compaction completata: rimossi " + removed + " eventi.");
                }
            }

        } finally {
            syncRunning.set(false);
        }
    }

    /**
     * Forza una sincronizzazione immediata (chiamata dall'API REST).
     * @return numero di eventi sincronizzati
     */
    public int triggerSync() {
        if (syncRunning.get()) {
            return -1; // già in corso
        }
        syncPendingEvents();
        return lastSyncedCount;
    }

    public boolean isSyncRunning() { return syncRunning.get(); }
    public boolean isDbReachable() { return dbReachable.get(); }
    public String getLastSyncAt() { return lastSyncAt; }
    public int getPendingCount() { return offlineBuffer.countPending(); }
    public String getBufferFilePath() { return offlineBuffer.getBufferFilePath(); }
}


package com.monopoly.iot.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.monopoly.iot.model.SensorEvent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * Buffer offline per eventi sensore.
 * Scrive ogni evento in un file JSON Lines (sensor_events_buffer.jsonl).
 * Garantisce la persistenza degli eventi anche quando il DB non è raggiungibile.
 * Thread-safe tramite ReentrantReadWriteLock.
 */
@Component
public class OfflineEventBuffer {

    @Value("${sensor.buffer.file:../sensor_events_buffer.jsonl}")
    private String bufferFilePath;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    /**
     * Aggiunge un evento al buffer locale su file.
     * @return il bufferId assegnato all'evento
     */
    public String appendEvent(SensorEvent event) {
        lock.writeLock().lock();
        try {
            String bufferId = UUID.randomUUID().toString();
            Map<String, Object> record = buildRecord(event, bufferId, false);
            String line = objectMapper.writeValueAsString(record);

            Path path = Paths.get(bufferFilePath);
            Files.createDirectories(path.getParent() == null ? Paths.get(".") : path.getParent());
            Files.writeString(path, line + System.lineSeparator(),
                    StandardOpenOption.CREATE, StandardOpenOption.APPEND);

            System.out.println("[OfflineBuffer] Evento bufferizzato: bufferId=" + bufferId
                    + " eventType=" + event.getEventType());
            return bufferId;
        } catch (Exception e) {
            System.err.println("[OfflineBuffer] Errore durante la scrittura nel buffer: " + e.getMessage());
            return null;
        } finally {
            lock.writeLock().unlock();
        }
    }

    /**
     * Restituisce tutti gli eventi non ancora sincronizzati con il DB.
     */
    public List<Map<String, Object>> getPendingEvents() {
        lock.readLock().lock();
        try {
            Path path = Paths.get(bufferFilePath);
            if (!Files.exists(path)) return Collections.emptyList();

            List<Map<String, Object>> pending = new ArrayList<>();
            try (BufferedReader reader = new BufferedReader(new FileReader(path.toFile()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.isBlank()) continue;
                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> record = objectMapper.readValue(line, Map.class);
                        Boolean synced = (Boolean) record.get("synced");
                        if (synced == null || !synced) {
                            pending.add(record);
                        }
                    } catch (Exception ex) {
                        System.err.println("[OfflineBuffer] Riga corrotta nel buffer, saltata: " + line);
                    }
                }
            }
            return pending;
        } catch (Exception e) {
            System.err.println("[OfflineBuffer] Errore nella lettura del buffer: " + e.getMessage());
            return Collections.emptyList();
        } finally {
            lock.readLock().unlock();
        }
    }

    /**
     * Marca un evento come sincronizzato nel buffer riscrivendo il file.
     * Viene chiamato dal DbSyncService dopo aver salvato con successo nel DB.
     */
    public void markAsSynced(String bufferId) {
        lock.writeLock().lock();
        try {
            Path path = Paths.get(bufferFilePath);
            if (!Files.exists(path)) return;

            List<String> updatedLines = new ArrayList<>();
            try (BufferedReader reader = new BufferedReader(new FileReader(path.toFile()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.isBlank()) continue;
                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> record = objectMapper.readValue(line, Map.class);
                        if (bufferId.equals(record.get("bufferId"))) {
                            record.put("synced", true);
                            updatedLines.add(objectMapper.writeValueAsString(record));
                        } else {
                            updatedLines.add(line);
                        }
                    } catch (Exception ex) {
                        updatedLines.add(line); // mantieni righe corrotte invariate
                    }
                }
            }
            Files.write(path, updatedLines, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.CREATE);
        } catch (Exception e) {
            System.err.println("[OfflineBuffer] Errore nel markAsSynced: " + e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    /**
     * Compatta il buffer rimuovendo tutte le righe già sincronizzate.
     * Chiamato periodicamente da DbSyncService per tenere il file piccolo.
     */
    public int compact() {
        lock.writeLock().lock();
        try {
            Path path = Paths.get(bufferFilePath);
            if (!Files.exists(path)) return 0;

            List<String> pendingLines = new ArrayList<>();
            int removedCount = 0;

            try (BufferedReader reader = new BufferedReader(new FileReader(path.toFile()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.isBlank()) continue;
                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> record = objectMapper.readValue(line, Map.class);
                        Boolean synced = (Boolean) record.get("synced");
                        if (synced != null && synced) {
                            removedCount++;
                        } else {
                            pendingLines.add(line);
                        }
                    } catch (Exception ex) {
                        pendingLines.add(line);
                    }
                }
            }
            Files.write(path, pendingLines, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.CREATE);
            System.out.println("[OfflineBuffer] Compaction: rimossi " + removedCount + " eventi sincronizzati.");
            return removedCount;
        } catch (Exception e) {
            System.err.println("[OfflineBuffer] Errore durante compaction: " + e.getMessage());
            return 0;
        } finally {
            lock.writeLock().unlock();
        }
    }

    /**
     * Conta gli eventi non ancora sincronizzati.
     */
    public int countPending() {
        return getPendingEvents().size();
    }

    /**
     * Restituisce il percorso assoluto del file buffer.
     */
    public String getBufferFilePath() {
        try {
            return Paths.get(bufferFilePath).toAbsolutePath().toString();
        } catch (Exception e) {
            return bufferFilePath;
        }
    }

    // --- Metodi Helper ---

    private Map<String, Object> buildRecord(SensorEvent event, String bufferId, boolean synced) {
        Map<String, Object> record = new LinkedHashMap<>();
        record.put("bufferId", bufferId);
        record.put("matchId", event.getMatchId());
        record.put("zoneId", event.getZoneId());
        record.put("taggedObjectId", event.getTaggedObjectId());
        record.put("eventType", event.getEventType());
        record.put("rawPayload", event.getRawPayload());
        record.put("detectedAt", event.getDetectedAt());
        record.put("processed", event.getProcessed());
        record.put("synced", synced);
        return record;
    }

    /**
     * Ricostruisce un SensorEvent da un record del buffer.
     */
    public SensorEvent recordToSensorEvent(Map<String, Object> record) {
        SensorEvent event = new SensorEvent();
        if (record.get("matchId") != null)
            event.setMatchId(Long.valueOf(record.get("matchId").toString()));
        if (record.get("zoneId") != null)
            event.setZoneId(Long.valueOf(record.get("zoneId").toString()));
        if (record.get("taggedObjectId") != null)
            event.setTaggedObjectId(Long.valueOf(record.get("taggedObjectId").toString()));
        event.setEventType((String) record.get("eventType"));
        event.setRawPayload((String) record.get("rawPayload"));
        event.setDetectedAt((String) record.get("detectedAt"));
        event.setProcessed(record.get("processed") != null
                ? Integer.valueOf(record.get("processed").toString()) : 0);
        return event;
    }
}

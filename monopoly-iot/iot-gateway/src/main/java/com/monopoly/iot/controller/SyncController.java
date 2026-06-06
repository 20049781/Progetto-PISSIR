package com.monopoly.iot.controller;

import com.monopoly.iot.service.DbSyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * API REST per monitorare e controllare la sincronizzazione
 * del buffer offline con il database.
 */
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/sync")
public class SyncController {

    @Autowired
    private DbSyncService dbSyncService;

    /**
     * GET /api/sync/status
     * Restituisce lo stato attuale del buffer e del DB.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("dbReachable", dbSyncService.isDbReachable());
        status.put("syncRunning", dbSyncService.isSyncRunning());
        status.put("pendingEvents", dbSyncService.getPendingCount());
        status.put("lastSyncAt", dbSyncService.getLastSyncAt());
        status.put("bufferFile", dbSyncService.getBufferFilePath());
        return ResponseEntity.ok(status);
    }

    /**
     * POST /api/sync/trigger
     * Forza una sincronizzazione immediata degli eventi pendenti.
     */
    @PostMapping("/trigger")
    public ResponseEntity<Map<String, Object>> triggerSync() {
        int synced = dbSyncService.triggerSync();
        Map<String, Object> result = new LinkedHashMap<>();
        if (synced == -1) {
            result.put("status", "already_running");
            result.put("message", "Sincronizzazione già in corso.");
        } else {
            result.put("status", "ok");
            result.put("syncedEvents", synced);
            result.put("pendingEvents", dbSyncService.getPendingCount());
            result.put("lastSyncAt", dbSyncService.getLastSyncAt());
        }
        return ResponseEntity.ok(result);
    }
}

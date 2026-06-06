package com.monopoly.iot.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.monopoly.iot.model.SensorEvent;
import com.monopoly.iot.repository.SensorEventRepository;
import com.monopoly.iot.service.OfflineEventBuffer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;

@Component
public class MqttMessageHandler {

    @Autowired
    private SensorEventRepository sensorEventRepository;

    @Autowired
    private OfflineEventBuffer offlineEventBuffer;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleMessage(Message<String> message) {
        String payload = message.getPayload();
        System.out.println("Messaggio MQTT ricevuto: " + payload);

        SensorEvent event = null;
        try {
            event = objectMapper.readValue(payload, SensorEvent.class);
            event.setDetectedAt(LocalDateTime.now().toString());
            event.setProcessed(0);
        } catch (Exception e) {
            System.err.println("Errore nel parsing del messaggio MQTT: " + e.getMessage());
            return;
        }

        // STEP 1: Scrivi sempre nel buffer offline (garanzia di non perdita dati)
        String bufferId = offlineEventBuffer.appendEvent(event);

        // STEP 2: Tenta il salvataggio diretto nel DB e l'inoltro al match-service
        try {
            // Controlla se l'evento è già presente nel DB (evita duplicati)
            java.util.List<SensorEvent> existing = sensorEventRepository.findByMatchIdAndZoneIdAndTaggedObjectIdAndDetectedAt(
                    event.getMatchId(), event.getZoneId(), event.getTaggedObjectId(), event.getDetectedAt());
            
            SensorEvent savedEvent;
            if (existing.isEmpty()) {
                savedEvent = sensorEventRepository.save(event);
            } else {
                savedEvent = existing.get(0);
            }

            // STEP 3: Processa nel game engine tramite chiamata REST al match-service
            String matchServiceUrl = "http://localhost:8082/api/matches/simulate-event";
            restTemplate.postForEntity(matchServiceUrl, savedEvent, SensorEvent.class);

            // Se tutto è riuscito, marca subito come sincronizzato nel buffer
            if (bufferId != null) {
                offlineEventBuffer.markAsSynced(bufferId);
            }

        } catch (Exception e) {
            // Se il DB o il match-service non sono raggiungibili, l'evento rimane non sincronizzato nel buffer
            // e verrà reinviato dal DbSyncService entro 30 secondi
            System.err.println("[MqttHandler] Server o DB non raggiungibili, l'evento rimarrà nel buffer per la sincronizzazione tardiva (bufferId="
                    + bufferId + "): " + e.getMessage());
        }    }
}


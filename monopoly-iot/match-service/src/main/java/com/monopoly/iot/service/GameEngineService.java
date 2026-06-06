package com.monopoly.iot.service;

import com.monopoly.iot.model.*;
import com.monopoly.iot.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
public class GameEngineService {

    @Autowired private MatchRepository matchRepository;
    @Autowired private SensorEventRepository sensorEventRepository;
    @Autowired private ReadingZoneRepository readingZoneRepository;
    @Autowired private TaggedObjectRepository taggedObjectRepository;
    @Autowired private MatchPlayerRepository matchPlayerRepository;
    @Autowired private MonopolyPropertyRepository monopolyPropertyRepository;
    @Autowired private MatchPropertyStateRepository matchPropertyStateRepository;
    @Autowired private GameSettingsRepository gameSettingsRepository;

    @Transactional
    public void processSensorEvent(SensorEvent event) {
        // Verifica se la modalità sensori è attiva globalmente nelle regole del gioco
        java.util.List<GameSettings> settingsList = gameSettingsRepository.findAll();
        if (!settingsList.isEmpty() && Boolean.FALSE.equals(settingsList.get(0).getSensorModeActive())) {
            System.out.println("GIOCO IBRIDO: Evento sensore di tipo " + event.getEventType() + " ignorato perché la modalità sensori è disattivata.");
            event.setProcessed(1);
            sensorEventRepository.save(event);
            return;
        }

        Match match = matchRepository.findById(event.getMatchId()).orElse(null);
        if (match == null || !"STARTED".equals(match.getStatus())) {
            System.out.println("GIOCO IBRIDO: Evento sensore ignorato: partita inesistente o non avviata (matchId=" + event.getMatchId() + ").");
            event.setProcessed(1);
            sensorEventRepository.save(event);
            return;
        }

        if ("AUCTION_WON".equals(event.getEventType())) {
            handleAuctionWon(match, event);
            event.setProcessed(1);
            sensorEventRepository.save(event);
            return;
        }

        Optional<ReadingZone> zoneOpt = readingZoneRepository.findById(event.getZoneId());
        Optional<TaggedObject> tagOpt = taggedObjectRepository.findById(event.getTaggedObjectId());

        if (zoneOpt.isPresent() && tagOpt.isPresent()) {
            ReadingZone zone = zoneOpt.get();
            TaggedObject tag = tagOpt.get();

            if (match.getGameTableId() != null && zone.getGameTableId() != null && !match.getGameTableId().equals(zone.getGameTableId())) {
                System.out.println("GIOCO IBRIDO: Evento ignorato: sensore del tavolo " + zone.getGameTableId()
                        + " collegato a partita sul tavolo " + match.getGameTableId() + ".");
                event.setProcessed(1);
                sensorEventRepository.save(event);
                return;
            }

            if ("ENTER".equals(event.getEventType()) || "PRESENT".equals(event.getEventType()) || "EXIT".equals(event.getEventType())) {
                if ("PLAYER_TOKEN".equals(tag.getObjectType()) && ("ENTER".equals(event.getEventType()) || "PRESENT".equals(event.getEventType()))) {
                    if ("TURN".equals(zone.getZoneType()) || zone.getZoneName().contains("Turn Sensor")) {
                        handleTurnSensor(match, tag, zone);
                    } else {
                        handleTokenLandsOnSpace(match, tag, zone);
                    }
                } else if ("MONEY_TOKEN".equals(tag.getObjectType())) {
                    if ("PLAYER_MONEY".equals(zone.getZoneType())) {
                        handlePhysicalMoneyMovement(match, event, tag, zone);
                    } else if ("ENTER".equals(event.getEventType()) || "PRESENT".equals(event.getEventType())) {
                        handleMoneyPlaced(match, tag, zone);
                    }
                } else if ("PROPERTY".equals(tag.getObjectType()) && ("ENTER".equals(event.getEventType()) || "PRESENT".equals(event.getEventType()))) {
                    handlePropertyCardPlaced(match, tag, zone);
                } else if (("PASS_CARD".equals(tag.getObjectType()) || tag.getTagUid().contains("PASS")) && ("ENTER".equals(event.getEventType()) || "PRESENT".equals(event.getEventType()))) {
                    handlePassCardPlaced(match, tag, zone);
                } else if ("GENERIC".equals(tag.getObjectType()) && "DOUBLE_ZONE".equals(zone.getZoneCode()) && ("ENTER".equals(event.getEventType()) || "PRESENT".equals(event.getEventType()))) {
                    handleDoubleRolled(match, tag, zone);
                }
            }
        }

        event.setProcessed(1);
        sensorEventRepository.save(event);
    }

    private void handlePhysicalMoneyMovement(Match match, SensorEvent event, TaggedObject moneyTag, ReadingZone zone) {
        Integer playerSlot = zone.getPlayerSlot();
        if (playerSlot == null) return;
        
        MatchPlayer player = matchPlayerRepository.findByMatchIdAndPlayerOrder(match.getId(), playerSlot);
        if (player == null) return;
        
        int billValue = 0;
        if (moneyTag.getLabel().contains("500")) billValue = 500;
        else if (moneyTag.getLabel().contains("100")) billValue = 100;
        else if (moneyTag.getLabel().contains("50")) billValue = 50;
        else if (moneyTag.getLabel().contains("20")) billValue = 20;
        else if (moneyTag.getLabel().contains("10")) billValue = 10;
        else if (moneyTag.getLabel().contains("5")) billValue = 5;
        else if (moneyTag.getLabel().contains("1")) billValue = 1;
        else billValue = 20;
        
        if ("ENTER".equals(event.getEventType()) || "PRESENT".equals(event.getEventType())) {
            player.setCurrentBalance(player.getCurrentBalance() + billValue);
            System.out.println("PORTAFOGLIO: Giocatore " + player.getId() + " ha ricevuto ₮" + billValue + " (Saldo: " + player.getCurrentBalance() + ")");
        } else if ("EXIT".equals(event.getEventType())) {
            player.setCurrentBalance(player.getCurrentBalance() - billValue);
            System.out.println("PORTAFOGLIO: Giocatore " + player.getId() + " ha speso ₮" + billValue + " (Saldo: " + player.getCurrentBalance() + ")");
        }
        matchPlayerRepository.save(player);
        checkAndProcessBankruptcy(player, match);
    }

    private MatchPlayer findPlayerByToken(Match match, TaggedObject tokenTag) {
        if (match == null || tokenTag == null || tokenTag.getId() == null) return null;

        int playerOrder = (int)(tokenTag.getId() - 100);
        if (playerOrder < 1 || playerOrder > 6) {
            return null;
        }

        MatchPlayer player = matchPlayerRepository.findByMatchIdAndPlayerOrder(match.getId(), playerOrder);
        if (player == null || (player.getBankrupt() != null && player.getBankrupt() == 1)) {
            return null;
        }

        return player;
    }

    private void handleTurnSensor(Match match, TaggedObject tokenTag, ReadingZone spaceZone) {
        MatchPlayer player = findPlayerByToken(match, tokenTag);
        
        if (player != null) {
            match.setCurrentTurnPlayerId(player.getId());
            matchRepository.save(match);
            System.out.println("GIOCO IBRIDO: Turno passato ufficialmente al Giocatore " + player.getId() + " (Ordine " + player.getPlayerOrder() + ")");
        }
    }

    private void handleTokenLandsOnSpace(Match match, TaggedObject tokenTag, ReadingZone spaceZone) {
        MatchPlayer player = findPlayerByToken(match, tokenTag);
        if (player != null && !player.getId().equals(match.getCurrentTurnPlayerId())) {
            match.setCurrentTurnPlayerId(player.getId());
            matchRepository.save(match);
        }
        if (player == null && match.getCurrentTurnPlayerId() != null) {
            player = matchPlayerRepository.findById(match.getCurrentTurnPlayerId()).orElse(null);
        }
        if (player == null) return;

        System.out.println("GIOCO IBRIDO: Giocatore " + player.getId() + " è atterrato su " + spaceZone.getZoneName());

        // 1. Logica Transito su VIA (GO)
        if ("GO".equalsIgnoreCase(spaceZone.getZoneName()) || "VIA".equalsIgnoreCase(spaceZone.getZoneName())) {
            System.out.println("GIOCO IBRIDO: Passaggio dal VIA! Giocatore " + player.getId() + " deve prendere fisicamente ₮200 dalla Banca.");
            return;
        }

        // 2. Logica Vai in Prigione (Go To Jail)
        if ("Go To Jail".equalsIgnoreCase(spaceZone.getZoneName())) {
            System.out.println("GIOCO IBRIDO: Giocatore " + player.getId() + " va in Prigione!");
            // Passa automaticamente il turno al giocatore successivo
            rotateTurn(match);
            return;
        }

        // 2.5 Logica Chance / Community Chest (Imprevisti e Probabilità)
        if (spaceZone.getZoneName().toLowerCase().contains("chance") || spaceZone.getZoneName().toLowerCase().contains("community")) {
            boolean isChance = spaceZone.getZoneName().toLowerCase().contains("chance");
            
            // Definisce mazzo virtuale di carte Bonus/Penalità
            String cardName;
            int balanceEffect = 0;
            boolean goToJail = false;
            
            double rand = Math.random();
            if (isChance) {
                if (rand < 0.2) {
                    cardName = "Multa per eccesso di velocità (Penalità)";
                    balanceEffect = -150;
                } else if (rand < 0.4) {
                    cardName = "Erediti ₮100 da un lontano parente (Bonus)";
                    balanceEffect = 100;
                } else if (rand < 0.6) {
                    cardName = "Riparazioni stradali straordinarie (Penalità)";
                    balanceEffect = -100;
                } else if (rand < 0.8) {
                    cardName = "Vinci un premio alla lotteria di Natale (Bonus)";
                    balanceEffect = 150;
                } else {
                    cardName = "Arresto per frode fiscale! Vai in Prigione (Penalità)";
                    goToJail = true;
                }
            } else { // Community Chest
                if (rand < 0.25) {
                    cardName = "Rimborso tasse arretrate (Bonus)";
                    balanceEffect = 20;
                } else if (rand < 0.5) {
                    cardName = "Spese mediche (Penalità)";
                    balanceEffect = -50;
                } else if (rand < 0.75) {
                    cardName = "Vinci concorso di bellezza (Bonus)";
                    balanceEffect = 10;
                } else {
                    cardName = "Assicurazione sulla vita scade (Bonus)";
                    balanceEffect = 100;
                }
            }
            
            System.out.println("CARTA PESCATA: " + cardName);
            if (balanceEffect != 0) {
                if (balanceEffect > 0) {
                    System.out.println("GIOCO IBRIDO: Giocatore " + player.getId() + " deve ritirare fisicamente ₮" + balanceEffect + " dalla banca.");
                } else {
                    System.out.println("GIOCO IBRIDO: Giocatore " + player.getId() + " deve pagare fisicamente ₮" + (-balanceEffect) + " alla banca.");
                }
            }
            
            if (goToJail) {
                rotateTurn(match);
            }
            
            return;
        }

        // 3. Logica Tasse (Income Tax, Luxury Tax)
        if ("Income Tax".equalsIgnoreCase(spaceZone.getZoneName())) {
            System.out.println("GIOCO IBRIDO: Tassa sul Reddito! Giocatore " + player.getId() + " deve pagare fisicamente ₮200.");
            return;
        }
        if ("Luxury Tax".equalsIgnoreCase(spaceZone.getZoneName())) {
            System.out.println("GIOCO IBRIDO: Tassa di Lusso! Giocatore " + player.getId() + " deve pagare fisicamente ₮100.");
            return;
        }

        // 4. Logica Proprietà
        String propertyCode = "PROP-" + spaceZone.getZoneName().toUpperCase()
                .replace(" ", "-")
                .replace("&", "AND")
                .replace(".", "")
                .replace("/", "")
                .replace("'", "");
        MonopolyProperty property = monopolyPropertyRepository.findByPropertyCode(propertyCode);
        if (property != null) {
            MatchPropertyState state = matchPropertyStateRepository.findByMatchIdAndPropertyId(match.getId(), property.getId());
            if (state == null) {
                state = new MatchPropertyState();
                state.setMatchId(match.getId());
                state.setPropertyId(property.getId());
                state.setMortgaged(0);
                state.setHouses(0);
                state.setHotels(0);
                state = matchPropertyStateRepository.save(state);
            }

            if (state.getOwnerMatchPlayerId() == null) {
                System.out.println("GIOCO IBRIDO: Casella libera! Il giocatore " + player.getId() + " può acquistare " + property.getName() + " per ₮" + property.getPurchasePrice() + " appoggiando una banconota.");
            } else if (!state.getOwnerMatchPlayerId().equals(player.getId())) {
                String colorGroup = getPropertyColorGroup(property.getName());
                boolean ownerMonopoly = checkOwnsAllPropertiesOfGroup(state.getOwnerMatchPlayerId(), match.getId(), colorGroup);
                int rent = calculateDynamicRent(property, state, colorGroup, ownerMonopoly);
                System.out.println("GIOCO IBRIDO: Casella di Giocatore " + state.getOwnerMatchPlayerId() + ". Giocatore " + player.getId() + " deve pagare affitto di ₮" + rent + " spostando fisicamente le fiches nel vassoio del proprietario.");
            }
        }
    }

    private void handleMoneyPlaced(Match match, TaggedObject moneyTag, ReadingZone zone) {
        MatchPlayer currentPlayer = matchPlayerRepository.findById(match.getCurrentTurnPlayerId()).orElse(null);
        if (currentPlayer == null) return;

        int billValue = 0;
        if (moneyTag.getLabel().contains("500")) billValue = 500;
        else if (moneyTag.getLabel().contains("100")) billValue = 100;
        else if (moneyTag.getLabel().contains("50")) billValue = 50;
        else if (moneyTag.getLabel().contains("20")) billValue = 20;
        else if (moneyTag.getLabel().contains("10")) billValue = 10;
        else if (moneyTag.getLabel().contains("5")) billValue = 5;
        else if (moneyTag.getLabel().contains("1")) billValue = 1;
        else billValue = 20;

        String propertyCode = "PROP-" + zone.getZoneName().toUpperCase()
                .replace(" ", "-")
                .replace("&", "AND")
                .replace(".", "")
                .replace("/", "")
                .replace("'", "");
        MonopolyProperty property = monopolyPropertyRepository.findByPropertyCode(propertyCode);
        if (property != null) {
            MatchPropertyState state = matchPropertyStateRepository.findByMatchIdAndPropertyId(match.getId(), property.getId());
            if (state == null) {
                state = new MatchPropertyState();
                state.setMatchId(match.getId());
                state.setPropertyId(property.getId());
                state.setMortgaged(0);
                state.setHouses(0);
                state.setHotels(0);
                state = matchPropertyStateRepository.save(state);
            }

            String colorGroup = getPropertyColorGroup(property.getName());
            boolean ownsMonopoly = checkOwnsAllPropertiesOfGroup(currentPlayer.getId(), match.getId(), colorGroup);

            if (state.getOwnerMatchPlayerId() == null) {
                // ACQUISTO (Fisicamente i soldi escono dal wallet e vanno alla banca, qui registriamo solo l'acquisto logico della proprietà)
                state.setOwnerMatchPlayerId(currentPlayer.getId());
                matchPropertyStateRepository.save(state);

                System.out.println("ACQUISTO IBRIDO: Rilevata banconota sulla proprietà. Giocatore " + currentPlayer.getId() + " acquista " + property.getName() + "!");

                // Crea evento sensore virtuale PROPERTY_BOUGHT
                SensorEvent buyEvent = new SensorEvent();
                buyEvent.setMatchId(match.getId());
                buyEvent.setZoneId(zone.getId());
                buyEvent.setTaggedObjectId(moneyTag.getId());
                buyEvent.setEventType("PROPERTY_BOUGHT");
                buyEvent.setRawPayload(String.format("{\"property\": \"%s\", \"owner\": %d, \"price\": %d}", 
                        property.getName(), currentPlayer.getId(), property.getPurchasePrice()));
                buyEvent.setDetectedAt(java.time.LocalDateTime.now().toString());
                buyEvent.setProcessed(1);
                sensorEventRepository.save(buyEvent);
            } else if (state.getOwnerMatchPlayerId().equals(currentPlayer.getId())) {
                // COSTRUZIONE CASETTA / ALBERGO
                if (ownsMonopoly) {
                    int houseCost = getHousePrice(colorGroup);
                    int currentHouses = state.getHouses() != null ? state.getHouses() : 0;
                    int currentHotels = state.getHotels() != null ? state.getHotels() : 0;

                    if (currentHotels == 0) {
                        int targetNewTotal = currentHouses + 1;
                        if (!canBuildHouse(match.getId(), colorGroup, targetNewTotal)) {
                            System.out.println("COSTRUZIONE ANNULLATA: Devi distribuire le case uniformemente nel gruppo " + colorGroup);
                        } else if (currentPlayer.getCurrentBalance() >= houseCost) {
                            currentPlayer.setCurrentBalance(currentPlayer.getCurrentBalance() - houseCost);
                            matchPlayerRepository.save(currentPlayer);

                            if (currentHouses < 4) {
                                state.setHouses(currentHouses + 1);
                                System.out.println("COSTRUZIONE CASETTA: Giocatore " + currentPlayer.getId() + " ha costruito la casetta numero " + (currentHouses + 1) + " su " + property.getName());
                            } else {
                                state.setHouses(0);
                                state.setHotels(1);
                                System.out.println("COSTRUZIONE ALBERGO: Giocatore " + currentPlayer.getId() + " ha costruito un ALBERGO su " + property.getName());
                            }
                            matchPropertyStateRepository.save(state);

                            // Crea un evento sensore virtuale di tipo "HOUSE_BUILD"
                            SensorEvent buildEvent = new SensorEvent();
                            buildEvent.setMatchId(match.getId());
                            buildEvent.setZoneId(zone.getId());
                            buildEvent.setTaggedObjectId(moneyTag.getId());
                            buildEvent.setEventType("HOUSE_BUILD");
                            buildEvent.setRawPayload(String.format("{\"property\": \"%s\", \"owner\": %d, \"houses\": %d, \"hotels\": %d, \"cost\": %d}", 
                                    property.getName(), currentPlayer.getId(), state.getHouses(), state.getHotels(), houseCost));
                            buildEvent.setDetectedAt(java.time.LocalDateTime.now().toString());
                            buildEvent.setProcessed(1);
                            sensorEventRepository.save(buildEvent);
                        } else {
                            System.out.println("COSTRUZIONE ANNULLATA: Fondi insufficienti per costruire su " + property.getName() + " (costo: ₮" + houseCost + ")");
                        }
                    } else {
                        System.out.println("COSTRUZIONE ANNULLATA: Raggiunto il limite massimo di alberghi su " + property.getName());
                    }
                } else {
                    System.out.println("COSTRUZIONE ANNULLATA: Devi possedere l'intero gruppo di colore per poter costruire casette.");
                }
            } else {
                // PAGAMENTO AFFITTO DINAMICO
                MatchPlayer owner = matchPlayerRepository.findById(state.getOwnerMatchPlayerId()).orElse(null);
                if (owner != null) {
                    boolean ownerMonopoly = checkOwnsAllPropertiesOfGroup(owner.getId(), match.getId(), colorGroup);
                    int rent = calculateDynamicRent(property, state, colorGroup, ownerMonopoly);

                    currentPlayer.setCurrentBalance(currentPlayer.getCurrentBalance() - rent);
                    owner.setCurrentBalance(owner.getCurrentBalance() + rent);
                    matchPlayerRepository.save(currentPlayer);
                    matchPlayerRepository.save(owner);
                    checkAndProcessBankruptcy(currentPlayer, match);

                    System.out.println("AFFITTO IBRIDO DINAMICO: Pagamento di ₮" + rent + " da Giocatore " + currentPlayer.getId() + " a Giocatore " + owner.getId() + " completato con successo!");

                    // Crea evento sensore virtuale RENT_PAID
                    SensorEvent rentEvent = new SensorEvent();
                    rentEvent.setMatchId(match.getId());
                    rentEvent.setZoneId(zone.getId());
                    rentEvent.setTaggedObjectId(moneyTag.getId());
                    rentEvent.setEventType("RENT_PAID");
                    rentEvent.setRawPayload(String.format("{\"property\": \"%s\", \"payer\": %d, \"owner\": %d, \"rent\": %d}", 
                            property.getName(), currentPlayer.getId(), owner.getId(), rent));
                    rentEvent.setDetectedAt(java.time.LocalDateTime.now().toString());
                    rentEvent.setProcessed(1);
                    sensorEventRepository.save(rentEvent);
                }
            }
        }
    }

    private void checkAndProcessBankruptcy(MatchPlayer player, Match match) {
        if (player.getCurrentBalance() < 0) {
            System.out.println("TENTATIVO SALVATAGGIO BANCAROTTA: Giocatore " + player.getId() + " è in debito (₮" + player.getCurrentBalance() + "). Inizio liquidazione proprietà...");
            
            java.util.List<MatchPropertyState> ownedProperties = matchPropertyStateRepository.findByMatchId(match.getId());
            for (MatchPropertyState propState : ownedProperties) {
                if (player.getId().equals(propState.getOwnerMatchPlayerId()) && player.getCurrentBalance() < 0) {
                    Optional<MonopolyProperty> propOpt = monopolyPropertyRepository.findById(propState.getPropertyId());
                    if (propOpt.isPresent()) {
                        MonopolyProperty property = propOpt.get();
                        String colorGroup = getPropertyColorGroup(property.getName());
                        int houseCost = getHousePrice(colorGroup);
                        int sellRefund = property.getPurchasePrice() / 2;
                        int housesRefund = (propState.getHouses() != null ? propState.getHouses() : 0) * (houseCost / 2);
                        int hotelRefund = (propState.getHotels() != null ? propState.getHotels() : 0) * (houseCost * 5 / 2);
                        int totalRefund = sellRefund + housesRefund + hotelRefund;

                        player.setCurrentBalance(player.getCurrentBalance() + totalRefund);
                        
                        propState.setOwnerMatchPlayerId(null);
                        propState.setHouses(0);
                        propState.setHotels(0);
                        matchPropertyStateRepository.save(propState);

                        System.out.println("VENDITA AUTOMATICA DI SALVATAGGIO: Giocatore " + player.getId() + " vende " + property.getName() + " al Banco per ₮" + totalRefund + ". Nuovo saldo: ₮" + player.getCurrentBalance());

                        // Invia evento sensore virtuale di tipo "PROPERTY_SOLD"
                        SensorEvent sellEvent = new SensorEvent();
                        sellEvent.setMatchId(match.getId());
                        sellEvent.setEventType("PROPERTY_SOLD");
                        sellEvent.setRawPayload(String.format("{\"property\": \"%s\", \"owner\": %d, \"refund\": %d}", 
                                property.getName(), player.getId(), totalRefund));
                        sellEvent.setDetectedAt(java.time.LocalDateTime.now().toString());
                        sellEvent.setProcessed(1);
                        sensorEventRepository.save(sellEvent);
                    }
                }
            }
        }

        if (player.getCurrentBalance() < 0) {
            player.setCurrentBalance(0);
        }
        if (player.getCurrentBalance() == 0) {
            player.setBankrupt(1);
            player.setInGame(0);
            matchPlayerRepository.save(player);

            System.out.println("BANCAROTTA IBRIDA: Giocatore " + player.getId() + " ha esaurito i fondi ed è fallito! Tutte le sue proprietà tornano alla banca.");

            // Rilascia tutte le proprietà possedute dal giocatore fallito
            java.util.List<MatchPropertyState> ownedProperties = matchPropertyStateRepository.findByMatchId(match.getId());
            for (MatchPropertyState propState : ownedProperties) {
                if (player.getId().equals(propState.getOwnerMatchPlayerId())) {
                    propState.setOwnerMatchPlayerId(null);
                    propState.setHouses(0);
                    propState.setHotels(0);
                    matchPropertyStateRepository.save(propState);
                }
            }

            // Controlla se rimane un solo giocatore non fallito
            java.util.List<MatchPlayer> allPlayers = matchPlayerRepository.findByMatchId(match.getId());
            long activeCount = allPlayers.stream().filter(p -> p.getBankrupt() == null || p.getBankrupt() == 0).count();
            if (activeCount <= 1) {
                match.setStatus("FINISHED");
                match.setEndTime(java.time.LocalDateTime.now().toString());
                matchRepository.save(match);
                System.out.println("PARTITA COMPLETATA: Rimane solo un giocatore non fallito. La partita #" + match.getId() + " è terminata!");
            }
        }
    }

    private void handlePropertyCardPlaced(Match match, TaggedObject propertyTag, ReadingZone zone) {
        // Scambio/Trattativa di proprietà tramite RFID
        String cardCode = propertyTag.getTagUid().replace("TAG-PROP-", "PROP-");
        MonopolyProperty cardProperty = monopolyPropertyRepository.findByPropertyCode(cardCode);

        if (cardProperty != null) {
            MatchPropertyState cardState = matchPropertyStateRepository.findByMatchIdAndPropertyId(match.getId(), cardProperty.getId());
            
            // Se la zona è VIA o GO, il proprietario vende la proprietà al Banco
            if (cardState != null && cardState.getOwnerMatchPlayerId() != null && 
                ("GO".equalsIgnoreCase(zone.getZoneName()) || "VIA".equalsIgnoreCase(zone.getZoneName()))) {
                
                Long ownerId = cardState.getOwnerMatchPlayerId();
                MatchPlayer owner = matchPlayerRepository.findById(ownerId).orElse(null);
                if (owner != null) {
                    String colorGroup = getPropertyColorGroup(cardProperty.getName());
                    int houseCost = getHousePrice(colorGroup);
                    int sellRefund = cardProperty.getPurchasePrice() / 2;
                    int housesRefund = (cardState.getHouses() != null ? cardState.getHouses() : 0) * (houseCost / 2);
                    int hotelRefund = (cardState.getHotels() != null ? cardState.getHotels() : 0) * (houseCost * 5 / 2);
                    int totalRefund = sellRefund + housesRefund + hotelRefund;

                    owner.setCurrentBalance(owner.getCurrentBalance() + totalRefund);
                    matchPlayerRepository.save(owner);

                    cardState.setOwnerMatchPlayerId(null);
                    cardState.setHouses(0);
                    cardState.setHotels(0);
                    matchPropertyStateRepository.save(cardState);

                    System.out.println("VENDITA IBRIDA: Giocatore " + owner.getId() + " vende " + cardProperty.getName() + " al Banco per ₮" + totalRefund);

                    // Invia evento sensore virtuale di tipo "PROPERTY_SOLD"
                    SensorEvent sellEvent = new SensorEvent();
                    sellEvent.setMatchId(match.getId());
                    sellEvent.setZoneId(zone.getId());
                    sellEvent.setTaggedObjectId(propertyTag.getId());
                    sellEvent.setEventType("PROPERTY_SOLD");
                    sellEvent.setRawPayload(String.format("{\"property\": \"%s\", \"owner\": %d, \"refund\": %d}", 
                            cardProperty.getName(), owner.getId(), totalRefund));
                    sellEvent.setDetectedAt(java.time.LocalDateTime.now().toString());
                    sellEvent.setProcessed(1);
                    sensorEventRepository.save(sellEvent);
                }
                return;
            }
        }

        String zoneCode = "PROP-" + zone.getZoneName().toUpperCase()
                .replace(" ", "-")
                .replace("&", "AND")
                .replace(".", "")
                .replace("/", "")
                .replace("'", "");
        MonopolyProperty zoneProperty = monopolyPropertyRepository.findByPropertyCode(zoneCode);

        if (cardProperty != null && zoneProperty != null) {
            MatchPropertyState cardState = matchPropertyStateRepository.findByMatchIdAndPropertyId(match.getId(), cardProperty.getId());
            MatchPropertyState zoneState = matchPropertyStateRepository.findByMatchIdAndPropertyId(match.getId(), zoneProperty.getId());

            if (cardState != null && zoneState != null && 
                cardState.getOwnerMatchPlayerId() != null && zoneState.getOwnerMatchPlayerId() != null &&
                !cardState.getOwnerMatchPlayerId().equals(zoneState.getOwnerMatchPlayerId())) {

                Long cardOwner = cardState.getOwnerMatchPlayerId();
                Long zoneOwner = zoneState.getOwnerMatchPlayerId();

                // Esegui lo scambio
                cardState.setOwnerMatchPlayerId(zoneOwner);
                zoneState.setOwnerMatchPlayerId(cardOwner);

                // Se ci sono casette/alberghi, vengono demoliti per lo scambio (regola standard)
                cardState.setHouses(0);
                cardState.setHotels(0);
                zoneState.setHouses(0);
                zoneState.setHotels(0);

                matchPropertyStateRepository.save(cardState);
                matchPropertyStateRepository.save(zoneState);

                System.out.println("TRATTATIVA COMPLETATA: Scambiati i proprietari di " + cardProperty.getName() + " e " + zoneProperty.getName() + "!");

                // Invia evento sensore virtuale di tipo "TRADE_SWAP"
                SensorEvent tradeEvent = new SensorEvent();
                tradeEvent.setMatchId(match.getId());
                tradeEvent.setZoneId(zone.getId());
                tradeEvent.setTaggedObjectId(propertyTag.getId());
                tradeEvent.setEventType("TRADE_SWAP");
                tradeEvent.setRawPayload(String.format("{\"prop1\": \"%s\", \"owner1\": %d, \"prop2\": \"%s\", \"owner2\": %d}", 
                        cardProperty.getName(), zoneOwner, zoneProperty.getName(), cardOwner));
                tradeEvent.setDetectedAt(java.time.LocalDateTime.now().toString());
                tradeEvent.setProcessed(1);
                sensorEventRepository.save(tradeEvent);
            }
        }
    }

    private void handlePassCardPlaced(Match match, TaggedObject passTag, ReadingZone zone) {
        String propertyCode = "PROP-" + zone.getZoneName().toUpperCase()
                .replace(" ", "-")
                .replace("&", "AND")
                .replace(".", "")
                .replace("/", "")
                .replace("'", "");
        MonopolyProperty property = monopolyPropertyRepository.findByPropertyCode(propertyCode);
        if (property != null) {
            MatchPropertyState state = matchPropertyStateRepository.findByMatchIdAndPropertyId(match.getId(), property.getId());
            if (state == null || state.getOwnerMatchPlayerId() == null) {
                System.out.println("CARTA PASSO IBRIDA: Giocatore rinuncia all'acquisto. Si apre l'Asta per " + property.getName());
                SensorEvent passEvent = new SensorEvent();
                passEvent.setMatchId(match.getId());
                passEvent.setZoneId(zone.getId());
                passEvent.setTaggedObjectId(passTag.getId());
                passEvent.setEventType("PASS_CARD");
                passEvent.setRawPayload(String.format("{\"property\": \"%s\", \"propertyId\": %d}", 
                        property.getName(), property.getId()));
                passEvent.setDetectedAt(java.time.LocalDateTime.now().toString());
                passEvent.setProcessed(1);
                sensorEventRepository.save(passEvent);
            }
        }
    }


    private void handleDoubleRolled(Match match, TaggedObject doubleTag, ReadingZone zone) {
        MatchPlayer player = matchPlayerRepository.findById(match.getCurrentTurnPlayerId()).orElse(null);
        if (player == null) return;
        System.out.println("GIOCO IBRIDO: Il giocatore " + player.getId() + " ha lanciato un DOPPIO!");
    }

    private void rotateTurn(Match match) {
        java.util.List<MatchPlayer> players = matchPlayerRepository.findByMatchId(match.getId());
        if (players.size() <= 1) return;

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
            MatchPlayer nextPlayer = players.get(testIndex);
            if (nextPlayer.getBankrupt() == null || nextPlayer.getBankrupt() == 0) {
                nextIndex = testIndex;
                break;
            }
        }

        match.setCurrentTurnPlayerId(players.get(nextIndex).getId());
        matchRepository.save(match);
        System.out.println("GIOCO IBRIDO: Turno passato al Giocatore " + match.getCurrentTurnPlayerId());
    }

    // Helper per i gruppi di colore, monopolio e calcolo degli affitti
    private String getPropertyColorGroup(String propName) {
        if (propName == null) return null;
        String name = propName.toLowerCase();
        if (name.contains("mediterranean") || name.contains("baltic")) return "BROWN";
        if (name.contains("oriental") || name.contains("vermont") || name.contains("connecticut")) return "SKY_BLUE";
        if (name.contains("charles") || name.contains("states") || name.contains("virginia")) return "PINK";
        if (name.contains("james") || name.contains("tennessee") || name.contains("new york")) return "ORANGE";
        if (name.contains("kentucky") || name.contains("indiana") || name.contains("illinois")) return "RED";
        if (name.contains("atlantic") || name.contains("ventnor") || name.contains("marvin")) return "YELLOW";
        if (name.contains("pacific") || name.contains("north carolina") || name.contains("pennsylvania av")) return "GREEN";
        if (name.contains("park place") || name.contains("boardwalk")) return "DARK_BLUE";
        if (name.contains("railroad") || name.contains("short line")) return "STATION";
        return null;
    }

    private boolean checkOwnsAllPropertiesOfGroup(Long playerId, Long matchId, String colorGroup) {
        if (colorGroup == null) return false;

        java.util.List<MonopolyProperty> allProps = monopolyPropertyRepository.findAll();
        java.util.List<MonopolyProperty> groupProps = new java.util.ArrayList<>();
        for (MonopolyProperty p : allProps) {
            if (colorGroup.equals(getPropertyColorGroup(p.getName()))) {
                groupProps.add(p);
            }
        }

        if (groupProps.isEmpty()) return false;

        for (MonopolyProperty gp : groupProps) {
            MatchPropertyState state = matchPropertyStateRepository.findByMatchIdAndPropertyId(matchId, gp.getId());
            if (state == null || state.getOwnerMatchPlayerId() == null || !state.getOwnerMatchPlayerId().equals(playerId)) {
                return false;
            }
        }

        return true;
    }

    private int countOwnedPropertiesOfGroup(Long playerId, Long matchId, String colorGroup) {
        if (colorGroup == null || playerId == null) return 0;
        int count = 0;
        java.util.List<MonopolyProperty> allProps = monopolyPropertyRepository.findAll();
        for (MonopolyProperty p : allProps) {
            if (colorGroup.equals(getPropertyColorGroup(p.getName()))) {
                MatchPropertyState state = matchPropertyStateRepository.findByMatchIdAndPropertyId(matchId, p.getId());
                if (state != null && playerId.equals(state.getOwnerMatchPlayerId())) {
                    count++;
                }
            }
        }
        return count;
    }

    private boolean canBuildHouse(Long matchId, String colorGroup, int targetPropertyNewTotalHouses) {
        if (colorGroup == null || "STATION".equals(colorGroup)) return false;
        java.util.List<MonopolyProperty> allProps = monopolyPropertyRepository.findAll();
        for (MonopolyProperty p : allProps) {
            if (colorGroup.equals(getPropertyColorGroup(p.getName()))) {
                MatchPropertyState state = matchPropertyStateRepository.findByMatchIdAndPropertyId(matchId, p.getId());
                int h = 0;
                if (state != null) {
                    h = (state.getHouses() != null ? state.getHouses() : 0) + 
                        (state.getHotels() != null && state.getHotels() > 0 ? 5 : 0);
                }
                if (targetPropertyNewTotalHouses - h > 1) {
                    return false;
                }
            }
        }
        return true;
    }

    private int getHousePrice(String colorGroup) {
        if (colorGroup == null) return 100;
        switch (colorGroup) {
            case "BROWN":
            case "SKY_BLUE":
                return 50;
            case "PINK":
            case "ORANGE":
                return 100;
            case "RED":
            case "YELLOW":
                return 150;
            case "GREEN":
            case "DARK_BLUE":
                return 200;
            default:
                return 100;
        }
    }

    private int calculateDynamicRent(MonopolyProperty property, MatchPropertyState state, String colorGroup, boolean ownsMonopoly) {
        int baseRent = property.getBaseRent();
        if (state == null) return baseRent;

        if ("STATION".equals(colorGroup) && state.getOwnerMatchPlayerId() != null) {
            int count = countOwnedPropertiesOfGroup(state.getOwnerMatchPlayerId(), state.getMatchId(), "STATION");
            if (count == 1) return 25;
            if (count == 2) return 50;
            if (count == 3) return 100;
            if (count >= 4) return 200;
            return 25;
        }

        if (state.getHotels() != null && state.getHotels() > 0) {
            return baseRent * 100;
        }

        int houses = state.getHouses() != null ? state.getHouses() : 0;
        if (houses == 1) return baseRent * 5;
        if (houses == 2) return baseRent * 15;
        if (houses == 3) return baseRent * 40;
        if (houses == 4) return baseRent * 80;

        if (ownsMonopoly) {
            return baseRent * 2; // Affitto raddoppiato se possiede intero gruppo ma senza casette
        }

        return baseRent;
    }

    private void handleAuctionWon(Match match, SensorEvent event) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode payload = mapper.readTree(event.getRawPayload());
            
            long propertyId = payload.get("propertyId").asLong();
            long winnerPlayerId = payload.get("winnerPlayerId").asLong();
            int winningBid = payload.get("winningBid").asInt();
            
            MatchPropertyState propState = matchPropertyStateRepository.findByMatchIdAndPropertyId(match.getId(), propertyId);
            if (propState == null) {
                propState = new MatchPropertyState();
                propState.setMatchId(match.getId());
                propState.setPropertyId(propertyId);
                propState.setMortgaged(0);
                propState.setHouses(0);
                propState.setHotels(0);
            }
            
            MatchPlayer winner = matchPlayerRepository.findById(winnerPlayerId).orElse(null);
            Optional<MonopolyProperty> propOpt = monopolyPropertyRepository.findById(propertyId);
            
            if (winner != null && propOpt.isPresent()) {
                MonopolyProperty property = propOpt.get();
                
                Long prevOwnerId = propState.getOwnerMatchPlayerId();
                if (prevOwnerId != null && !prevOwnerId.equals(winner.getId())) {
                    MatchPlayer prevOwner = matchPlayerRepository.findById(prevOwnerId).orElse(null);
                    if (prevOwner != null) {
                        System.out.println("ASTA: Giocatore " + winner.getId() + " deve pagare fisicamente ₮" + winningBid + " a Giocatore " + prevOwner.getId() + " come venditore.");
                    }
                }
                
                propState.setOwnerMatchPlayerId(winner.getId());
                propState.setHouses(0);
                propState.setHotels(0);
                matchPropertyStateRepository.save(propState);
                
                System.out.println("ASTA COMPLETATA: Giocatore " + winner.getId() + " vince l'asta per " + property.getName() + ". Deve depositare fisicamente ₮" + winningBid + ".");
            }
        } catch (Exception e) {
            System.err.println("Errore processamento AUCTION_WON: " + e.getMessage());
        }
    }
}

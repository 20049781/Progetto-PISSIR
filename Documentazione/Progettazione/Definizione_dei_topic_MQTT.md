L'integrazione tra la componente hardware e l'ecosistema software  si basa sul protocollo MQTT.

Per garantire l'affidabilità del flusso di gioco, la configurazione del Broker risponde ai seguenti vincoli ingegneristici:

- Quality of Service (QoS 1 - At least once): Scelta per garantire che nessun evento critico di gioco vada perso a causa di instabilità della rete.     
- Clean Session impostato a true: Garantisce che al riavvio dell'IoT Gateway non vengano elaborati messaggi obsoleti o accumulati durante un periodo di downtime, preservando la sincronizzazione in tempo reale dello stato della partita corrente.

**Broker**

| Parametro          | Valore               |
| ------------------ | -------------------- |
| URL broker         | tcp://localhost:1883 |
| Client ID backend  | monopoly-iot-backend |
| QoS sottoscrizione | 1 (almeno 1)         |
| Topic sottoscritto | monopoly/sensors/#   |
| Clean session      | true                 |

**Gerarchia dei topic**
La struttura dei topic è progettata secondo un principio di granularità crescente, consentendo un routing efficiente dei messaggi.

| Topic                                            | Direzione            | Descrizione                                                    |
| ------------------------------------------------ | -------------------- | -------------------------------------------------------------- |
| monopoly/sensors/#                               | Device → IoT Gateway | Wildcard: cattura tutti gli eventi da qualsiasi tavolo e zona  |
| monopoly/sensors/{tableCode}/{zoneCode}          | Device → IoT Gateway | Evento generato da una zona RFID specifica di un tavolo fisico |
| monopoly/sensors/{tableCode}/turn                | Device → IoT Gateway | Sensore di turno: segnala il cambio di giocatore attivo        |
| monopoly/sensors/{tableCode}/money/{playerSlot}  | Device → IoT Gateway | Movimento fisico di denaro nel wallet di un giocatore          |
| monopoly/sensors/{tableCode}/property/{zoneCode} | Device → IoT Gateway | Rilevazione di una pedina o oggetto RFID su una casella        |

**Struttura del Payload MQTT**
Ogni messaggio pubblicato deve essere un oggetto JSON compatibile con il modello SensorEvent:

```json

{

  "matchId": 1,

  "zoneId": 12,

  "taggedObjectId": 101,

  "eventType": "ENTER",

  "rawPayload": "{\"source\":\"rfid-reader-1\",\"rssi\":-45}"

}

```

**

**Campi del Payload**

| Campo        | Tipo    | Descrizione                                               |
| ------------ | ------- | --------------------------------------------------------- |
| matchId      | integer | ID della partita a cui associare l’evento                 |
| zoneId       | integer | ID della zona lettura RFID                                |
| taggedObject | integer | ID dell’oggetto RFID rilevato                             |
| eventType    | string  | Tipo di evento (vedi tabella sotto)                       |
| rawPayload   | string  | Payload tecnico opzionale con dati aggiuntivi del sensore |

**Tipi di evento**
Il Game Engine si comporta come una macchina a stati finiti guidata dagli eventi. Gli eventi applicativi inseriti nel payload si dividono rigorosamente in due macro-categorie: Fisici (generati dall'hardware) e Virtuali (scatenati dalle interfacce software).

| Valore          | Categoria     | Significato e azione nel Game Engine                                                                                                           |
| --------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| ENTER           | Fisico (RFID) | Un oggetto RFID entra nella zona di lettura. Il motore valuta se si tratta di una proprietà acquistabile, già occupata o una casella speciale. |
| PRESENT         | Fisico (RFID) | Un oggetto RFID è ancora presente nella zona.                                                                                                  |
| EXIT            | Fisico (RFID) | Un oggetto RFID esce dalla zona di lettura.                                                                                                    |
| AUCTION_WON     | Virtuale      | Asta conclusa: il motore assegna la proprietà al vincitore e aggiorna ‘MatchPropertyState’.                                                    |
| PROPERTY_BOUGHT | Virtuale      | Acquisto diretto: il motore scala il saldo del giocatore e aggiorna ‘MatchPropertyState’.                                                      |
| HOUSE_BUILD     | Virtuale      | Costruzione casa/albergo: il motore aggiorna ‘houses’/’hotels’ in ‘MatchPropertyState’                                                         |
| PROPERTY_SOLD   | Virtuale      | Vendita o rilascio proprietà: il motore trasferisce la proprietà e aggiorna i saldi.                                                           |
| TRADE_SWAP      | Virtuale      | Scambio proprietà tra giocatori.                                                                                                               |
| PASS_CARD       | Virtuale      | Il giocatore corrente rinuncia all’acquisto. Il motore avanza il turno.                                                                        |
****


**
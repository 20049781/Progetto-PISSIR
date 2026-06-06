# Monopoly IoT Platform

Progetto realizzato per il corso di **PISSIR** (Progettazione e Implementazione di Sistemi Software in Rete).

## Descrizione del Progetto
**Monopoly IoT** è una piattaforma software distribuita che integra un tabellone di gioco fisico del Monopoly abilitato con sensori IoT (es. lettori RFID) per tracciare automaticamente lo stato della partita, sincronizzare i dati di gioco in tempo reale ed esporre cruscotti e pannelli interattivi su un frontend web moderno.

Il sistema consente di monitorare l'avanzamento dei match, gestire i tornei a eliminazione diretta, visualizzare le statistiche dei giocatori e raccogliere eventi fisici inviati dal gateway IoT.

---

## Autori
* **Razene Sboui** - Matricola `20049561`
* **Viktar Kupratsevich** - Matricola `20049781`

---

## Architettura del Sistema
Il progetto è basato su un'architettura a microservizi:
1. **API Gateway**: Unico punto di accesso per instradare le richieste dal frontend ai rispettivi servizi.
2. **User Service**: Gestione dell'autenticazione, della registrazione e dei profili utente.
3. **Board Service**: Gestione della configurazione fisica dei tavoli da gioco, dei locali e dei tabelloni.
4. **Match Service**: Logica principale del gioco, gestione dello stato della partita, dei tornei e del motore di calcolo del punteggio.
5. **IoT Gateway**: Servizio che si collega a un broker MQTT per ricevere, decodificare e bufferizzare gli eventi provenienti dai sensori fisici sul tabellone.

Il frontend è realizzato come una Single Page Application in **React** con un design moderno, animazioni e supporto per il monitoraggio in tempo reale (Spectator View).

---

## Requisiti e Avvio
* **Backend**: Java 17+, Maven (tramite Maven Wrapper `.\mvnw.cmd`).
* **Frontend**: Node.js (tramite `npm.cmd`).
* **Database**: SQLite per ciascun microservizio (i file `.db` locali gestiscono lo stato).

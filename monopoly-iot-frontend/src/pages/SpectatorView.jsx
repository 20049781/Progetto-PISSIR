import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const SpectatorView = () => {
  const isFinishedToday = (endTime) => {
    if (!endTime) return false;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    return endTime.startsWith(todayStr);
  };

  const tokenUids = ["TAG-TOKEN-LUCA", "TAG-TOKEN-GIULIA", "TAG-TOKEN-LORENZO", "TAG-TOKEN-MARIO", "TAG-TOKEN-ANNA", "TAG-TOKEN-PAOLO"];
  const playerColors = [
    '#6F1A07',
    '#E65F2B',
    '#2B6CB0',
    '#2F855A',
    '#B83280',
    '#6B46C1'
  ];

  const [allMatches, setAllMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [usersMap, setUsersMap] = useState({});
  const [venuesMap, setVenuesMap] = useState({});
  const [tablesMap, setTablesMap] = useState({});
  const [matchPlayersMap, setMatchPlayersMap] = useState({});
  const [readingZones, setReadingZones] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);
  const [properties, setProperties] = useState([]);
  const [currentTurnId, setCurrentTurnId] = useState(null);
  const [latestCommentary, setLatestCommentaryRaw] = useState("In attesa dei primi rilevamenti fisici sul tabellone...");
  const [commentaryHistory, setCommentaryHistory] = useState(["In attesa dei primi rilevamenti sul tabellone..."]);

  // Wrapper per mantenere lo storico
  const setLatestCommentary = (text) => {
    setLatestCommentaryRaw(text);
    setCommentaryHistory(prev => {
      if (prev[0] === text) return prev;
      return [text, ...prev].slice(0, 8); // Mantieni gli ultimi 8 eventi
    });
  };
  const [highlightEvent, setHighlightEvent] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [speed, setSpeed] = useState(1); // 1 = 1x (Lento), 2 = 2x (Medio), 3 = 3x (Veloce)
  const [activeAuction, setActiveAuction] = useState(null);
  const [selectedPropertyAction, setSelectedPropertyAction] = useState(null);
  const [lastTransaction, setLastTransaction] = useState(null); 
  const [flashedPlayerId, setFlashedPlayerId] = useState(null);
  
  const lastEventIdRef = useRef(null);

  // Calcolo derived state: activeMatch deve essere definito PRIMA di qualsiasi useEffect che lo usa
  const activeMatch = allMatches.find(m => m.id === selectedMatchId);
  const isMatchFinished = activeMatch && (activeMatch.status === 'FINISHED' || (players.length > 1 && players.filter(p => p.bankrupt !== 1).length === 1));
  const winner = isMatchFinished ? (players.find(p => p.bankrupt !== 1) || players[0]) : null;

  const navigate = useNavigate();
  
  // Effetto per la chiusura automatica a fine partita
  useEffect(() => {
    if (isMatchFinished) {
      if (isSimulating) {
        setIsSimulating(false);
      }
      
      const timer = setTimeout(() => {
        // Torna alla schermata di selezione delle partite dopo 8 secondi (più tempo per leggere l'esito)
        setSelectedMatchId(null);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [isMatchFinished, isSimulating]);

  // Riferimento mutabile per evitare ricaricamenti continui dell'effetto di simulazione
  const stateRef = useRef({ players, properties, events, currentTurnId, speed, selectedMatchId, allMatches, activeAuction });
  useEffect(() => {
    stateRef.current = { players, properties, events, currentTurnId, speed, selectedMatchId, allMatches, activeAuction };
  }, [players, properties, events, currentTurnId, speed, selectedMatchId, allMatches, activeAuction]);

  const getPropertyColor = (space) => {
    if (space.id === 2 || space.id === 4) return '#8B4513'; 
    if (space.id === 7 || space.id === 9 || space.id === 10) return '#38B2AC'; 
    if (space.id === 12 || space.id === 14 || space.id === 15) return '#D53F8C'; 
    if (space.id === 17 || space.id === 19 || space.id === 20) return '#DD6B20'; 
    if (space.id === 22 || space.id === 24 || space.id === 25) return '#E53E3E'; 
    if (space.id === 27 || space.id === 28 || space.id === 30) return '#D69E2E'; 
    if (space.id === 32 || space.id === 33 || space.id === 35) return '#319795'; 
    if (space.id === 38 || space.id === 40) return '#3182CE'; 
    if ([6, 16, 26, 36].includes(space.id)) return '#4A5568'; 
    return '#718096'; 
  };

  // Mappatura delle 40 caselle del Monopoly per la simulazione casuale
  const monopolySpaces = [
    { id: 1, name: "Go", type: "GENERIC" },
    { id: 2, name: "Mediterranean Avenue", type: "PLAYER_PROPERTY", propertyId: 1, price: 60, rent: 2 },
    { id: 3, name: "Community Chest", type: "GENERIC" },
    { id: 4, name: "Baltic Avenue", type: "PLAYER_PROPERTY", propertyId: 2, price: 60, rent: 4 },
    { id: 5, name: "Income Tax", type: "GENERIC" },
    { id: 6, name: "Reading Railroad", type: "PLAYER_PROPERTY", propertyId: 3, price: 200, rent: 25 },
    { id: 7, name: "Oriental Avenue", type: "PLAYER_PROPERTY", propertyId: 4, price: 100, rent: 6 },
    { id: 8, name: "Chance", type: "GENERIC" },
    { id: 9, name: "Vermont Avenue", type: "PLAYER_PROPERTY", propertyId: 5, price: 100, rent: 6 },
    { id: 10, name: "Connecticut Avenue", type: "PLAYER_PROPERTY", propertyId: 6, price: 120, rent: 8 },
    { id: 11, name: "Just Visiting / In Jail", type: "GENERIC" },
    { id: 12, name: "St. Charles Place", type: "PLAYER_PROPERTY", propertyId: 7, price: 140, rent: 10 },
    { id: 13, name: "Electric Company", type: "PLAYER_PROPERTY", propertyId: 8, price: 150, rent: 10 },
    { id: 14, name: "States Avenue", type: "PLAYER_PROPERTY", propertyId: 9, price: 140, rent: 10 },
    { id: 15, name: "Virginia Avenue", type: "PLAYER_PROPERTY", propertyId: 10, price: 160, rent: 12 },
    { id: 16, name: "Pennsylvania Railroad", type: "PLAYER_PROPERTY", propertyId: 11, price: 200, rent: 25 },
    { id: 17, name: "St. James Place", type: "PLAYER_PROPERTY", propertyId: 12, price: 180, rent: 14 },
    { id: 18, name: "Community Chest", type: "GENERIC" },
    { id: 19, name: "Tennessee Avenue", type: "PLAYER_PROPERTY", propertyId: 13, price: 180, rent: 14 },
    { id: 20, name: "New York Avenue", type: "PLAYER_PROPERTY", propertyId: 14, price: 200, rent: 16 },
    { id: 21, name: "Free Parking", type: "GENERIC" },
    { id: 22, name: "Kentucky Avenue", type: "PLAYER_PROPERTY", propertyId: 15, price: 220, rent: 18 },
    { id: 23, name: "Chance", type: "GENERIC" },
    { id: 24, name: "Indiana Avenue", type: "PLAYER_PROPERTY", propertyId: 16, price: 220, rent: 18 },
    { id: 25, name: "Illinois Avenue", type: "PLAYER_PROPERTY", propertyId: 17, price: 240, rent: 20 },
    { id: 26, name: "B. & O. Railroad", type: "PLAYER_PROPERTY", propertyId: 18, price: 200, rent: 25 },
    { id: 27, name: "Atlantic Avenue", type: "PLAYER_PROPERTY", propertyId: 19, price: 260, rent: 22 },
    { id: 28, name: "Ventnor Avenue", type: "PLAYER_PROPERTY", propertyId: 20, price: 260, rent: 22 },
    { id: 29, name: "Water Works", type: "PLAYER_PROPERTY", propertyId: 21, price: 150, rent: 10 },
    { id: 30, name: "Marvin Gardens", type: "PLAYER_PROPERTY", propertyId: 22, price: 280, rent: 24 },
    { id: 31, name: "Go To Jail", type: "GENERIC" },
    { id: 32, name: "Pacific Avenue", type: "PLAYER_PROPERTY", propertyId: 23, price: 300, rent: 26 },
    { id: 33, name: "North Carolina Avenue", type: "PLAYER_PROPERTY", propertyId: 24, price: 300, rent: 26 },
    { id: 34, name: "Community Chest", type: "GENERIC" },
    { id: 35, name: "Pennsylvania Avenue", type: "PLAYER_PROPERTY", propertyId: 25, price: 320, rent: 28 },
    { id: 36, name: "Short Line", type: "PLAYER_PROPERTY", propertyId: 26, price: 200, rent: 25 },
    { id: 37, name: "Chance", type: "GENERIC" },
    { id: 38, name: "Park Place", type: "PLAYER_PROPERTY", propertyId: 27, price: 350, rent: 35 },
    { id: 39, name: "Luxury Tax", type: "GENERIC" },
    { id: 40, name: "Boardwalk", type: "PLAYER_PROPERTY", propertyId: 28, price: 400, rent: 50 }
  ];

  // Helper per calcolare coordinate griglia CSS basate sull'indice del Monopoly (0-39)
  const getCellGridCoords = (index) => {
    if (index === 0) return { col: 11, row: 11 }; 
    if (index >= 1 && index <= 9) return { col: 11 - index, row: 11 }; 
    if (index === 10) return { col: 1, row: 11 }; 
    if (index >= 11 && index <= 19) return { col: 1, row: 11 - (index - 10) }; 
    if (index === 20) return { col: 1, row: 1 }; 
    if (index >= 21 && index <= 29) return { col: index - 19, row: 1 }; 
    if (index === 30) return { col: 11, row: 1 }; 
    if (index >= 31 && index <= 39) return { col: 11, row: index - 29 }; 
    return { col: 11, row: 11 };
  };

  // Helper per ottenere un nome compatto ed elegante per le caselle
  const getSpaceShortName = (name) => {
    if (name === "Just Visiting / In Jail") return "Visita";
    if (name === "Go To Jail") return "In Prigione";
    if (name === "Free Parking") return "Parcheggio";
    if (name === "Community Chest") return "Probabilità";
    if (name === "Income Tax") return "Tassa";
    if (name === "Luxury Tax") return "Tassa Lusso";
    if (name === "Chance") return "Imprevisti";
    
    return name
      .replace(" Avenue", "")
      .replace(" Place", "")
      .replace(" Railroad", " R.R.")
      .replace(" Highway", " Hwy")
      .replace("Electric Company", "Elettrica")
      .replace("Water Works", "Acqua");
  };

  const getCellOrientation = (index) => {
    if (index === 0 || index === 10 || index === 20 || index === 30) return "CORNER";
    if (index >= 1 && index <= 9) return "BOTTOM";
    if (index >= 11 && index <= 19) return "LEFT";
    if (index >= 21 && index <= 29) return "TOP";
    if (index >= 31 && index <= 39) return "RIGHT";
    return "CORNER";
  };

  const ownsAllPropertiesOfGroup = (playerId, spaceColor, latestProps) => {
    if (!spaceColor || spaceColor === '#4A5568' || spaceColor === '#718096') return false;
    
    // Trova tutti i propertyId che appartengono a questo colore
    const targetSpaceIds = monopolySpaces
      .filter(s => s.type === "PLAYER_PROPERTY" && getPropertyColor(s) === spaceColor)
      .map(s => s.propertyId);
      
    if (targetSpaceIds.length === 0) return false;
    
    for (const pId of targetSpaceIds) {
      const state = latestProps.find(p => p.propertyId === pId);
      if (!state || state.ownerMatchPlayerId !== playerId) {
        return false;
      }
    }
    return true;
  };

  const renderHousesAndHotels = (houses, hotels, orientation) => {
    if (hotels > 0) {
      return (
        <div className={`absolute z-10 flex items-center justify-center bg-red-600 border border-white rounded shadow-sm
          ${orientation === 'BOTTOM' ? 'top-[-2px] left-1/2 -translate-x-1/2 w-3.5 h-3' : ''}
          ${orientation === 'TOP' ? 'bottom-[-2px] left-1/2 -translate-x-1/2 w-3.5 h-3' : ''}
          ${orientation === 'LEFT' ? 'right-[-2px] top-1/2 -translate-y-1/2 w-3 h-3.5' : ''}
          ${orientation === 'RIGHT' ? 'left-[-2px] top-1/2 -translate-y-1/2 w-3 h-3.5' : ''}
        `}>
          <span className="text-[7px] text-white font-black leading-none">H</span>
        </div>
      );
    }
    if (houses > 0) {
      return (
        <div className={`absolute z-10 flex gap-0.5
          ${orientation === 'BOTTOM' ? 'top-[-2px] left-1/2 -translate-x-1/2 flex-row' : ''}
          ${orientation === 'TOP' ? 'bottom-[-2px] left-1/2 -translate-x-1/2 flex-row' : ''}
          ${orientation === 'LEFT' ? 'right-[-2px] top-1/2 -translate-y-1/2 flex-col' : ''}
          ${orientation === 'RIGHT' ? 'left-[-2px] top-1/2 -translate-y-1/2 flex-col' : ''}
        `}>
          {Array.from({ length: houses }).map((_, i) => (
            <div key={i} className="w-2.5 h-2 bg-emerald-600 border border-white rounded-[2px] shadow-sm flex items-center justify-center">
              <span className="text-[5.5px] text-white font-black leading-none">h</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderCellContent = (space, index, houses = 0, hotels = 0) => {
    const orientation = getCellOrientation(index);
    const color = getPropertyColor(space);
    const shortName = getSpaceShortName(space.name);

    if (orientation === "CORNER") {
      let bgClass = "bg-surface-container";
      let cornerText = space.name;
      if (index === 0) {
        bgClass = "bg-[#ffeb3b]/20 text-red-600";
        cornerText = "◀ VIA";
      } else if (index === 10) {
        cornerText = "Transito";
      } else if (index === 20) {
        cornerText = "Parcheggio";
      } else if (index === 30) {
        cornerText = "In Prigione";
      }
      return (
        <div className={`w-full h-full flex flex-col items-center justify-center p-0.5 leading-none text-center select-none ${bgClass}`}>
          <span className="text-[6px] font-black uppercase tracking-tighter">{cornerText}</span>
          {index === 10 && <span className="text-[5px] text-slate-500 font-bold uppercase mt-0.5">Visita</span>}
        </div>
      );
    }

    const isProp = space.type === "PLAYER_PROPERTY";

    if (orientation === "BOTTOM") {
      return (
        <div className="w-full h-full flex flex-col justify-between items-center p-0.5 select-none relative">
          <span className="text-[5px] font-black uppercase scale-90 leading-tight text-center mt-0.5">{shortName}</span>
          {isProp && (
            <div className="w-full h-1.5 rounded-sm shadow-sm relative" style={{ backgroundColor: color }}>
              {renderHousesAndHotels(houses, hotels, orientation)}
            </div>
          )}
        </div>
      );
    }

    if (orientation === "TOP") {
      return (
        <div className="w-full h-full flex flex-col justify-between items-center p-0.5 select-none relative">
          {isProp && (
            <div className="w-full h-1.5 rounded-sm shadow-sm relative" style={{ backgroundColor: color }}>
              {renderHousesAndHotels(houses, hotels, orientation)}
            </div>
          )}
          <span className="text-[5px] font-black uppercase scale-90 leading-tight text-center mb-0.5">{shortName}</span>
        </div>
      );
    }

    if (orientation === "LEFT") {
      return (
        <div className="w-full h-full flex flex-row justify-between items-center p-0.5 select-none relative">
          <span className="text-[5px] font-black uppercase -rotate-90 scale-90 leading-tight text-center flex-1">{shortName}</span>
          {isProp && (
            <div className="w-1.5 h-full rounded-sm shadow-sm relative" style={{ backgroundColor: color }}>
              {renderHousesAndHotels(houses, hotels, orientation)}
            </div>
          )}
        </div>
      );
    }

    if (orientation === "RIGHT") {
      return (
        <div className="w-full h-full flex flex-row justify-between items-center p-0.5 select-none relative">
          {isProp && (
            <div className="w-1.5 h-full rounded-sm shadow-sm relative" style={{ backgroundColor: color }}>
              {renderHousesAndHotels(houses, hotels, orientation)}
            </div>
          )}
          <span className="text-[5px] font-black uppercase rotate-90 scale-90 leading-tight text-center flex-1">{shortName}</span>
        </div>
      );
    }
  };

  // Risoluzione dinamica dei dettagli giocatore in base alla mappa utenti del database
  const getPlayerDetails = (p) => {
    if (!p) {
      return { name: "Nessuno", username: "", fullname: "Nessuno", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Nessuno&backgroundColor=b6e3f4,c0aede,d1d4f9" };
    }
    const user = p.userId ? usersMap[p.userId] : null;
    if (user) {
      const avatarUrl = user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
      const mainName = user.fullName || user.username;
      const nick = user.username || '';
      return {
        name: mainName,
        username: nick,
        fullname: mainName,
        avatar: avatarUrl,
        ...p
      };
    }
    
    const fallbackName = p.name || `Player ${p.playerOrder || p.userId || 'X'}`;
    return {
      name: fallbackName,
      username: '',
      fullname: fallbackName,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${fallbackName}&backgroundColor=ffdfbf,ffd5dc`,
      ...p
    };
  };

  // Parser dei log hardware RFID in messaggi leggibili per la cronaca live.
  const parseEventToCommentary = (event, currentPlayers = players, currentProperties = properties) => {
    try {
      const payload = JSON.parse(event.rawPayload);
      const isMoney = event.rawPayload.includes("TAG-BILL");
      const isToken = event.rawPayload.includes("TAG-TOKEN");
      const zoneName = payload.zone || "Casella";
      const zone = readingZones.find(z => z.id === event.zoneId);
      const currentTurnPlayer = currentPlayers.find(x => x.id === currentTurnId);
      const currentTurnName = currentTurnPlayer ? getPlayerDetails(currentTurnPlayer).name : "Il giocatore di turno";

      let actor = "Un giocatore";
      if (payload.tag && payload.tag.startsWith("TAG-TOKEN-")) {
        const orderStr = payload.tag.replace("TAG-TOKEN-", "");
        const order = parseInt(orderStr, 10);
        if (!isNaN(order) && currentPlayers.length > 0) {
          const pl = currentPlayers.find(x => x.playerOrder === order);
          if (pl) actor = getPlayerDetails(pl).name;
        }
      }

      if (event.eventType === "AUCTION_WON") {
        const winner = players.find(x => x.id === payload.winnerPlayerId);
        const winnerName = winner ? getPlayerDetails(winner).name : `Giocatore ${payload.winnerPlayerId}`;
        const space = monopolySpaces.find(s => s.propertyId === payload.propertyId);
        return `Asta chiusa: ${winnerName} prende ${space ? space.name : "questa proprietà"}.`;
      }

      if (event.eventType === "TRADE_SWAP") {
        const p1 = currentPlayers.find(x => x.id === payload.owner1);
        const p2 = currentPlayers.find(x => x.id === payload.owner2);
        const name1 = p1 ? getPlayerDetails(p1).name : `Giocatore ${payload.owner1}`;
        const name2 = p2 ? getPlayerDetails(p2).name : `Giocatore ${payload.owner2}`;
        return `Scambio completato: ${name1} e ${name2} si sono accordati su ${payload.prop1} e ${payload.prop2}.`;
      }

      if (event.eventType === "HOUSE_BUILD") {
        const p = currentPlayers.find(x => x.id === payload.owner);
        const name = p ? getPlayerDetails(p).name : `Giocatore ${payload.owner}`;
        if (payload.hotels > 0) {
          return `${name} costruisce un albergo su ${payload.property}.`;
        }
        return `${name} aggiunge una casa su ${payload.property}.`;
      }

      if (event.eventType === "PROPERTY_SOLD") {
        const p = currentPlayers.find(x => x.id === payload.owner);
        const name = p ? getPlayerDetails(p).name : `Giocatore ${payload.owner}`;
        return `${name} vende ${payload.property} al banco.`;
      }

      if (event.eventType === "CARD_DRAW") {
        const typeLabel = zoneName.toLowerCase().includes("chance") ? "IMPREVISTO" : "PROBABILITÀ";
        return `${actor} pesca una carta ${typeLabel.toLowerCase()}: ${payload.card}.`;
      }

      if (event.eventType === "PROPERTY_BOUGHT") {
        const p = currentPlayers.find(x => x.id === payload.owner);
        const name = p ? getPlayerDetails(p).name : `Giocatore ${payload.owner}`;
        return `${name} acquista ${payload.property} dal banco.`;
      }

      if (event.eventType === "RENT_PAID") {
        const payer = currentPlayers.find(x => x.id === payload.payer);
        const owner = currentPlayers.find(x => x.id === payload.owner);
        const payerName = payer ? getPlayerDetails(payer).name : `Giocatore ${payload.payer}`;
        const ownerName = owner ? getPlayerDetails(owner).name : `Giocatore ${payload.owner}`;
        return `${payerName} paga l'affitto a ${ownerName} per ${payload.property}.`;
      }

      if (event.eventType === "PASS_CARD") {
        return `${actor} rinuncia all'acquisto di ${payload.property}. La proprietà va all'asta.`;
      }

      if (isMoney) {
        if (zone && zone.zoneType === "PLAYER_MONEY") {
          const walletPlayer = currentPlayers.find(x => x.playerOrder === zone.playerSlot);
          const walletName = walletPlayer ? getPlayerDetails(walletPlayer).name : `Giocatore ${zone.playerSlot || ""}`.trim();
          if (event.eventType === "EXIT") {
            return `${walletName} preleva banconote dal proprio portafoglio fisico.`;
          }
          return `${walletName} deposita banconote nel proprio portafoglio fisico.`;
        }
        return `Il sensore su ${zoneName} rileva il passaggio di banconote. ${currentTurnName} sta completando il pagamento.`;
      }

      if (isToken) {
        if (event.zoneId === 31) {
          return `${actor} finisce su Vai in Prigione: il turno si chiude qui.`;
        }
        return `${actor} arriva su ${zoneName}.`;
      }

      
      return `Sensore attivato su ${zoneName}: tag ${payload.tag || "sconosciuto"}.`;
    } catch {
      return "Evento sensore ricevuto, ma il payload non è leggibile.";
    }
  };

  const getPositionFromEvent = (playerEvent, fallbackZoneId = 0) => {
    if (!playerEvent) return 0;
    
    // 1. Estrazione esatta tramite zoneCode (es. TBL1-ZONE-CELL-00 = GO = index 0)
    // I zoneCode sono 0-based (CELL-00 a CELL-39), quindi non è necessario sottrarre 1
    const zone = readingZones.find(z => z.id === playerEvent.zoneId);
    if (zone && zone.zoneCode) {
      const match = zone.zoneCode.match(/CELL-(\d+)/);
      if (match) {
        return parseInt(match[1], 10); // 0-based da CELL-00 a CELL-39
      }
    }
    
    // 2. Cerca dal nome zone nel rawPayload per compatibilità
    try {
      const payload = JSON.parse(playerEvent.rawPayload);
      if (payload.zone) {
        const spaceIdx = monopolySpaces.findIndex(s => 
          s.name.toLowerCase() === payload.zone.toLowerCase() || 
          s.name.toLowerCase().includes(payload.zone.toLowerCase())
        );
        if (spaceIdx !== -1) return spaceIdx;
      }
    } catch {}
    
    // 3. Fallback matematico legacy
    return (fallbackZoneId - 1) % 40;
  };

  const getPlayerPosition = (playerId) => {
    const p = players.find(x => x.id === playerId);
    if (!p) return 0;
    const pOrder = p.playerOrder || 1;
    const tokenTag = tokenUids[(pOrder - 1) % tokenUids.length];
    const playerEvent = events.find(e => {
      if (e.eventType !== "ENTER") return false;
      if (!e.rawPayload.includes(tokenTag)) return false;
      
      const zone = readingZones.find(z => z.id === e.zoneId);
      if (zone) {
        return zone.zoneType === "GENERIC" || zone.zoneType === "PLAYER_PROPERTY";
      }
      
      try {
        const payload = JSON.parse(e.rawPayload);
        return payload.zone && payload.zone !== "Turn Sensor" && !payload.zone.includes("Wallet");
      } catch {
        return e.zoneId <= 160;
      }
    });
    
    return getPositionFromEvent(playerEvent, playerEvent ? playerEvent.zoneId : 0);
  };

  const fetchData = async () => {
    try {
      const matchRes = await fetch('/api/matches');
      const matches = await matchRes.json();
      const activeMatches = matches.filter(m => m.status !== 'FINISHED' || isFinishedToday(m.endTime));
      setAllMatches(activeMatches);

      // Sincronizza i giocatori per tutti i match per tenerli aggiornati nel pannello di scelta
      const playersMap = { ...matchPlayersMap };
      for (const m of matches) {
        try {
          const r = await fetch(`/api/matches/${m.id}/players`);
          const pData = await r.json();
          playersMap[m.id] = pData;
        } catch(e) {
          console.error(`Errore caricamento giocatori match #${m.id}:`, e);
        }
      }
      setMatchPlayersMap(playersMap);

      if (selectedMatchId) {
        const activeMatch = matches.find(m => m.id === selectedMatchId);
        if (activeMatch) {
          setCurrentTurnId(activeMatch.currentTurnPlayerId);
        }

        const playersRes = await fetch(`/api/matches/${selectedMatchId}/players`);
        const playersData = await playersRes.json();
        setPlayers(playersData);

        const eventsRes = await fetch(`/api/matches/${selectedMatchId}/events`);
        const eventsData = await eventsRes.json();
        // Ordinamento decrescente per garantire che gli eventi più recenti siano i primi (per muovere le pedine correttamente)
        const sortedEvents = eventsData.sort((a, b) => b.id - a.id);
        setEvents(sortedEvents);

        const propsRes = await fetch(`/api/matches/${selectedMatchId}/properties`);
        const propsData = await propsRes.json();
        setProperties(propsData);

        if (eventsData.length > 0) {
          // Processa tutti i nuovi eventi non ancora visti
          const newEvents = eventsData.filter(e => lastEventIdRef.current === null || e.id > lastEventIdRef.current);
          
          if (newEvents.length > 0) {
            // L'API restituisce gli eventi in ordine decrescente (più recente a index 0)
            // Se li vogliamo processare cronologicamente, li ordiniamo per ID crescente
            const chronologicalNewEvents = [...newEvents].sort((a, b) => a.id - b.id);
            
            chronologicalNewEvents.forEach((evt, idx) => {
              const commentaryText = parseEventToCommentary(evt, playersData, propsData);
              setTimeout(() => {
                setLatestCommentary(commentaryText);
              }, 1200 + (idx * 1500));
            });
            
            lastEventIdRef.current = Math.max(...newEvents.map(e => e.id));
            setHighlightEvent(true);
            setTimeout(() => setHighlightEvent(false), 2000);
          }
        }
      }
    } catch (err) {
      console.error("Errore live arena spectator view:", err);
    }
  };

  const handleSellToBank = async (player, space) => {
    try {
      const activeMatch = allMatches.find(m => m.id === selectedMatchId);
      const tableId = activeMatch ? activeMatch.gameTableId : 1;
      const goZoneId = ((tableId - 1) * 40) + 1; // Casella VIA
      const tagUid = "TAG-PROP-" + space.name.toUpperCase()
        .replace(/ /g, "-").replace(/&/g, "AND").replace(/\./g, "").replace(/\//g, "").replace(/'/g, "");
      const taggedObjId = space.propertyId;

      setLatestCommentary(`${getPlayerDetails(player).name} mette ${space.name} in vendita al banco.`);

      await fetch('/api/matches/simulate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: selectedMatchId,
          zoneId: goZoneId,
          taggedObjectId: taggedObjId,
          eventType: "ENTER",
          rawPayload: JSON.stringify({ tag: tagUid, zone: "VIA" })
        })
      });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const sendSimulatedSensorEvent = async (payload) => {
    const response = await fetch('/api/matches/simulate-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Evento sensore rifiutato (${response.status})`);
    }
    return response.json();
  };

  // Fetch iniziale utenti, locali, tavoli e caricamento elenco partite
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        const m = {};
        data.forEach(u => {
          m[u.id] = u;
        });
        setUsersMap(m);
      })
      .catch(err => console.error("Errore caricamento utenti:", err));

    fetch('/api/venues')
      .then(res => res.json())
      .then(data => {
        const m = {};
        data.forEach(v => {
          m[v.id] = v;
        });
        setVenuesMap(m);
      })
      .catch(err => console.error("Errore caricamento locali:", err));

    fetch('/api/gametables')
      .then(res => res.json())
      .then(data => {
        const m = {};
        data.forEach(t => {
          m[t.id] = t;
        });
        setTablesMap(m);
      })
      .catch(err => console.error("Errore caricamento tavoli:", err));

    fetch('/api/reading-zones')
      .then(res => res.json())
      .then(data => setReadingZones(data))
      .catch(err => console.error("Errore caricamento sensori:", err));

    fetch('/api/matches')
      .then(res => res.json())
      .then(async (data) => {
        const activeMatches = data.filter(m => m.status !== 'FINISHED' || isFinishedToday(m.endTime));
        setAllMatches(activeMatches);
        if (activeMatches.length > 0 && !selectedMatchId) {
          const active = activeMatches.find(m => m.status === 'STARTED') || activeMatches[0];
          if (active) {
            setSelectedMatchId(active.id);
          }
        }

        // Recupera inizialmente i giocatori per tutti i match
        const playersMap = {};
        for (const match of data) {
          try {
            const r = await fetch(`/api/matches/${match.id}/players`);
            const pData = await r.json();
            playersMap[match.id] = pData;
          } catch(e) {
            console.error(e);
          }
        }
        setMatchPlayersMap(playersMap);
      })
      .catch(err => console.error("Errore caricamento partite:", err));
  }, []);

  // Polling dei dati in tempo reale per la partita selezionata
  useEffect(() => {
    if (!selectedMatchId) return;
    
    // Esegue il fetch iniziale in modo asincrono per evitare il rendering a cascata sincrono
    const runInitialFetch = async () => {
      try {
        await fetchData();
      } catch (err) {
        console.error("Errore nel fetch iniziale:", err);
      }
    };
    runInitialFetch();

    const interval = setInterval(fetchData, 1500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMatchId]);

  // Gestione dell'asta virtuale in tempo reale con offerte dei bot e dello spettatore
  useEffect(() => {
    if (!activeAuction) return;
    
    const timerInterval = setInterval(async () => {
      if (activeAuction.timer > 0) {
        let nextBidderId = activeAuction.highestBidderId;
        let nextBid = activeAuction.highestBid;
        let nextTimer = activeAuction.timer - 1;
        
        // Simula rilanci dei bot se in modalità simulazione attiva
        if (isSimulating && Math.random() < 0.55 && activeAuction.timer > 1) {
          const eligible = players.filter(p => 
            p.bankrupt !== 1 && 
            p.currentBalance >= (activeAuction.highestBid + 20) && 
            p.id !== activeAuction.highestBidderId &&
            p.id !== activeAuction.sellerId
          );
          
          if (eligible.length > 0) {
            const bidder = eligible[Math.floor(Math.random() * eligible.length)];
            nextBidderId = bidder.id;
            nextBid = activeAuction.highestBid + (Math.random() < 0.5 ? 10 : 20);
            nextTimer = Math.max(nextTimer, 5); // Aggiunge tempo per controfferte
            setLatestCommentary(`${getPlayerDetails(bidder).name} rilancia per ${activeAuction.property.name}.`);
          }
        }
        
        setActiveAuction(prev => ({ 
          ...prev, 
          highestBid: nextBid, 
          highestBidderId: nextBidderId, 
          timer: nextTimer 
        }));
      } else {
        clearInterval(timerInterval);
        
        if (activeAuction.highestBidderId) {
          const winnerPlayer = players.find(p => p.id === activeAuction.highestBidderId);
          const winnerName = winnerPlayer ? getPlayerDetails(winnerPlayer).name : `Giocatore ${activeAuction.highestBidderId}`;
          setLatestCommentary(`Asta chiusa: ${activeAuction.property.name} va a ${winnerName}.`);
          
          try {
            // Simula pagamento fisico dal Wallet
            const pOrder = winnerPlayer ? (winnerPlayer.playerOrder || 1) : 1;
            const walletZoneId = 161 + pOrder;
            let remaining = activeAuction.highestBid;
            const chips = [
              { val: 500, tagId: 201, uid: "TAG-BILL-500" },
              { val: 100, tagId: 202, uid: "TAG-BILL-100" },
              { val: 50, tagId: 203, uid: "TAG-BILL-50" },
              { val: 20, tagId: 204, uid: "TAG-BILL-20" },
              { val: 10, tagId: 205, uid: "TAG-BILL-10" },
              { val: 5, tagId: 206, uid: "TAG-BILL-5" },
              { val: 1, tagId: 207, uid: "TAG-BILL-1" }
            ];
            for (const chip of chips) {
              while (remaining >= chip.val) {
                remaining -= chip.val;
                await fetch('/api/matches/simulate-event', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({
                     matchId: selectedMatchId,
                     zoneId: walletZoneId,
                     taggedObjectId: chip.tagId,
                     eventType: "EXIT",
                     rawPayload: JSON.stringify({ tag: chip.uid, zone: "Wallet Simulation" })
                   })
                });
                await new Promise(resolve => setTimeout(resolve, 50));
              }
            }
            if (activeAuction.sellerId) {
               const sellerPlayer = players.find(p => p.id === activeAuction.sellerId);
               if (sellerPlayer) {
                 const sellerOrder = sellerPlayer.playerOrder || 1;
                 const sellerZoneId = 161 + sellerOrder;
                 let rem = activeAuction.highestBid;
                 for (const chip of chips) {
                   while (rem >= chip.val) {
                     rem -= chip.val;
                     await fetch('/api/matches/simulate-event', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ matchId: selectedMatchId, zoneId: sellerZoneId, taggedObjectId: chip.tagId, eventType: "ENTER", rawPayload: JSON.stringify({ tag: chip.uid, zone: "Wallet Simulation" }) })
                     });
                     await new Promise(resolve => setTimeout(resolve, 50));
                   }
                 }
               }
            }

            const currentActiveMatch = allMatches.find(m => m.id === selectedMatchId);
            const tableId = currentActiveMatch ? currentActiveMatch.gameTableId : 1;
            const simulatedZoneId = ((tableId - 1) * 40) + activeAuction.property.id;
            
            await fetch('/api/matches/simulate-event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                matchId: selectedMatchId,
                zoneId: simulatedZoneId,
                taggedObjectId: activeAuction.property.propertyId,
                eventType: "AUCTION_WON",
                rawPayload: JSON.stringify({ 
                  propertyId: activeAuction.property.propertyId, 
                  winnerPlayerId: activeAuction.highestBidderId, 
                  winningBid: activeAuction.highestBid 
                })
              })
            });
            await fetchData();
            // Ruota il turno al termine dell'asta
            await fetch(`/api/matches/${selectedMatchId}/rotate-turn`, { method: 'POST' });
            await fetchData();
          } catch(e) { 
            console.error(e); 
          }
        } else {
          setLatestCommentary(`Asta deserta: nessuno rilancia per ${activeAuction.property.name}.`);
          try {
            // Ruota il turno anche se deserta
            await fetch(`/api/matches/${selectedMatchId}/rotate-turn`, { method: 'POST' });
            await fetchData();
          } catch(e) {
            console.error(e);
          }
        }
        setActiveAuction(null);
      }
    }, 1000);
    
    return () => clearInterval(timerInterval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAuction, isSimulating, players, selectedMatchId, allMatches]);

  // Gestione Reset Partita
  const handleResetGame = async () => {
    if (!selectedMatchId) return;
    setIsSimulating(false);
    try {
      await fetch(`/api/matches/${selectedMatchId}/reset`, { method: 'POST' });
      setLatestCommentary(`Partita #${selectedMatchId} resettata. La simulazione è in pausa, pronta per ripartire.`);
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Attiva/Disattiva simulazione casuale con auto-start dei match vuoti/non iniziati
  const handleToggleSimulation = async () => {
    if (!isSimulating && selectedMatchId) {
      let activeMatch = allMatches.find(m => m.id === selectedMatchId);
      let matchPlayers = matchPlayersMap[selectedMatchId] || [];
      
      if (activeMatch && (activeMatch.status === 'CREATED' || matchPlayers.length === 0)) {
        setLatestCommentary("Preparo la partita: iscrivo i giocatori mancanti e avvio il tavolo.");
        try {
          const maxPlayers = activeMatch.maxPlayers || 3;
          for (let i = 1; i <= maxPlayers; i++) {
            await fetch('/api/matches/join', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: i, matchId: selectedMatchId })
            });
          }
          
          await fetchData();
          
          // Recupera l'elenco dei giocatori aggiornato
          const playersRes = await fetch(`/api/matches/${selectedMatchId}/players`);
          const playersData = await playersRes.json();
          
          // Recupera l'activeMatch aggiornato
          const matchRes = await fetch('/api/matches');
          const matches = await matchRes.json();
          const refreshedActiveMatch = matches.find(m => m.id === selectedMatchId);
          
          if (refreshedActiveMatch && refreshedActiveMatch.status === 'CREATED') {
            const firstPlayer = playersData.find(p => p.playerOrder === 1) || playersData[0];
            refreshedActiveMatch.status = "STARTED";
            if (firstPlayer) {
              refreshedActiveMatch.currentTurnPlayerId = firstPlayer.id;
            }
            
            await fetch('/api/matches/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(refreshedActiveMatch)
            });
            
            setLatestCommentary("Partita avviata: giocatori pronti e turno iniziale impostato.");
            await fetchData();
          }
        } catch (e) {
          console.error("Errore durante l'auto-avvio del match di prova:", e);
        }
      }
    }
    const nextState = !isSimulating;
    setIsSimulating(nextState);
    setLatestCommentary(
      nextState
        ? `Simulazione partita #${selectedMatchId} avviata: la cronaca seguirà i sensori del tavolo.`
        : `Simulazione partita #${selectedMatchId} in pausa.`
    );
  };

  // Effetto per la simulazione hardware RFID per il match selezionato
  useEffect(() => {
    if (!isSimulating || !selectedMatchId) return;

    let timeoutId = null;
    let isActive = true;

    const runSimulationStep = async () => {
      if (!isActive) return;
      try {
        const { players: currentPlayers, properties: currentProperties, events: currentEvents, currentTurnId: activeTurnId, speed: currentSpeed, selectedMatchId: currentMatchId, allMatches: currentAllMatches, activeAuction: currentAuction } = stateRef.current;
        const currentActiveMatch = currentAllMatches.find(m => m.id === currentMatchId);
        const tableId = currentActiveMatch ? currentActiveMatch.gameTableId : 1;

        // Tempi dilatati per permettere la lettura della cronaca
        const baseDelay = Math.floor(Math.random() * 10000) + 50000; // Da 50 a 60 secondi
        let nextStepDelay;
        if (currentSpeed === 1) nextStepDelay = baseDelay; // 50s - 60s
        else if (currentSpeed === 2) nextStepDelay = 30000; // 30s
        else nextStepDelay = 10000; // 10s

        if (currentAuction) {
          if (isActive) timeoutId = setTimeout(runSimulationStep, nextStepDelay);
          return;
        }

        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const roll = d1 + d2;

        const activePlayer = currentPlayers.find(p => p.id === activeTurnId);
        if (!activePlayer) {
          if (isActive) timeoutId = setTimeout(runSimulationStep, 3000);
          return;
        }
        
        const pId = activePlayer.id;
        const pOrder = activePlayer.playerOrder || 1;
        const tagId = 100 + pOrder;
        const tagUid = tokenUids[(pOrder - 1) % tokenUids.length];
        
        await new Promise(resolve => setTimeout(resolve, 800));
        if (!isActive) return;
          // --------------------------------------------------

          // Simula uno scambio occasionale di proprietà (5% di probabilità all'inizio del turno)
          if (Math.random() < 0.05 && currentProperties.length > 5) {
            // Trova due proprietà possedute da giocatori diversi
            const ownedProps = currentProperties.filter(p => p.ownerMatchPlayerId !== null);
            if (ownedProps.length >= 2) {
              const prop1 = ownedProps[Math.floor(Math.random() * ownedProps.length)];
              const prop2 = ownedProps.find(p => p.ownerMatchPlayerId !== null && p.ownerMatchPlayerId !== prop1.ownerMatchPlayerId);
              
              if (prop2) {
                // Trovate! Simula lo scambio posizionando la carta di prop1 nella zona di prop2
                const space1 = monopolySpaces.find(s => s.propertyId === prop1.propertyId);
                const space2 = monopolySpaces.find(s => s.propertyId === prop2.propertyId);
                
                if (space1 && space2) {
                  const tagUid = "TAG-PROP-" + space1.name.toUpperCase()
                    .replace(/ /g, "-")
                    .replace(/&/g, "AND")
                    .replace(/\./g, "")
                    .replace(/\//g, "")
                    .replace(/'/g, "");
                  
                  const taggedObjId = prop1.propertyId; 
                  let simulatedZoneId = ((tableId - 1) * 40) + space2.id;
                  if (readingZones && readingZones.length > 0) {
                    const actualZone = readingZones.find(z => z.gameTableId === tableId && z.zoneName.toLowerCase() === space2.name.toLowerCase());
                    if (actualZone) simulatedZoneId = actualZone.id;
                  }

                  console.log(`SIMULAZIONE SCAMBIO: Scansione carta ${tagUid} su zona ${space2.name}`);

                  await fetch('/api/matches/simulate-event', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      matchId: currentMatchId,
                      zoneId: simulatedZoneId,
                      taggedObjectId: taggedObjId,
                      eventType: "ENTER",
                      rawPayload: JSON.stringify({ tag: tagUid, zone: space2.name })
                    })
                  });

                  await fetchData();
                  if (!isActive) return;
                }
              }
            }
          }



          const getLatestPlayerPosition = (playerId) => {
            const p = currentPlayers.find(x => x.id === playerId);
            if (!p) return 0;
            const pOrder = p.playerOrder || 1;
            const tokenTag = tokenUids[(pOrder - 1) % tokenUids.length];
            const playerEvent = currentEvents.find(e => {
              if (e.eventType !== "ENTER") return false;
              if (!e.rawPayload.includes(tokenTag)) return false;
              
              const zone = readingZones.find(z => z.id === e.zoneId);
              if (zone) {
                return zone.zoneType === "GENERIC" || zone.zoneType === "PLAYER_PROPERTY";
              }
              
              try {
                const payload = JSON.parse(e.rawPayload);
                return payload.zone && payload.zone !== "Turn Sensor" && !payload.zone.includes("Wallet");
              } catch {
                return e.zoneId <= 160;
              }
            });
            
            return getPositionFromEvent(playerEvent, playerEvent ? playerEvent.zoneId : 0);
          };

          const currentPos = getLatestPlayerPosition(pId);
          const newPos = (currentPos + roll) % 40;
          const space = monopolySpaces[newPos];

          // Determina il corretto zoneId offset basato sul tavolo associato al match
          let simulatedZoneId = ((tableId - 1) * 40) + space.id;
          if (readingZones && readingZones.length > 0) {
            const paddedIdx = String(newPos).padStart(2, '0');
            const actualZone = readingZones.find(z => 
              z.gameTableId === tableId && 
              z.zoneCode && 
              z.zoneCode.includes(`CELL-${paddedIdx}`)
            ) || readingZones.find(z => z.gameTableId === tableId && z.zoneName.toLowerCase() === space.name.toLowerCase());
            if (actualZone) simulatedZoneId = actualZone.id;
          }

          // Mostra messaggio di lancio dadi PRIMA di muovere la pedina
          setLatestCommentary(`${getPlayerDetails(activePlayer).name} lancia i dadi: esce ${roll} (${d1} + ${d2}).`);
          
          // Crea suspense
          await new Promise(resolve => setTimeout(resolve, 1500));
          if (!isActive) return;

          // Helper per vendere proprietà se il saldo non è sufficiente
          const ensureBalance = async (amount, playerToCheck, pOrder) => {
             let curBal = playerToCheck.currentBalance;
             if (curBal >= amount) return curBal;
             
             const latestPropsRes = await fetch(`/api/matches/${currentMatchId}/properties`);
             const latestProps = await latestPropsRes.json();
             const playerProps = latestProps.filter(p => p.ownerMatchPlayerId === playerToCheck.id);
             
             for (const prop of playerProps) {
                if (curBal >= amount) break;
                
                const spaceDef = monopolySpaces.find(s => s.propertyId === prop.propertyId);
                if (spaceDef) {
                   const sellValue = Math.floor(spaceDef.price / 2);
                   const tagUid = "TAG-PROP-" + spaceDef.name.toUpperCase()
                     .replace(/ /g, "-").replace(/&/g, "AND").replace(/\./g, "").replace(/\//g, "").replace(/'/g, "");
                   
                   let goZoneId = ((tableId - 1) * 40) + 1; // VIA
                   if (readingZones && readingZones.length > 0) {
                     const goZone = readingZones.find(z => z.gameTableId === tableId && z.zoneName.toLowerCase() === "go");
                     if (goZone) goZoneId = goZone.id;
                   }
                   
                   setLatestCommentary(`${getPlayerDetails(playerToCheck).name} vende ${spaceDef.name} al banco.`);
                   
                   await fetch('/api/matches/simulate-event', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({
                       matchId: currentMatchId,
                       zoneId: goZoneId,
                       taggedObjectId: prop.propertyId,
                       eventType: "ENTER",
                       rawPayload: JSON.stringify({ tag: tagUid, zone: "Go" })
                     })
                   });
                   
                   curBal += sellValue;
                   await new Promise(resolve => setTimeout(resolve, 1500));
                   if (!isActive) break;
                }
             }
             return curBal;
          };

          // 1. Invia movimento pedina
          await sendSimulatedSensorEvent({
            matchId: currentMatchId,
            zoneId: simulatedZoneId,
            taggedObjectId: tagId,
            eventType: "ENTER",
            rawPayload: JSON.stringify({ tag: tagUid, zone: space.name })
          });

          await fetchData();
          if (!isActive) return;

          // Helper per muovere le fiches dei bot nella simulazione
          const simulateChips = async (amount, isEnter, pOrder) => {
             let walletZoneId = 161 + pOrder;
             if (readingZones && readingZones.length > 0) {
               const walletZone = readingZones.find(z => z.gameTableId === tableId && z.zoneType === "PLAYER_MONEY" && z.zoneCode && z.zoneCode.endsWith(`P${pOrder}`));
               if (walletZone) walletZoneId = walletZone.id;
             }
             let remaining = Math.abs(amount);
             const chips = [
               { val: 500, tagId: 201, uid: "TAG-BILL-500" },
               { val: 100, tagId: 202, uid: "TAG-BILL-100" },
               { val: 50, tagId: 203, uid: "TAG-BILL-50" },
               { val: 20, tagId: 204, uid: "TAG-BILL-20" },
               { val: 10, tagId: 205, uid: "TAG-BILL-10" },
               { val: 5, tagId: 206, uid: "TAG-BILL-5" },
               { val: 1, tagId: 207, uid: "TAG-BILL-1" }
             ];
             for (const chip of chips) {
               while (remaining >= chip.val) {
                 remaining -= chip.val;
                 if (!isActive) return;
                 await fetch('/api/matches/simulate-event', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      matchId: currentMatchId,
                      zoneId: walletZoneId,
                      taggedObjectId: chip.tagId,
                      eventType: isEnter ? "ENTER" : "EXIT",
                      rawPayload: JSON.stringify({ tag: chip.uid, zone: "Wallet Simulation" })
                    })
                 });
                 await new Promise(resolve => setTimeout(resolve, 100));
               }
             }
          };

          // Controllo Passaggio dal VIA
          if (newPos < currentPos && currentPos !== 30 && newPos !== 30) {
            activePlayer.currentBalance += 200; // Aggiorna stato locale temporaneamente per i prossimi check
            await simulateChips(200, true, pOrder);
            await fetchData();
            setLatestCommentary(`${getPlayerDetails(activePlayer).name} passa dal VIA e ritira lo stipendio.`);
            await new Promise(resolve => setTimeout(resolve, 1500));
            if (!isActive) return;
          }

          // 2. Se è una proprietà, simula transazione
          if (space.type === "PLAYER_PROPERTY") {
            const purchaseDelay = nextStepDelay * 0.35;
            await new Promise(resolve => setTimeout(resolve, purchaseDelay));
            if (!isActive) return;

            const latestPropsRes = await fetch(`/api/matches/${currentMatchId}/properties`);
            const latestProps = await latestPropsRes.json();
            const propState = latestProps.find(p => p.propertyId === space.propertyId);
            
            let auctionStarted = false;

            if (!propState || propState.ownerMatchPlayerId === null) {
              const wantsToBuy = Math.random() > 0.3;
              if (wantsToBuy && activePlayer.currentBalance >= space.price) {
                await simulateChips(space.price, false, pOrder);
                if (!isActive) return;
                
                let simulatedZoneId2 = ((tableId - 1) * 40) + space.id;
                if (readingZones && readingZones.length > 0) {
                  const actualZone = readingZones.find(z => z.gameTableId === tableId && z.zoneName.toLowerCase() === space.name.toLowerCase());
                  if (actualZone) simulatedZoneId2 = actualZone.id;
                }
                
                await fetch('/api/matches/simulate-event', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    matchId: currentMatchId,
                    zoneId: simulatedZoneId2,
                    taggedObjectId: 201,
                    eventType: "ENTER",
                    rawPayload: JSON.stringify({ tag: "TAG-BILL-500", zone: space.name })
                  })
                });
                await fetchData();
                setLatestCommentary(`${getPlayerDetails(activePlayer).name} compra ${space.name}.`);
                setLastTransaction({ type: 'buy', playerOrder: activePlayer.playerOrder, amount: space.price, property: space.name, time: Date.now() });
                setFlashedPlayerId(pId);
                setTimeout(() => setFlashedPlayerId(null), 2500);
              } else {
                auctionStarted = true;
                setActiveAuction({ 
                  property: space, 
                  highestBid: Math.floor(space.price * 0.5), 
                  highestBidderId: null, 
                  timer: 8,
                  sellerId: null 
                });
                setLatestCommentary(`${getPlayerDetails(activePlayer).name} rinuncia a comprare ${space.name}. Si apre l'asta.`);
              }
            } else if (propState.ownerMatchPlayerId !== pId) {
              const ownerPlayer = currentPlayers.find(pl => pl.id === propState.ownerMatchPlayerId);
              if (ownerPlayer) {
                const ownerProps = latestProps.filter(p => p.ownerMatchPlayerId === ownerPlayer.id);
                const spaceDef = monopolySpaces.find(s => s.propertyId === space.propertyId);
                const color = getPropertyColor(spaceDef);
                
                let isMonopoly = false;
                let dynamicRent = spaceDef.rent || 20;
                if (color === '#4A5568') { 
                  const count = ownerProps.filter(p => {
                    const def = monopolySpaces.find(s => s.propertyId === p.propertyId);
                    return def && getPropertyColor(def) === '#4A5568';
                  }).length;
                  dynamicRent = count === 1 ? 25 : count === 2 ? 50 : count === 3 ? 100 : count >= 4 ? 200 : 25;
                } else if (color === '#718096') { 
                  const count = ownerProps.filter(p => {
                    const def = monopolySpaces.find(s => s.propertyId === p.propertyId);
                    return def && getPropertyColor(def) === '#718096';
                  }).length;
                  dynamicRent = count === 2 ? 50 : 20; // Calcolo semplificato dell'affitto delle società
                } else {
                  const colorTotals = {'#8B4513': 2, '#38B2AC': 3, '#D53F8C': 3, '#DD6B20': 3, '#E53E3E': 3, '#D69E2E': 3, '#319795': 3, '#3182CE': 2};
                  const colorCount = ownerProps.filter(p => {
                    const def = monopolySpaces.find(s => s.propertyId === p.propertyId);
                    return def && getPropertyColor(def) === color;
                  }).length;
                  isMonopoly = colorCount === colorTotals[color];
                  
                  const base = space.rent || 20;
                  if (propState.hotels > 0) dynamicRent = base * 100;
                  else if (propState.houses === 4) dynamicRent = base * 80;
                  else if (propState.houses === 3) dynamicRent = base * 40;
                  else if (propState.houses === 2) dynamicRent = base * 15;
                  else if (propState.houses === 1) dynamicRent = base * 5;
                  else if (isMonopoly) dynamicRent = base * 2;
                  else dynamicRent = base;
                }

                const finalBal = await ensureBalance(dynamicRent, activePlayer, pOrder);
                if (!isActive) return;
                const amountToPay = Math.min(finalBal, dynamicRent);
                
                if (amountToPay > 0) {
                  await simulateChips(amountToPay, false, pOrder);
                  if (!isActive) return;
                  await simulateChips(amountToPay, true, ownerPlayer.playerOrder || 1);
                  if (!isActive) return;
                  await fetchData();
                  setLatestCommentary(`${getPlayerDetails(activePlayer).name} paga l'affitto a ${getPlayerDetails(ownerPlayer).name} per ${space.name}.`);
                  setLastTransaction({ type: 'rent', playerOrder: activePlayer.playerOrder, ownerOrder: ownerPlayer.playerOrder, amount: amountToPay, property: space.name, time: Date.now() });
                }
              }
            }

            if (!auctionStarted) {
              const rotateDelay = nextStepDelay * 0.4;
              await new Promise(resolve => setTimeout(resolve, rotateDelay));
              if (!isActive) return;
              await fetch(`/api/matches/${currentMatchId}/rotate-turn`, { method: 'POST' });
              await fetchData();
            }
          } else {
            // Non è una proprietà
            const actionDelay = nextStepDelay * 0.35;
            await new Promise(resolve => setTimeout(resolve, actionDelay));
            if (!isActive) return;

            if (space.name === "Go To Jail") {
              // L'arresto si vede tramite il movimento, ma possiamo mostrare il testo subito dopo.
            } else if (space.name === "Income Tax") {
              const amountToPay = Math.min(await ensureBalance(200, activePlayer, pOrder), 200);
              if (!isActive) return;
              if (amountToPay > 0) await simulateChips(amountToPay, false, pOrder);
              if (!isActive) return;
              await fetchData();
              setLatestCommentary(`${getPlayerDetails(activePlayer).name} paga la tassa sul reddito.`);
            } else if (space.name === "Luxury Tax") {
              const amountToPay = Math.min(await ensureBalance(100, activePlayer, pOrder), 100);
              if (!isActive) return;
              if (amountToPay > 0) await simulateChips(amountToPay, false, pOrder);
              if (!isActive) return;
              await fetchData();
              setLatestCommentary(`${getPlayerDetails(activePlayer).name} paga la tassa di lusso.`);
            } else if (space.name.toLowerCase().includes("chance") || space.name.toLowerCase().includes("community chest")) {
              const balanceEffect = Math.random() < 0.5 ? 100 : -100;
              if (balanceEffect > 0) {
                await simulateChips(balanceEffect, true, pOrder);
                if (!isActive) return;
                await fetchData();
                setLatestCommentary(`${getPlayerDetails(activePlayer).name} pesca una carta favorevole e riceve un premio.`);
              } else {
                const penalty = Math.abs(balanceEffect);
                const amountToPay = Math.min(await ensureBalance(penalty, activePlayer, pOrder), penalty);
                if (!isActive) return;
                if (amountToPay > 0) await simulateChips(amountToPay, false, pOrder);
                if (!isActive) return;
                await fetchData();
                setLatestCommentary(`${getPlayerDetails(activePlayer).name} pesca una carta sfavorevole e paga la tassa.`);
              }
            }

            if (space.id !== 31) {
              const tradeAndBuildDelay = nextStepDelay * 0.4;
              await new Promise(resolve => setTimeout(resolve, tradeAndBuildDelay));
              if (!isActive) return;

              // --- FASE TRATTATIVE E COSTRUZIONE ---
              const propsRes = await fetch(`/api/matches/${currentMatchId}/properties`);
              const allProps = await propsRes.json();
              const myProps = allProps.filter(p => p.ownerMatchPlayerId === pId);
              
              let builtSomething = false;
              const myColors = {};
              for(const p of myProps) {
                 const spaceDef = monopolySpaces.find(s => s.propertyId === p.propertyId);
                 if(spaceDef) {
                    const col = getPropertyColor(spaceDef);
                    if(!myColors[col]) myColors[col] = [];
                    myColors[col].push({propState: p, def: spaceDef});
                 }
              }
              
              const colorTotals = {
                 '#8B4513': 2, '#38B2AC': 3, '#D53F8C': 3, '#DD6B20': 3,
                 '#E53E3E': 3, '#D69E2E': 3, '#319795': 3, '#3182CE': 2
              };
              
              for (const [col, props] of Object.entries(myColors)) {
                 if (colorTotals[col] && props.length === colorTotals[col]) {
                    let target = null;
                    let minHouses = 5;
                    for(const p of props) {
                       const h = (p.propState.houses || 0) + (p.propState.hotels ? 5 : 0);
                       if(h < minHouses) { minHouses = h; target = p; }
                    }
                    if (target && minHouses < 5) {
                       const housePrice = ['#8B4513', '#38B2AC'].includes(col) ? 50 : 
                                          ['#D53F8C', '#DD6B20'].includes(col) ? 100 : 
                                          ['#E53E3E', '#D69E2E'].includes(col) ? 150 : 200;
                       if (activePlayer.currentBalance >= housePrice + 100) {
                          setLatestCommentary(`${getPlayerDetails(activePlayer).name} prepara una costruzione su ${target.def.name}.`);
                          
                          let zoneId = ((tableId - 1) * 40) + target.def.id;
                          if (readingZones && readingZones.length > 0) {
                            const actualZone = readingZones.find(z => z.gameTableId === tableId && z.zoneName.toLowerCase() === target.def.name.toLowerCase());
                            if (actualZone) zoneId = actualZone.id;
                          }
                          
                          const billTag = housePrice === 50 ? {id: 203, uid: "TAG-BILL-50"} :
                                          housePrice === 100 ? {id: 202, uid: "TAG-BILL-100"} :
                                          housePrice === 150 ? {id: 202, uid: "TAG-BILL-100"} :
                                          {id: 202, uid: "TAG-BILL-100"};
                          
                          await fetch('/api/matches/simulate-event', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              matchId: currentMatchId,
                              zoneId: zoneId,
                              taggedObjectId: billTag.id,
                              eventType: "ENTER",
                              rawPayload: JSON.stringify({ tag: billTag.uid, zone: target.def.name })
                            })
                          });
                          builtSomething = true;
                          await new Promise(resolve => setTimeout(resolve, 1500));
                          await fetchData();
                          setLatestCommentary(`${getPlayerDetails(activePlayer).name} completa la costruzione su ${target.def.name}.`);
                          if (!isActive) break;
                       }
                    }
                 }
              }
              
              if (!builtSomething) {
                 for (const [col, props] of Object.entries(myColors)) {
                    if (colorTotals[col] && props.length === colorTotals[col] - 1) {
                       const allColorSpaces = monopolySpaces.filter(s => getPropertyColor(s) === col && s.type === "PLAYER_PROPERTY");
                       const missingSpace = allColorSpaces.find(s => !props.find(p => p.def.id === s.id));
                       if (missingSpace) {
                          const missingPropState = allProps.find(p => p.propertyId === missingSpace.propertyId);
                          if (missingPropState && missingPropState.ownerMatchPlayerId && missingPropState.ownerMatchPlayerId !== pId) {
                             const uselessProp = myProps.find(p => {
                                const def = monopolySpaces.find(s => s.propertyId === p.propertyId);
                                return def && myColors[getPropertyColor(def)] && myColors[getPropertyColor(def)].length === 1;
                             });
                             
                             if (uselessProp) {
                                const otherPlayer = currentPlayers.find(pl => pl.id === missingPropState.ownerMatchPlayerId);
                                if (otherPlayer && activePlayer.currentBalance >= missingSpace.price + 50) {
                                   const uselessDef = monopolySpaces.find(s => s.propertyId === uselessProp.propertyId);
                                   const tagUid = "TAG-PROP-" + uselessDef.name.toUpperCase().replace(/ /g, "-").replace(/&/g, "AND").replace(/\./g, "").replace(/\//g, "").replace(/'/g, "");
                                   
                                   let targetZoneId = ((tableId - 1) * 40) + missingSpace.id;
                                   if (readingZones && readingZones.length > 0) {
                                     const actualZone = readingZones.find(z => z.gameTableId === tableId && z.zoneName.toLowerCase() === missingSpace.name.toLowerCase());
                                     if (actualZone) targetZoneId = actualZone.id;
                                   }
                                   
                                   await fetch('/api/matches/simulate-event', {
                                     method: 'POST',
                                     headers: { 'Content-Type': 'application/json' },
                                     body: JSON.stringify({
                                       matchId: currentMatchId,
                                       zoneId: targetZoneId,
                                       taggedObjectId: uselessProp.propertyId,
                                       eventType: "ENTER",
                                       rawPayload: JSON.stringify({ tag: tagUid, zone: missingSpace.name })
                                     })
                                   });
                                   
                                   if (!isActive) return;
                                   await simulateChips(missingSpace.price, false, pOrder);
                                   if (!isActive) return;
                                   await simulateChips(missingSpace.price, true, otherPlayer.playerOrder || 1);
                                   if (!isActive) return;
                                   await fetchData();
                                   setLatestCommentary(`${getPlayerDetails(activePlayer).name} scambia ${uselessDef.name} con ${getPlayerDetails(otherPlayer).name} per ottenere ${missingSpace.name}.`);
                                   
                                   await new Promise(resolve => setTimeout(resolve, 2000));
                                   break;
                                }
                             }
                          }
                       }
                    }
                 }
              }

              if (!isActive) return;
              await fetch(`/api/matches/${currentMatchId}/rotate-turn`, { method: 'POST' });
              await fetchData();
            } else {
              if (!isActive) return;
              await fetch(`/api/matches/${currentMatchId}/rotate-turn`, { method: 'POST' });
              await fetchData();
          }
        }

        if (isActive) timeoutId = setTimeout(runSimulationStep, nextStepDelay);
      } catch (err) {
        console.error("Errore step simulazione:", err);
        setLatestCommentary(`La simulazione si è fermata su uno step: ${err.message || 'controlla backend e sensori della partita.'}`);
        if (isActive) timeoutId = setTimeout(runSimulationStep, 3000);
      }
    };

    const initialDelay = 400; // Avvio immediato entro 400ms
    timeoutId = setTimeout(runSimulationStep, initialDelay);
    return () => {
      isActive = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isSimulating, speed, selectedMatchId]);

  const getMatchLocationDetails = (match) => {
    const table = tablesMap[match.gameTableId];
    if (!table) return { table: `Tavolo #${match.gameTableId}`, venue: "Locale Sconosciuto", city: "Vercelli" };
    
    const venue = venuesMap[table.venueId];
    return {
      table: table.displayName || `Tavolo ${table.tableCode || table.id}`,
      venue: venue ? venue.name : "La Casa del Monopoly",
      city: venue ? `${venue.city} (${venue.location || 'Piemonte'})` : "Vercelli"
    };
  };

  // activeMatch, isMatchFinished, winner sono calcolati prima dei useEffect (vedi inizio componente)

  return (
    <>
      <style>{`
        .spectator-bg {
          background-color: #FAF6F0;
          background-image: radial-gradient(circle, #DDC0BA 1px, transparent 1px);
          background-size: 32px 32px;
        }
        .monopoly-board {
          display: grid;
          grid-template-columns: 2fr repeat(9, 1fr) 2fr;
          grid-template-rows: 2fr repeat(9, 1fr) 2fr;
        }
        .text-glow {
          text-shadow: 1px 1px 0px rgba(0,0,0,0.1);
        }
        .animate-flash {
          animation: flashGlow 1.5s infinite alternate;
        }
        @keyframes flashGlow {
          from { box-shadow: 0 0 15px rgba(111, 26, 7, 0.2); }
          to { box-shadow: 0 0 30px rgba(111, 26, 7, 0.4); }
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.2);
        }
      `}</style>

      <div className="spectator-bg min-h-screen text-on-background flex flex-col justify-between p-6 overflow-hidden">
        
        <header className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white border border-outline-variant/30 p-4 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="mr-1 p-2 bg-[#FAF6F0] dark:bg-[#1d1c12] hover:bg-[#e6e3d3] dark:hover:bg-[#2b2118] text-[#6f1a07] rounded-xl border border-outline-variant/30 shadow-sm flex items-center justify-center transition-all duration-300 active:scale-95 group"
              title="Torna alla Dashboard"
            >
              <span className="material-symbols-outlined text-lg font-bold group-hover:scale-110 transition-transform duration-300">home</span>
            </button>
            <span className="bg-primary text-white font-black text-[10px] px-3 py-1 rounded tracking-[0.2em] uppercase">REGISTRO LIVE</span>
            <h1 className="text-xl font-extrabold uppercase text-primary tracking-widest font-headline leading-tight">MONOPOLY LIVE ARENA</h1>
            
            
            <div className="h-6 w-[1px] bg-outline-variant/30 mx-2 hidden lg:block"></div>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 bg-[#FAF6F0] hover:bg-outline-variant/20 active:scale-[0.98] px-3.5 py-2 rounded-xl border border-outline-variant/30 shadow-sm transition-all duration-300 group text-glow"
            >
              <span className="material-symbols-outlined text-base text-primary group-hover:rotate-12 transition-transform duration-300">sports_esports</span>
              <span className="text-xs font-black text-on-surface uppercase tracking-wider font-sans flex items-center gap-1.5">
                {selectedMatchId ? (
                  <>
                    <span>Partita #{selectedMatchId}</span>
                    {allMatches.find(m => m.id === selectedMatchId)?.status === 'STARTED' && (
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    )}
                  </>
                ) : (
                  "Scegli Partita"
                )}
              </span>
              <span className="material-symbols-outlined text-sm text-primary/70">expand_more</span>
            </button>
          </div>

          
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button 
              onClick={handleResetGame}
              disabled={!selectedMatchId}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded border border-outline-variant/30 transition-all flex items-center gap-1.5 ${selectedMatchId ? 'bg-outline-variant/20 hover:bg-outline-variant/30 text-on-surface' : 'bg-outline-variant/10 text-on-surface-variant/40 cursor-not-allowed'}`}
            >
              <span className="material-symbols-outlined text-xs">restart_alt</span>
              Reset
            </button>
            <div className="flex items-center gap-1 bg-[#FAF6F0] p-0.5 rounded border border-outline-variant/30">
              <button 
                onClick={() => setSpeed(1)} 
                className={`px-2.5 py-1 text-[9px] font-black rounded uppercase transition-all ${speed === 1 ? 'bg-primary text-white shadow-sm' : 'text-on-surface hover:bg-outline-variant/20'}`}
              >
                1x
              </button>
              <button 
                onClick={() => setSpeed(2)} 
                className={`px-2.5 py-1 text-[9px] font-black rounded uppercase transition-all ${speed === 2 ? 'bg-primary text-white shadow-sm' : 'text-on-surface hover:bg-outline-variant/20'}`}
              >
                2x
              </button>
              <button 
                onClick={() => setSpeed(3)} 
                className={`px-2.5 py-1 text-[9px] font-black rounded uppercase transition-all ${speed === 3 ? 'bg-primary text-white shadow-sm' : 'text-on-surface hover:bg-outline-variant/20'}`}
              >
                3x
              </button>
            </div>
            <button 
              onClick={handleToggleSimulation}
              disabled={!selectedMatchId || isMatchFinished}
              className={`px-4 py-1.5 text-white text-[10px] font-black uppercase tracking-wider rounded transition-all flex items-center gap-1.5 shadow ${!selectedMatchId || isMatchFinished ? 'bg-slate-400 cursor-not-allowed' : (isSimulating ? 'bg-amber-600 hover:bg-amber-700 animate-pulse' : 'bg-green-600 hover:bg-green-700')}`}
            >
              <span className="material-symbols-outlined text-xs">{isSimulating ? 'pause' : 'play_arrow'}</span>
              {isSimulating ? 'Pausa Simulazione' : 'Avvia Simulazione'}
            </button>
            <div className="h-4 w-[1px] bg-outline-variant/40 mx-1 hidden md:block"></div>
            <div className="flex items-center gap-2 text-xs font-bold text-secondary">
              <span>{isSimulating ? 'SIMULAZIONE ATTIVA' : 'SIMULAZIONE IN PAUSA'}</span>
              <div className={`w-2.5 h-2.5 rounded-full ${isSimulating ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
            </div>
          </div>
        </header>

        
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 items-center overflow-hidden">
          
          {/* Monopoly Board Center Stage (7 cols) */}
          <div className="lg:col-span-7 flex justify-center items-center">
            <div className="relative w-full aspect-square max-w-[540px] bg-[#f4fbf7] shadow-xl border border-outline-variant/40 overflow-hidden rounded-lg">
              
              {selectedPropertyAction && (
                <div className="absolute inset-0 bg-[#f4fbf7]/40 backdrop-blur-md z-45 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                  <div className="bg-white/95 border border-outline-variant/30 rounded-2xl p-6 shadow-2xl max-w-sm flex flex-col items-center gap-3.5 w-full">
                    <span className="material-symbols-outlined text-5xl text-primary animate-pulse">real_estate_agent</span>
                    <div>
                      <span className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Gestione Immobiliare</span>
                      <h2 className="text-xl font-black text-on-surface uppercase tracking-wide mt-0.5" style={{ color: getPropertyColor(selectedPropertyAction.property) }}>
                        {selectedPropertyAction.property.name}
                      </h2>
                    </div>

                    <div className="w-full bg-[#FAF6F0] rounded-xl p-3 border border-outline-variant/20 text-xs text-left font-bold text-on-surface-variant flex flex-col gap-1.5">
                      <div className="flex justify-between">
                        <span>Proprietario:</span>
                        <span className="text-on-surface uppercase font-black">
                          {getPlayerDetails(selectedPropertyAction.player).name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Prezzo Originale:</span>
                        <span className="text-on-surface">{selectedPropertyAction.property.price}</span>
                      </div>
                      <div className="flex justify-between border-t border-outline-variant/10 pt-1.5">
                        <span>Rimborso Banco (50%):</span>
                        <span className="text-success font-black">{Math.floor(selectedPropertyAction.property.price * 0.5)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full mt-2">
                      <button
                        onClick={async () => {
                          const { player, property } = selectedPropertyAction;
                          setSelectedPropertyAction(null);
                          await handleSellToBank(player, property);
                        }}
                        className="w-full py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl border border-emerald-700/20 shadow-md flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                      >
                        <span className="material-symbols-outlined text-xs">payments</span>
                        Vendi al Banco
                      </button>

                      <button
                        onClick={() => {
                          const { player, property } = selectedPropertyAction;
                          setSelectedPropertyAction(null);
                          setLatestCommentary(`${getPlayerDetails(player).name} mette ${property.name} all'asta.`);
                          setActiveAuction({
                            property: property,
                            highestBid: Math.floor(property.price * 0.3),
                            highestBidderId: null,
                            timer: 8,
                            sellerId: player.id
                          });
                        }}
                        className="w-full py-2.5 bg-[#6F1A07] text-white text-[10px] font-black uppercase tracking-wider rounded-xl border border-primary/20 shadow-md flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                      >
                        <span className="material-symbols-outlined text-xs">gavel</span>
                        Metti all'Asta
                      </button>

                      <button
                        onClick={() => setSelectedPropertyAction(null)}
                        className="w-full py-2 bg-outline-variant/30 text-on-surface text-[10px] font-black uppercase tracking-wider rounded-xl border border-outline-variant/30 flex items-center justify-center gap-1.5 hover:bg-outline-variant/40 transition-all duration-300"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                </div>
              )}

              
              {activeAuction && (
                <div className="absolute inset-0 bg-[#f4fbf7]/40 backdrop-blur-md z-45 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                  <div className="bg-white/95 border border-[#6F1A07]/20 rounded-2xl p-6 shadow-2xl max-w-sm flex flex-col items-center gap-3.5 w-full">
                    <span className="material-symbols-outlined text-5xl text-[#6F1A07] animate-pulse">gavel</span>
                    <div>
                      <span className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Asta Competitiva</span>
                      <h2 className="text-xl font-black text-on-surface uppercase tracking-wide mt-0.5">Asta in Corso</h2>
                    </div>

                    <div className="text-xs font-bold text-on-surface-variant uppercase px-3 py-1 bg-[#6F1A07]/10 rounded-full">
                      Tempo Rimanente: {activeAuction.timer}s
                    </div>

                    <div className="w-full bg-[#FAF6F0] rounded-xl p-3.5 border border-outline-variant/20">
                      <p className="text-sm font-black uppercase" style={{ color: getPropertyColor(activeAuction.property) }}>
                        {activeAuction.property.name}
                      </p>
                      
                      <div className="border-t border-outline-variant/20 mt-3 pt-3 flex justify-between items-center text-xs font-black">
                        <span className="uppercase text-on-surface-variant text-[10px]">Offerta Massima:</span>
                        <span className="text-secondary text-sm">{activeAuction.highestBid}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-bold mt-1.5 border-t border-outline-variant/10 pt-1.5">
                        <span>Miglior Offerente:</span>
                        <span className="text-primary font-black uppercase">
                          {activeAuction.highestBidderId ? getPlayerDetails(players.find(p => p.id === activeAuction.highestBidderId)).name : "Nessuno"}
                        </span>
                      </div>
                    </div>

                    
                    <div className="flex flex-col gap-1.5 w-full mt-1.5">
                      <span className="text-[8px] font-black text-on-surface-variant/70 uppercase tracking-widest text-center">Rilancia a Nome di:</span>
                      <div className="flex flex-wrap justify-center gap-1">
                        {players.filter(p => p.bankrupt !== 1 && p.currentBalance >= (activeAuction.highestBid + 10) && p.id !== activeAuction.sellerId).map(p => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setActiveAuction(prev => {
                                const nextBid = prev.highestBid + 10;
                                setLatestCommentary(`${getPlayerDetails(p).name} rilancia su ${prev.property.name}.`);
                                return {
                                  ...prev,
                                  highestBid: nextBid,
                                  highestBidderId: p.id,
                                  timer: Math.max(prev.timer, 5)
                                };
                              });
                            }}
                            className="px-2 py-1 text-[8.5px] font-black text-white rounded shadow-sm hover:scale-[1.03] active:scale-[0.98] transition-all uppercase flex items-center gap-1 border border-black/10 animate-fade-in"
                            style={{ backgroundColor: playerColors[(p.playerOrder - 1) % playerColors.length] }}
                          >
                            <span>+10</span>
                            <span>{getPlayerDetails(p).name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              
              {isMatchFinished && (
                <div className="absolute inset-0 bg-[#f4fbf7]/40 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center animate-fade-in animate-scale-up">
                  <div className="bg-white/95 border border-outline-variant/30 rounded-2xl p-6 shadow-2xl max-w-sm flex flex-col items-center gap-3.5 w-full">
                    <span className="material-symbols-outlined text-5xl text-amber-500 animate-bounce">trophy</span>
                    <div>
                      <span className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Partita Terminata</span>
                      <h2 className="text-xl font-black text-on-surface uppercase tracking-wide mt-0.5">VINCITORE!</h2>
                    </div>
                    
                    {winner ? (
                      <>
                        <div className="relative">
                          <img 
                            alt={getPlayerDetails(winner).name} 
                            className="w-16 h-16 rounded-full border-4 border-amber-500 object-cover shadow-lg bg-slate-200"
                            src={getPlayerDetails(winner).avatar} 
                          />
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white font-black text-[8px] px-2.5 py-0.5 rounded-full shadow">
                            CAMPIONE
                          </div>
                        </div>
                        <div className="mt-1">
                          <h3 className="text-lg font-extrabold text-on-surface uppercase leading-tight" style={{ color: playerColors[(winner.playerOrder - 1) % playerColors.length] }}>
                            {getPlayerDetails(winner).name}
                          </h3>
                          {getPlayerDetails(winner).username && (
                            <span className="text-xs font-bold text-amber-900 bg-amber-500/20 px-2 py-0.5 rounded-full mt-1 inline-block">
                              @{getPlayerDetails(winner).username.toLowerCase()}
                            </span>
                          )}
                        </div>
                        
                        <div className="w-full bg-[#FAF6F0] rounded-xl p-3 border border-outline-variant/20">
                          <div className="flex justify-between items-center text-xs font-bold text-on-surface-variant uppercase mb-1">
                            <span>Saldo Finale</span>
                            <span className="text-secondary font-black text-sm">₮ {winner.currentBalance}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold text-on-surface-variant uppercase">
                            <span>Proprietà Possedute</span>
                            <span className="text-primary font-black">
                              {monopolySpaces.filter(s => {
                                if (s.type !== "PLAYER_PROPERTY") return false;
                                const propState = properties.find(pr => pr.propertyId === s.propertyId);
                                return propState && propState.ownerMatchPlayerId === winner.id;
                              }).length}
                            </span>
                          </div>
                        </div>

                        
                        {monopolySpaces.filter(s => {
                          if (s.type !== "PLAYER_PROPERTY") return false;
                          const propState = properties.find(pr => pr.propertyId === s.propertyId);
                          return propState && propState.ownerMatchPlayerId === winner.id;
                        }).length > 0 && (
                          <div className="w-full text-left mt-0.5 border-t border-outline-variant/10 pt-2">
                            <span className="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest block mb-1.5 text-center">Impero Immobiliare</span>
                            <div className="flex flex-wrap justify-center gap-1 max-h-[85px] overflow-y-auto pr-0.5 scrollbar-thin">
                              {monopolySpaces.filter(s => {
                                if (s.type !== "PLAYER_PROPERTY") return false;
                                const propState = properties.find(pr => pr.propertyId === s.propertyId);
                                return propState && propState.ownerMatchPlayerId === winner.id;
                              }).map(space => {
                                const color = getPropertyColor(space);
                                return (
                                  <div 
                                    key={space.id} 
                                    className="px-1.5 py-0.5 rounded text-[8px] font-black text-white uppercase shadow-sm flex items-center gap-1 border border-black/10"
                                    style={{ backgroundColor: color }}
                                    title={space.name}
                                  >
                                    <span className="w-1 h-1 rounded-full bg-white"></span>
                                    <span>{space.name.split(' ')[0]}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-on-surface-variant font-bold">Nessun giocatore ha partecipato.</p>
                    )}

                    <button 
                      onClick={handleResetGame}
                      className="mt-2 w-full py-2 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-xl border border-primary/20 shadow-md flex items-center justify-center gap-1.5 hover:bg-primary/95 transition-all duration-300"
                    >
                      <span className="material-symbols-outlined text-xs">restart_alt</span>
                      Nuova Partita
                    </button>
                  </div>
                </div>
              )}
              <div className="w-full h-full monopoly-board border border-primary/20 bg-[#f4fbf7] relative">
                
                {monopolySpaces.map((space, idx) => {
                  const coords = getCellGridCoords(idx);
                  const isProp = space.type === "PLAYER_PROPERTY";
                  let owner = null;
                  let houses = 0;
                  let hotels = 0;
                  if (isProp) {
                    const propState = properties.find(p => p.propertyId === space.propertyId);
                    if (propState) {
                      if (propState.ownerMatchPlayerId !== null) {
                        owner = players.find(pl => pl.id === propState.ownerMatchPlayerId);
                      }
                      houses = propState.houses || 0;
                      hotels = propState.hotels || 0;
                    }
                  }
                  const ownerColor = owner ? playerColors[(owner.playerOrder - 1) % playerColors.length] : null;

                  return (
                    <div
                      key={space.id}
                      style={{
                        gridColumnStart: coords.col,
                        gridRowStart: coords.row,
                        border: ownerColor ? `2px solid ${ownerColor}` : '1px solid rgba(111, 26, 7, 0.12)',
                        backgroundColor: ownerColor ? `${ownerColor}08` : 'transparent',
                        boxShadow: ownerColor ? `inset 0 0 8px ${ownerColor}15` : 'none',
                        transition: 'all 0.4s ease'
                      }}
                      className="relative w-full h-full flex flex-col items-center justify-between border-outline-variant/30 overflow-hidden"
                    >
                      {renderCellContent(space, idx, houses, hotels)}
                      
                      {owner && (
                        <div 
                          className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full text-[7.5px] font-black text-white flex items-center justify-center shadow-md animate-fade-in z-10"
                          style={{ backgroundColor: ownerColor }}
                          title={`Posseduto da ${getPlayerDetails(owner).name}`}
                        >
                          P{owner.playerOrder}
                        </div>
                      )}
                    </div>
                  );
                })}

                
                <div className="col-start-2 col-end-11 row-start-2 row-end-11 bg-[#f4fbf7]/90 flex flex-col items-center justify-center relative">
                  <div className="text-[28px] font-black tracking-[0.1em] text-[#E60012] select-none uppercase font-serif italic rotate-[-12deg] drop-shadow-md">MONOPOLY</div>
                  <div className="text-[9px] font-black text-[#008000] uppercase tracking-widest mt-1">Live Spectator Center</div>
                </div>

                
                {players.filter(p => !p.bankrupt).map((p) => {
                  const pos = getPlayerPosition(p.id);
                  const coords = getCellGridCoords(pos);
                  
                  const getCellCenter = (c) => {
                    if (c === 1) return (1 / 13) * 100;
                    if (c === 11) return (12 / 13) * 100;
                    return ((c + 0.5) / 13) * 100;
                  };
                  
                  const left = getCellCenter(coords.col);
                  const top = getCellCenter(coords.row);
                  const tokenColor = playerColors[(p.playerOrder - 1) % playerColors.length];
                  
                  // Aggiunge un piccolo offset se più pedine sono sulla stessa casella
                  const sameSpaceCount = players.filter((other) => !other.bankrupt && getPlayerPosition(other.id) === pos && other.playerOrder < p.playerOrder).length;
                  const offsetX = (sameSpaceCount % 2) * 8 - 4;
                  const offsetY = Math.floor(sameSpaceCount / 2) * 8 - 4;

                  return (
                    <div 
                      key={p.id} 
                      style={{ 
                        position: 'absolute',
                        left: `${left}%`,
                        top: `${top}%`,
                        transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
                        zIndex: 40
                      }} 
                      className="flex items-center justify-center transition-all duration-700 ease-in-out p-1"
                    >
                      <div 
                        style={{ backgroundColor: tokenColor }}
                        className="w-6 h-6 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-[10px] text-white font-black relative"
                      >
                        {p.playerOrder}
                        {currentTurnId === p.id && (
                          <div className="absolute -inset-1.5 border-2 rounded-full border-[#6F1A07] animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Commentary & Telecronaca Screen (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6 h-full justify-between">
            
            
            <div className={`flex-1 bg-white border border-outline-variant/30 p-6 rounded-xl flex flex-col justify-center relative min-h-[220px] transition-all duration-300 ${highlightEvent ? 'border-primary shadow-[0_0_20px_rgba(111,26,7,0.15)] scale-[1.01]' : ''}`}>
              <div className="absolute top-4 left-4 flex items-center gap-1.5 border-b border-outline-variant/20 pb-1 w-[calc(100%-32px)]">
                <span className="material-symbols-outlined text-primary text-sm">mic</span>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Cronaca Live di Gioco</span>
              </div>
              
              <div className="mt-8 flex flex-col gap-2 max-h-[160px] overflow-y-auto scrollbar-thin pr-2">
                {commentaryHistory.map((text, idx) => (
                  <div key={idx} className={`p-2 rounded-lg border transition-all duration-500 ${idx === 0 ? 'bg-[#FAF6F0] border-primary/40 shadow-sm' : 'bg-transparent border-transparent opacity-50'}`}>
                    <p className={`font-black text-on-surface leading-snug uppercase font-sans tracking-wide ${idx === 0 ? 'text-lg md:text-xl text-primary text-glow' : 'text-xs'}`}>
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            
            <div className="bg-white border border-outline-variant/30 p-4 rounded-xl">
              <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/20 pb-2 mb-3">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-secondary">receipt_long</span>
                  Registro Transazioni
                </span>
                <span className="text-success flex items-center gap-1">🟢 DB LIVE</span>
              </div>
              {lastTransaction ? (
                <div className={`rounded-xl p-3 border animate-fade-in ${
                  lastTransaction.type === 'buy' ? 'bg-emerald-50 border-emerald-200' :
                  lastTransaction.type === 'rent' ? 'bg-amber-50 border-amber-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        lastTransaction.type === 'buy' ? 'text-emerald-700' :
                        lastTransaction.type === 'rent' ? 'text-amber-700' : 'text-blue-700'
                      }`}>
                        {lastTransaction.type === 'buy' ? '🏙️ Acquisto' :
                         lastTransaction.type === 'rent' ? '💰 Pagamento Affitto' : '🔄 Altro'}
                      </span>
                      <p className="text-sm font-black text-on-surface uppercase mt-0.5">{lastTransaction.property}</p>
                    </div>
                    <span className={`text-lg font-black ${
                      lastTransaction.type === 'buy' ? 'text-emerald-700' : 'text-amber-700'
                    }`}>₮{lastTransaction.amount}</span>
                  </div>
                  <div className="flex gap-2 mt-2 text-[9px] font-bold text-on-surface-variant uppercase">
                    <span>P{lastTransaction.playerOrder} paga</span>
                    {lastTransaction.type === 'rent' && lastTransaction.ownerOrder && (
                      <span className="text-primary">→ P{lastTransaction.ownerOrder} riceve</span>
                    )}
                    {lastTransaction.type === 'buy' && <span className="text-emerald-700">→ Banco</span>}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-[10px] text-on-surface-variant/40 font-bold uppercase">
                  In attesa della prima transazione...
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="p-2 bg-background rounded border border-outline-variant/30 text-center">
                  <span className="text-[8px] font-bold text-on-surface-variant uppercase block">Partita</span>
                  <p className="text-xs font-black text-on-surface">#{selectedMatchId || 'N/A'}</p>
                </div>
                <div className="p-2 bg-background rounded border border-outline-variant/30 text-center">
                  <span className="text-[8px] font-bold text-on-surface-variant uppercase block">Prop. Vendute</span>
                  <p className="text-xs font-black text-on-surface">{properties.filter(p => p.ownerMatchPlayerId !== null).length}</p>
                </div>
                <div className="p-2 bg-background rounded border border-outline-variant/30 text-center">
                  <span className="text-[8px] font-bold text-on-surface-variant uppercase block">Eventi</span>
                  <p className="text-xs font-black text-on-surface">{events.length}</p>
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* Footer: Scoreboard (Bottom Bar) */}
        <footer className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {players.map((p) => {
            const details = getPlayerDetails(p);
            const isCurrent = p.id === currentTurnId;
            const isBankrupt = p.bankrupt === 1;
            const borderCol = isBankrupt 
              ? 'border-error/20 bg-error/5 opacity-60 grayscale' 
              : (isCurrent ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-outline-variant/30 bg-white opacity-85');
            const colorName = p.playerOrder === 1 ? 'text-primary' : p.playerOrder === 2 ? 'text-secondary' : 'text-error';
            const isJail = getPlayerPosition(p.id) === 10 || getPlayerPosition(p.id) === 30;
            const owned = monopolySpaces.filter(space => {
              if (space.type !== "PLAYER_PROPERTY") return false;
              const propState = properties.find(pr => pr.propertyId === space.propertyId);
              return propState && propState.ownerMatchPlayerId === p.id;
            });

            return (
              <div key={p.id} className={`p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 ${borderCol}`}>
                <img alt={details.name} className="w-14 h-14 rounded-full border border-outline-variant/30 object-cover" src={details.avatar} />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`text-[10px] font-black uppercase ${colorName}`}>Giocatore {p.playerOrder}</span>
                      <h4 className="text-base font-extrabold text-on-surface uppercase">{details.name}</h4>
                      {details.username && (
                        <p className="text-xs font-bold text-[#6f1a07] tracking-wide">@{details.username.toLowerCase()}</p>
                      )}
                    </div>
                    {isCurrent && (
                      <span className="bg-primary text-white font-black text-[9px] px-2 py-0.5 rounded">TURNO</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2 border-t border-outline-variant/20 pt-2">
                    <span className={`text-lg font-black transition-all duration-500 ${
                      flashedPlayerId === p.id ? 'text-success scale-110 animate-pulse' : 'text-secondary'
                    }`}>₮ {p.currentBalance}</span>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase">
                      {isBankrupt ? "💀 BANCAROTTA" : (isJail ? "🚨 IN PRIGIONE" : "🏃 SUL CAMPO")}
                    </span>
                  </div>
                  
                  
                  {owned.length > 0 ? (
                    <div className="mt-2.5 border-t border-outline-variant/10 pt-2">
                      <div className="flex flex-wrap gap-1">
                        {owned.map(space => {
                          const color = getPropertyColor(space);
                          return (
                            <div 
                              key={space.id} 
                              className="px-1.5 py-0.5 rounded text-[8px] font-black text-white uppercase shadow-sm flex items-center gap-1 border border-black/10 cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all"
                              style={{ backgroundColor: color }}
                              title={`${space.name} - Gestisci proprietà`}
                              onClick={() => setSelectedPropertyAction({ player: p, property: space })}
                            >
                              <span className="w-1 h-1 rounded-full bg-white"></span>
                              <span>{space.name.split(' ')[0]}</span>
                              <span className="material-symbols-outlined text-[9px] text-white/90 hover:text-red-200 transition-colors ml-0.5 font-bold">payments</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5 border-t border-outline-variant/10 pt-1.5 text-[8px] text-on-surface-variant/40 font-bold uppercase italic">
                      Nessuna Proprietà
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </footer>

        
        {isDrawerOpen && (
          <>
            
            <div 
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 transition-opacity duration-300"
            />
            
            
            <div className="fixed top-0 bottom-0 left-0 w-full max-w-[420px] bg-white h-full shadow-[5px_0_30px_rgba(0,0,0,0.2)] z-50 flex flex-col p-6 border-r border-outline-variant/30 animate-slide-in overflow-hidden">
              
              
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4 mb-4">
                <div>
                  <span className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Arena Spettatori Live</span>
                  <h2 className="text-xl font-extrabold uppercase text-on-surface tracking-wider font-headline">Scegli Partita</h2>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center hover:bg-outline-variant/10 text-on-surface-variant hover:text-error transition-all duration-300"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {allMatches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 bg-[#FAF6F0] rounded-xl border border-dashed border-outline-variant/30">
                    <span className="material-symbols-outlined text-4xl text-outline-variant/70 mb-3">sports_esports</span>
                    <h4 className="text-xs font-black uppercase text-on-surface">Nessuna Partita</h4>
                    <p className="text-[10px] text-on-surface-variant mt-1 max-w-[200px]">
                      Non ci sono partite in corso o registrate. Crea una nuova partita dalla plancia del gestore o del giocatore.
                    </p>
                  </div>
                ) : (
                  allMatches.map(match => {
                    const isCurrent = match.id === selectedMatchId;
                    const mPlayers = matchPlayersMap[match.id] || [];
                    const loc = getMatchLocationDetails(match);
                    
                    const isLive = match.status === 'STARTED';
                    const statusLabel = match.status === 'STARTED' ? "In Corso" : 
                                       (match.status === 'CREATED' ? "In Attesa" : 
                                       (match.status === 'FINISHED' ? "Terminata" : match.status));
                    const statusBg = match.status === 'STARTED' ? "bg-red-100 border-red-200" : 
                                     (match.status === 'CREATED' ? "bg-[#6B8E23]/10 border-[#6B8E23]/20" : 
                                     (match.status === 'FINISHED' ? "bg-slate-500/10 border-slate-500/30" : "bg-amber-500/10 border-amber-500/30"));
                    const statusColor = match.status === 'STARTED' ? "text-red-800" : 
                                        (match.status === 'CREATED' ? "text-[#6B8E23] dark:text-[#A3C86D]" : 
                                        (match.status === 'FINISHED' ? "text-slate-500" : "text-amber-600"));

                    return (
                      <div 
                        key={match.id}
                        onClick={() => {
                          setSelectedMatchId(match.id);
                          setIsDrawerOpen(false);
                        }}
                        className={`group p-4 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col justify-between hover:scale-[1.01] hover:shadow-md ${isCurrent ? 'border-primary bg-primary/[0.03] ring-1 ring-primary/30 shadow-sm' : 'border-outline-variant/30 bg-white hover:border-primary/50'}`}
                      >
                        
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-on-surface">Partita #{match.id}</span>
                            {isCurrent && (
                              <span className="bg-primary text-white font-black text-[8px] px-1.5 py-0.5 rounded tracking-wide uppercase">
                                In Visione
                              </span>
                            )}
                          </div>
                          
                          <span className={`flex items-center gap-1 font-black text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusBg} ${statusColor}`}>
                            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>}
                            {statusLabel}
                          </span>
                        </div>

                        
                        <div className="space-y-1.5 mb-3 text-[10px] text-on-surface-variant">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-primary/70">location_on</span>
                            <span className="font-extrabold text-on-surface">{loc.venue}</span>
                            <span>• {loc.city}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-secondary/70">sports_esports</span>
                            <span className="font-bold">{loc.table}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[9px] font-bold text-on-surface-variant/80">
                            <span className="material-symbols-outlined text-xs">calendar_today</span>
                            <span>Programmata: {match.scheduledTime}</span>
                          </div>
                        </div>

                        
                        <div className="border-t border-outline-variant/20 pt-3 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-on-surface-variant/60 uppercase tracking-widest">Giocatori Iscritti</span>
                            <span className="text-[10px] font-bold text-on-surface mt-0.5">
                              {mPlayers.length} / {match.maxPlayers ?? '?'}
                            </span>
                          </div>

                          
                          <div className="flex -space-x-2 overflow-hidden">
                            {mPlayers.map(p => {
                              const details = getPlayerDetails(p);
                              return (
                                <img 
                                  key={p.id}
                                  alt={details.name}
                                  title={details.fullname}
                                  className="w-6 h-6 rounded-full border-2 border-white object-cover shadow-sm bg-slate-200"
                                  src={details.avatar} 
                                />
                              );
                            })}
                            {mPlayers.length === 0 && (
                              <span className="text-[9px] font-bold uppercase text-on-surface-variant/40 italic">
                                Nessun giocatore
                              </span>
                            )}
                          </div>
                        </div>

                        {/* CTA button (visible on hover for not currently selected matches) */}
                        {!isCurrent && (
                          <div className="mt-3 overflow-hidden h-0 group-hover:h-7 transition-all duration-300 ease-out flex items-center">
                            <div className="w-full text-center py-1 bg-primary text-white text-[9px] font-black uppercase tracking-wider rounded border border-primary/20 shadow-sm flex items-center justify-center gap-1 hover:bg-primary/95 transition-all">
                              <span className="material-symbols-outlined text-xs">visibility</span>
                              <span>Connettiti a questa Arena</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default SpectatorView;

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const VenuesAndBoardsManagement = () => {
  const [venues, setVenues] = useState([]);
  const [gameTables, setGameTables] = useState([]);
  const [readingZones, setReadingZones] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTableId, setExpandedTableId] = useState(null);
  const [deletingMatchId, setDeletingMatchId] = useState(null);
  const [startingMatchId, setStartingMatchId] = useState(null);

  const userStr = localStorage.getItem('monopoly_user');
  const user = userStr ? JSON.parse(userStr) : { role: 'player' };
  const role = user.role || 'player';
  const isSuperAdmin = role === 'super_admin';

  // Stato modale per la registrazione del tavolo
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableForm, setTableForm] = useState({
    displayName: '',
    tableCode: '',
    status: 'ACTIVE'
  });
  const [tableError, setTableError] = useState('');
  const [tableSuccess, setTableSuccess] = useState('');

  const loadData = () => {
    Promise.all([
      fetch('/api/venues/list').then(res => res.json()),
      fetch('/api/reading-zones').then(res => res.json()),
      fetch('/api/gametables').then(res => res.json()),
      fetch('/api/matches').then(res => res.json())
    ])
      .then(([venueList, zonesList, tablesList, matchesList]) => {
        setVenues(venueList);
        setReadingZones(zonesList);
        setGameTables(Array.isArray(tablesList) ? tablesList : []);
        setMatches(Array.isArray(matchesList) ? matchesList : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenTableModal = () => {
    // Usa il conteggio reale dei tavoli esistenti per generare un codice univoco
    const nextNum = gameTables.length + 1;
    const paddedNum = String(nextNum).padStart(2, '0');
    setTableForm({
      displayName: `Tabellone Nexus-${paddedNum}`,
      tableCode: `TBL-ARCHIVE-${paddedNum}`,
      status: 'ACTIVE'
    });
    setTableError('');
    setTableSuccess('');
    setShowTableModal(true);
  };

  const handleSaveTable = (e) => {
    e.preventDefault();
    setTableError('');
    setTableSuccess('');

    if (!tableForm.displayName || !tableForm.tableCode) {
      setTableError("Tutti i campi sono obbligatori.");
      return;
    }

    const payload = {
      venueId: venues[0]?.id || 1,
      gameTypeId: 1,
      displayName: tableForm.displayName,
      tableCode: tableForm.tableCode,
      status: tableForm.status
    };

    fetch('/api/gametables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) return res.text().then(txt => { throw new Error(txt || 'Errore durante la registrazione del tavolo.'); });
        return res.json();
      })
      .then(data => {
        setTableSuccess("Tavolo registrato con successo!");
        setTimeout(() => {
          setShowTableModal(false);
          setTableSuccess('');
          loadData();
        }, 1500);
      })
      .catch(err => {
        setTableError(err.message || "Errore nel salvataggio del tavolo.");
      });
  };



  const getSensorsForTable = (table) => {
    let list = readingZones.filter(z => z.gameTableId === table.id);
    // Fallback: se il tavolo fisico non ha ancora sensori specifici registrati, 
    // mostra lo schema standard dei sensori di gioco (Tavolo 1) clonandolo per questo tavolo.
    if (list.length === 0 && table.id !== 1) {
      list = readingZones.filter(z => z.gameTableId === 1).map(z => ({
        ...z,
        id: `${table.id}-${z.id}`,
        zoneCode: z.zoneCode.replace('TBL1-', `TBL${table.id}-`)
      }));
    }
    return list;
  };

  if (loading) {
    return <div className="p-12 text-center text-on-surface-variant">Caricamento...</div>;
  }

  const mainVenue = venues.length > 0 ? venues[0] : null;
  const otherVenues = venues.length > 1 ? venues.slice(1) : [];

  let totalBoards = 0;
  venues.forEach(v => totalBoards += v.tables.length);

  const venueTableIds = mainVenue ? mainVenue.tables.map(t => t.id) : [];
  const scheduledMatches = matches.filter(m => 
    venueTableIds.includes(m.gameTableId) && 
    (m.status === 'CREATED' || m.status === 'SCHEDULED' || m.status === 'STARTED')
  );

  const getTableName = (tableId) => {
    const table = gameTables.find(t => t.id === tableId);
    return table ? (table.displayName || table.name) : `Tavolo #${tableId}`;
  };

  const handleStartMatch = (matchId) => {
    if (!window.confirm(`Vuoi avviare la partita #${matchId} adesso?`)) return;
    setStartingMatchId(matchId);
    fetch(`/api/matches/${matchId}/start-match`, { method: 'POST' })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }
        return res.text();
      })
      .then(msg => {
        alert(msg);
        loadData();
      })
      .catch(err => {
        console.error(err);
        alert(err.message || "Errore nell'avvio della partita");
      })
      .finally(() => {
        setStartingMatchId(null);
      });
  };

  const handleCancelMatch = (matchId) => {
    if (!window.confirm(`Sei sicuro di voler annullare e cancellare la partita #${matchId}?`)) return;
    setDeletingMatchId(matchId);
    fetch(`/api/matches/${matchId}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error("Errore durante la cancellazione della partita");
        alert("Partita cancellata con successo!");
        loadData();
      })
      .catch(err => {
        console.error(err);
        alert(err.message || "Errore nella cancellazione della partita");
      })
      .finally(() => {
        setDeletingMatchId(null);
      });
  };

  return (
    <div className="flex-1 overflow-y-auto px-10 py-8 relative">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-primary leading-none mb-2">La Tua Sede</h2>
          <p className="text-on-surface-variant font-medium">Gestisci i tavoli da gioco Monopoly Live e monitora lo stato della connettività dei sensori in tempo reale.</p>
        </div>

      </div>

      <div className="grid grid-cols-12 gap-6">
        {mainVenue ? (
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low rounded-xl p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-l from-surface-container-low to-transparent"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-black uppercase tracking-widest rounded-full">Sede Principale</span>
              <span className="text-on-surface-variant flex items-center gap-1 text-xs">
                <span className="material-symbols-outlined text-sm">location_on</span>
                {mainVenue.city}, {mainVenue.location}
              </span>
            </div>
            <h3 className="text-3xl font-extrabold text-on-surface mb-6">{mainVenue.name}</h3>
            
            <div className="grid grid-cols-12 gap-4">
              {mainVenue.tables.map(table => {
                const isExpanded = expandedTableId === table.id;
                const sensors = getSensorsForTable(table);
                
                return (
                  <div 
                    key={table.id} 
                    className={`bg-surface-container-lowest p-5 rounded-xl border transition-all ${
                      isExpanded 
                        ? 'col-span-12 border-[#6f1a07]/30 shadow-md' 
                        : 'col-span-12 md:col-span-6 border-transparent hover:border-outline-variant/40'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">ID Dispositivo</p>
                        <p className="font-mono text-sm font-semibold">{table.tableCode || table.code || `TBL-ARCHIVE-0${table.id}`}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${table.status === 'ACTIVE' ? 'bg-secondary-fixed text-on-secondary-fixed-variant' : 'bg-surface-container-high text-on-surface-variant'}`}>{table.status}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary">sensors</span>
                        <span className="text-xs font-semibold">{table.displayName || table.name}</span>
                      </div>
                      <button
                        onClick={() => setExpandedTableId(isExpanded ? null : table.id)}
                        className="px-3 py-1 bg-surface-container-high hover:bg-outline-variant/20 rounded-lg text-[10px] font-extrabold uppercase tracking-tight transition-all flex items-center gap-1 text-[#6f1a07]"
                      >
                        <span className="material-symbols-outlined text-xs">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                        <span>{isExpanded ? 'Chiudi' : 'Sensori'}</span>
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-6 pt-5 border-t border-outline-variant/10 space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-on-surface-variant">Sensori Mappati ({sensors.length})</span>
                          <span className="text-[10px] text-on-surface-variant/70 italic">Stato Connessione Hardware</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                          {sensors.map(sensor => {
                            const isConnected = table.status === 'ACTIVE';
                            return (
                              <div key={sensor.id} className="bg-surface-container-low/50 border border-outline-variant/5 rounded-lg p-3 flex justify-between items-center text-xs">
                                <div className="space-y-0.5">
                                  <p className="font-mono text-[10px] text-[#6f1a07] font-semibold">{sensor.zoneCode}</p>
                                  <p className="font-bold text-on-surface">{sensor.zoneName}</p>
                                  <p className="text-[8px] text-on-surface-variant/60 uppercase font-black">{sensor.zoneType}</p>
                                </div>
                                <div className="flex items-center gap-1.5 pl-3">
                                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                  <span className={`text-[10px] font-bold ${isConnected ? 'text-green-700' : 'text-on-surface-variant'}`}>
                                    {isConnected ? 'CONNESSO' : 'DISCONNESSO'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                          {sensors.length === 0 && (
                            <p className="col-span-2 text-center text-on-surface-variant py-4 italic text-xs">Nessun sensore configurato per questo tabellone.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {mainVenue.tables.length === 0 && (
                 <p className="text-on-surface-variant text-sm">Nessun tabellone configurato per questa sede.</p>
              )}
            </div>
          </div>
        </div>
        ) : (
          <div className="col-span-12 lg:col-span-8 bg-surface-container-low rounded-xl p-8 flex items-center justify-center">
            <p className="text-on-surface-variant">Nessuna sede configurata.</p>
          </div>
        )}

        <div className="col-span-12 lg:col-span-4 bg-[#4c0900] rounded-xl p-8 text-white flex flex-col justify-between">
          <div>
            <h4 className="text-xl font-bold mb-1 opacity-90">Stato della Rete</h4>
            <p className="text-sm opacity-60">Prestazioni aggregate in tempo reale.</p>
          </div>
          <div className="my-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium opacity-80">Connettività Tabelloni</span>
              <span className="text-lg font-bold">100%</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-secondary-container w-full"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
              <span className="opacity-70">Tavoli Rilevati</span>
              <span className="font-bold">{totalBoards}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="opacity-70">Avvisi Critici</span>
              <span className="font-bold text-[#ffb4a3]">0</span>
            </div>
          </div>
        </div>

        <div className="col-span-12 mt-4">
          <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>event_upcoming</span>
                <h3 className="text-2xl font-extrabold text-on-surface">Partite in Programma o in Corso</h3>
              </div>
              <span className="px-3 py-1 bg-primary-container text-[#FFEDAC] text-[10px] font-black uppercase tracking-widest rounded-full">
                {scheduledMatches.length} partita/e
              </span>
            </div>

            {scheduledMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scheduledMatches.map(match => (
                  <div key={match.id} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 hover:border-primary/20 shadow-sm transition-all duration-300 transform hover:-translate-y-1 relative group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-primary/10 text-primary px-3 py-1 rounded-lg font-bold text-xs">
                        ID Partita: #{match.id}
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${match.status === 'STARTED' ? 'bg-[#6B8E23]/10 text-[#6B8E23] dark:text-[#A3C86D] border border-[#6B8E23]/20' : 'bg-amber-100 text-amber-800'}`}>
                        {match.status === 'STARTED' ? 'In Corso' : 'In Programma'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="material-symbols-outlined text-secondary text-sm">location_on</span>
                        <span className="font-semibold text-on-surface">{getTableName(match.gameTableId)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="material-symbols-outlined text-secondary text-sm">schedule</span>
                        <span className="text-on-surface-variant font-medium">Orario: {match.scheduledTime || 'Subito'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="material-symbols-outlined text-secondary text-sm">group</span>
                        <span className="text-on-surface-variant font-medium">Capienza: Max {match.maxPlayers || 4} Giocatori</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-outline-variant/10 flex gap-3">
                      {match.status !== 'STARTED' && (
                        <button
                          onClick={() => handleStartMatch(match.id)}
                          disabled={startingMatchId !== null || deletingMatchId !== null}
                          className={`flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 shadow-sm ${(startingMatchId !== null || deletingMatchId !== null) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {startingMatchId === match.id ? 'autorenew' : 'play_arrow'}
                          </span>
                          <span>{startingMatchId === match.id ? 'Avvio...' : 'Avvia Partita'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleCancelMatch(match.id)}
                        disabled={startingMatchId !== null || deletingMatchId !== null}
                        className={`py-2 px-3 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white border border-red-200/50 hover:border-red-500 font-bold rounded-lg text-xs transition-all flex items-center justify-center ${match.status === 'STARTED' ? 'flex-1' : ''} ${(startingMatchId !== null || deletingMatchId !== null) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Cancella Partita"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {deletingMatchId === match.id ? 'autorenew' : 'delete'}
                        </span>
                        {deletingMatchId === match.id ? 'Cancellazione...' : (match.status === 'STARTED' ? 'Interrompi e Cancella' : '')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface-container-lowest border border-dashed border-outline-variant/30 rounded-xl p-8 text-center flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 mb-3">calendar_today</span>
                <p className="font-bold text-sm text-on-surface mb-1">Nessuna partita in programma</p>
                <p className="text-xs text-on-surface-variant">Non ci sono ancora partite pianificate o in attesa di giocatori per i tavoli di questa sede.</p>
              </div>
            )}
          </div>
        </div>

      </div>



    </div>
  );
};

export default VenuesAndBoardsManagement;

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const TournamentManagement = () => {
  const [venueName, setVenueName] = useState('La Casa del Monopoly');
  const [venueCity, setVenueCity] = useState('Vercelli');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  
  const [activeTournament, setActiveTournament] = useState(null);
  const [bracketMatches, setBracketMatches] = useState([]);
  const [showTourneyModal, setShowTourneyModal] = useState(false);
  const [tourneyName, setTourneyName] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [tourneyError, setTourneyError] = useState('');
  const [tourneySuccess, setTourneySuccess] = useState('');
  const [tournamentsList, setTournamentsList] = useState([]);
  const [timeHorizon, setTimeHorizon] = useState('ALL');

  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleMatchId, setScheduleMatchId] = useState(null);
  const [venuesList, setVenuesList] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [scheduledTime, setScheduledTime] = useState(() => {
    const now = new Date();
    const tzoffset = now.getTimezoneOffset() * 60000;
    return new Date(now - tzoffset).toISOString().slice(0, 16);
  });
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const userStr = localStorage.getItem('monopoly_user');
  const user = userStr ? JSON.parse(userStr) : { role: 'player' };
  const isSuperAdmin = user.role === 'super_admin';

  const handleSelectTournament = (t) => {
    setActiveTournament(t);
    setLoading(true);
    fetch(`/api/tournaments/${t.id}/bracket`)
      .then(res => res.json())
      .then(bracket => {
        setBracketMatches(bracket || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchDynamicData = () => {
    fetch('/api/analytics/leaderboard')
      .then(res => res.json())
      .then(data => {
        const onlyPlayers = (data.allPlayers || []).filter(u => u.username !== 'gestore_gioco' && u.username !== 'admin_user' && u.username !== 'gestore_locale');
        setPlayers(onlyPlayers);
      })
      .catch(err => console.error("Error fetching players:", err));

    fetch('/api/tournaments')
      .then(res => res.json())
      .then(data => {
        setTournamentsList(data || []);
        if (data && data.length > 0) {
          setActiveTournament(prev => {
            const matched = prev ? data.find(t => t.id === prev.id) : null;
            const active = matched || data.find(t => t.status === 'ONGOING') || data[0];

            
            fetch(`/api/tournaments/${active.id}/bracket`)
              .then(res => res.json())
              .then(bracket => {
                if (bracket) setBracketMatches(bracket);
              })
              .catch(err => console.error("Error fetching bracket:", err));

            return active;
          });
        }
      })
      .catch(err => console.error("Error fetching tournaments:", err));
  };

  useEffect(() => {
    const userStr = localStorage.getItem('monopoly_user');
    let userId = null;
    if (userStr) {
      const user = JSON.parse(userStr);
      userId = user.id;
    }

    const fetchVenue = userId
      ? fetch(`/api/venues/dashboard/${userId}`)
        .then(res => {
          if (!res.ok) throw new Error("Dashboard not found");
          return res.json();
        })
        .then(data => ({
          name: data.venueName,
          city: 'Vercelli'
        }))
      : fetch('/api/venues/list')
        .then(res => res.json())
        .then(data => data && data.length > 0 ? data[0] : null);

    
    fetch('/api/venues/list')
      .then(res => res.json())
      .then(data => {
        setVenuesList(data);
        if (data.length > 0) {
          setSelectedVenueId(data[0].id.toString());
          if (data[0].tables && data[0].tables.length > 0) {
            setSelectedTableId(data[0].tables[0].id.toString());
          }
        }
      })
      .catch(err => console.error("Error loading venues list:", err));

    Promise.all([
      fetchVenue
        .then(data => {
          if (data) {
            setVenueName(data.name || data.venueName || 'La Casa del Monopoly');
            setVenueCity(data.city || 'Vercelli');
          }
        })
        .catch(err => {
          console.warn("Errore nel caricamento della sede dinamica, uso valore predefinito:", err);
        }),
      fetch('/api/analytics/leaderboard')
        .then(res => res.json())
        .then(data => {
          const onlyPlayers = (data.allPlayers || []).filter(u => u.username !== 'gestore_gioco' && u.username !== 'admin_user' && u.username !== 'gestore_locale');
          setPlayers(onlyPlayers);
        })
        .catch(err => console.error("Error fetching players:", err)),
      fetch('/api/tournaments')
        .then(res => res.json())
        .then(data => {
          setTournamentsList(data || []);
          if (data && data.length > 0) {
            const active = data.find(t => t.status === 'ONGOING') || data[0];
            setActiveTournament(active);
            return fetch(`/api/tournaments/${active.id}/bracket`);
          }
          return null;
        })
        .then(res => res ? res.json() : null)
        .then(bracket => {
          if (bracket) setBracketMatches(bracket);
        })
        .catch(err => console.error("Error fetching tournaments:", err))
    ]).finally(() => {
      setLoading(false);
    });

    const interval = setInterval(fetchDynamicData, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOpenModal = () => setShowTourneyModal(true);
    window.addEventListener('open-create-tournament-modal', handleOpenModal);
    return () => window.removeEventListener('open-create-tournament-modal', handleOpenModal);
  }, []);

  const handleVenueChange = (venueId) => {
    setSelectedVenueId(venueId);
    const venue = venuesList.find(v => v.id.toString() === venueId);
    if (venue && venue.tables && venue.tables.length > 0) {
      setSelectedTableId(venue.tables[0].id.toString());
    } else {
      setSelectedTableId('');
    }
  };

  const formatDateTime = (rawDateTime) => {
    if (!rawDateTime) return 'Subito';
    try {
      const date = new Date(rawDateTime);
      if (isNaN(date.getTime())) return rawDateTime;

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${day}/${month}/${year} alle ore ${hours}:${minutes}`;
    } catch {
      return rawDateTime;
    }
  };

  const togglePlayer = (id) => {
    setSelectedPlayers(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handleCreateTournament = (e) => {
    e.preventDefault();
    setTourneyError('');
    setTourneySuccess('');

    if (!tourneyName.trim()) {
      setTourneyError("Inserisci il nome del torneo");
      return;
    }
    if (selectedPlayers.length < 2) {
      setTourneyError("Seleziona almeno 2 giocatori");
      return;
    }

    const payload = {
      name: tourneyName,
      venueId: selectedVenueId || null,
      playerIds: selectedPlayers
    };

    fetch('/api/tournaments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }
        return res.json();
      })
      .then(data => {
        setTourneySuccess(`Torneo '${data.name}' creato con successo!`);
        setTimeout(() => {
          setShowTourneyModal(false);
          setTourneySuccess('');
          window.location.reload();
        }, 1500);
      })
      .catch(err => {
        console.error(err);
        setTourneyError(err.message || "Errore nella creazione del torneo");
      });
  };

  const handleDeleteTournament = () => {
    if (!activeTournament || !window.confirm(`Sei sicuro di voler cancellare il torneo '${activeTournament.name}' e tutti i suoi match?`)) return;

    fetch(`/api/tournaments/${activeTournament.id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error("Errore durante la cancellazione");
        window.location.reload();
      })
      .catch(err => {
        console.error(err);
        alert(err.message);
      });
  };

  const handleCreateMatch = (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    if (!selectedTableId) {
      setCreateError("Seleziona un tavolo");
      return;
    }

    const payload = {
      gameTableId: parseInt(selectedTableId),
      scheduledTime: formatDateTime(scheduledTime),
      maxPlayers: parseInt(maxPlayers)
    };

    fetch('/api/matches/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }
        return res.json();
      })
      .then(data => {
        setCreateSuccess(`Partita creata con successo! ID: #${data.id}`);
        setTimeout(() => {
          setShowCreateModal(false);
          setCreateSuccess('');
          window.location.reload();
        }, 1500);
      })
      .catch(err => {
        console.error(err);
        setCreateError(err.message || "Errore nella creazione della partita");
      });
  };

  const handleAdvanceRound = () => {
    if (!activeTournament) return;
    fetch(`/api/tournaments/${activeTournament.id}/advance-round`, { method: 'POST' })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }
        return res.json();
      })
      .then(data => {
        alert(`Generati ${data.matchesCreated} nuovi match!`);
        window.location.reload();
      })
      .catch(err => {
        console.error(err);
        alert(err.message);
      });
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    if (!scheduleMatchId) return;

    const payload = {
      gameTableId: parseInt(selectedTableId),
      scheduledTime: formatDateTime(scheduledTime)
    };

    fetch(`/api/matches/${scheduleMatchId}/schedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        if (!res.ok) throw new Error("Errore durante la riprogrammazione");
        alert("Partita riprogrammata con successo!");
        setShowScheduleModal(false);
        window.location.reload();
      })
      .catch(err => {
        console.error(err);
        alert(err.message);
      });
  };

  const formatTourneyDate = (rawDate) => {
    if (!rawDate) return '';
    try {
      const date = new Date(rawDate);
      if (isNaN(date.getTime())) return '';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  };

  const filteredTournamentsList = tournamentsList.filter(t => {
    if (timeHorizon === 'ALL') return true;
    if (!t.startDate) return false;
    try {
      const tDate = new Date(t.startDate);
      const now = new Date();
      
      
      const diffTime = tDate - now;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (timeHorizon === 'TODAY') {
        const isToday = tDate.getDate() === now.getDate() &&
          tDate.getMonth() === now.getMonth() &&
          tDate.getFullYear() === now.getFullYear();
        return isToday;
      } else if (timeHorizon === 'WEEK') {
        return diffDays >= -7 && diffDays <= 7;
      } else if (timeHorizon === 'MONTH') {
        return diffDays >= -30 && diffDays <= 30;
      }
      return true;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (timeHorizon !== 'ALL' && filteredTournamentsList.length > 0) {
      const exists = filteredTournamentsList.some(t => activeTournament && t.id === activeTournament.id);
      if (!exists) {
        handleSelectTournament(filteredTournamentsList[0]);
      }
    }
  }, [timeHorizon, filteredTournamentsList]);

  if (loading) {
    return <div className="p-12 text-center text-on-surface-variant font-['Inter']">Sincronizzazione dati torneo dal DB...</div>;
  }

  // Determina un vincitore (winnerId) di riserva se la partita è finita ma il campo è vuoto
  const enrichedBracketMatches = (bracketMatches || []).map(m => {
    if (m.status === 'FINISHED' && !m.winnerId && m.players) {
      let maxBal = -1;
      let wId = null;
      m.players.forEach(p => {
        if (p.balance != null && p.balance > maxBal) {
          maxBal = p.balance;
          wId = p.userId;
        }
      });
      return { ...m, winnerId: wId };
    }
    return m;
  });

  // Determina se c'è un vincitore finale del torneo
  let tournamentWinner = null;
  if (enrichedBracketMatches.length > 0) {
    const readyWinners = new Set();
    enrichedBracketMatches.forEach(m => {
      if (m.status === 'FINISHED' && m.winnerId) {
        let alreadyAdvanced = false;
        enrichedBracketMatches.forEach(laterMatch => {
          if (laterMatch.id > m.id) {
            if (laterMatch.players.some(mp => mp.userId === m.winnerId)) {
              alreadyAdvanced = true;
            }
          }
        });
        if (!alreadyAdvanced) {
          readyWinners.add(m.winnerId);
        }
      }
    });

    const allMatchesFinished = enrichedBracketMatches.every(m => m.status === 'FINISHED' || m.status === 'CANCELLED');
    if (allMatchesFinished && readyWinners.size === 1) {
      tournamentWinner = Number([...readyWinners][0]);
    }
  }



  const candidates = players.filter(p => p.wantsTournament);

  const getPlayerAvatar = (player) => {
    if (!player) return `https://api.dicebear.com/7.x/adventurer/svg?seed=Unknown&backgroundColor=b6e3f4`;
    if (player.avatar) return player.avatar;
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(player.username)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  };

  const getPlayerName = (player) => {
    if (!player) return 'Unknown';
    const mainName = player.fullName || player.username;
    if (player.username) {
      return `${mainName} @${player.username.toLowerCase()}`;
    }
    return mainName;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-['Inter']">
      
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <h2 className="text-4xl font-extrabold tracking-tight text-primary">Campionato {venueName}</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            
            <div className="flex bg-surface-container-high/40 border border-outline-variant/20 p-0.5 rounded-xl gap-0.5 w-full sm:w-[240px] h-[44px] items-center">
              {[
                { id: 'ALL', label: 'Tutte' },
                { id: 'TODAY', label: 'Oggi' },
                { id: 'WEEK', label: 'Settimana' },
                { id: 'MONTH', label: 'Mese' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTimeHorizon(tab.id)}
                  className={`flex-1 h-full rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
                    timeHorizon === tab.id
                      ? 'bg-[#4c0900] text-[#fef9e9] shadow-sm'
                      : 'text-on-surface-variant/80 hover:bg-outline-variant/10 hover:text-on-surface'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            
            {tournamentsList.length > 0 && (
              <div className="flex items-center gap-2 bg-surface-container-high/40 border border-outline-variant/25 px-4 rounded-xl h-[44px] w-full sm:w-[340px]">
                <span className="material-symbols-outlined text-primary text-base">emoji_events</span>
                <select
                  value={activeTournament ? activeTournament.id : ''}
                  onChange={(e) => {
                    const selectedId = Number(e.target.value);
                    const matched = tournamentsList.find(t => t.id === selectedId);
                    if (matched) handleSelectTournament(matched);
                  }}
                  className="bg-transparent text-on-surface text-xs font-black outline-none border-none cursor-pointer uppercase tracking-wider pr-1 w-full"
                >
                  {filteredTournamentsList.length > 0 ? (
                    filteredTournamentsList.map(t => (
                      <option key={t.id} value={t.id} className="bg-surface-container-high text-on-surface font-semibold">
                        {t.name} ({t.status === 'FINISHED' ? 'Terminato' : (t.status === 'ONGOING' ? 'In Corso' : 'Creato')}{t.startDate ? ` • ${formatTourneyDate(t.startDate)}` : ''})
                      </option>
                    ))
                  ) : (
                    <option value="" className="bg-surface-container-high text-on-surface font-semibold">Nessun Torneo</option>
                  )}
                </select>
              </div>
            )}
          </div>
        </div>

        
        {activeTournament && !isSuperAdmin && (
          <div className="w-full md:w-auto self-stretch md:self-auto flex items-end">
            <button
              onClick={handleAdvanceRound}
              className="bg-[#4c0900] text-white px-5 rounded-xl font-bold text-sm hover:bg-[#6f1a07] transition-all shadow-sm flex items-center justify-center gap-2 animate-fade-in w-full md:w-auto h-[44px]"
            >
              <span className="material-symbols-outlined text-lg">play_circle</span>
              Genera Turno ({activeTournament.name})
            </button>
          </div>
        )}
      </section>

      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/20 overflow-x-auto">
            <div className="flex justify-between items-center mb-10">
              <h3 className="headline text-lg font-bold text-on-surface">Hub Avanzamento Turni</h3>
              {activeTournament && !isSuperAdmin && (
                <div className="flex gap-4">
                  <button onClick={handleDeleteTournament} className="text-xs font-bold uppercase tracking-widest text-error flex items-center gap-1 hover:text-error/80 transition-colors">
                    Elimina Torneo
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              )}
            </div>
            {activeTournament ? (
              <div className="flex flex-col gap-4">
                {tournamentWinner && (() => {
                  const winnerUser = players.find(u => u.id === tournamentWinner);
                  return (
                    <div className="bg-[#F1E8C7] dark:bg-[#2C1916] rounded-2xl p-6 mb-2 flex flex-col sm:flex-row items-center justify-between shadow-[0_8px_30px_rgba(91,15,24,0.04)] gap-6 animate-scale-in">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-[#5B0F18] text-[#FFEDAC] flex items-center justify-center shadow-[0_8px_20px_rgba(91,15,24,0.12)]">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v3c0 2.21 1.79 4 4 4h2.27c.49 1.04 1.35 1.86 2.4 2.2L11 20H8v2h8v-2h-3l-.67-3.8c1.05-.34 1.91-1.16 2.4-2.2H17c2.21 0 4-1.79 4-4V7c0-1.1-.9-2-2-2zM5 10V7h2v3c0 1.1-.9 2-2 2zm14 0c-1.1 0-2-.9-2-2V7h2v3z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-[#8B2635] dark:text-[#FFEDAC]/90 font-black text-2xl uppercase tracking-wider mb-1">
                            {winnerUser ? (winnerUser.fullName || winnerUser.username) : `Player ${tournamentWinner}`}
                          </h4>
                          <p className="text-[#5B0F18] dark:text-white font-black text-2xl uppercase tracking-wider">
                            ha vinto il torneo!
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="bg-[#FFEDAC] text-[#5B0F18] px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-md whitespace-nowrap">
                          Torneo Concluso
                        </span>
                      </div>
                    </div>
                  );
                })()}
                <div className={`px-6 py-4 rounded-xl border flex justify-between items-center shadow-sm transition-all
                  ${tournamentWinner
                    ? 'bg-[#6B8E23]/10 border-[#6B8E23]/20 shadow-[0_4px_20px_rgba(107,142,35,0.03)]'
                    : 'bg-blue-500/10 border-blue-500/20 shadow-[0_4px_20px_rgba(59,130,246,0.03)]'
                  }`}
                >
                  <div>
                    <h4 className={`font-extrabold text-lg ${tournamentWinner ? 'text-[#6B8E23] dark:text-[#A3C86D]' : 'text-blue-800 dark:text-blue-400'}`}>
                      {activeTournament.name}
                    </h4>
                    <p className={`text-xs font-semibold mt-0.5 ${tournamentWinner ? 'text-[#6B8E23]/80 dark:text-[#A3C86D]/80' : 'text-blue-700/80 dark:text-blue-400/80'}`}>
                      {tournamentWinner
                        ? 'Fase: Turni di Eliminazione Diretta • Concluso con Successo'
                        : 'Fase: Turni di Eliminazione Diretta • Round in corso'
                      }
                    </p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black shadow-sm uppercase tracking-wider flex items-center gap-1
                    ${tournamentWinner ? 'bg-[#6B8E23]/10 text-[#6B8E23] dark:text-[#A3C86D] border border-[#6B8E23]/20' : 'bg-blue-600 text-white'}`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {tournamentWinner ? 'check_circle' : 'pending'}
                    </span>
                    {tournamentWinner ? 'Completato' : 'Round in corso'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {enrichedBracketMatches.map(m => (
                    <div key={m.id} className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-xl shadow-[0px_4px_16px_rgba(43,33,24,0.04)] relative overflow-hidden group hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-center text-[10px] font-black text-on-surface-variant/70 uppercase tracking-widest mb-4 border-b border-outline-variant/20 pb-2">
                        <div className="flex items-center gap-2">
                          <span>Match #{m.id}</span>
                          {m.status !== 'FINISHED' && m.status !== 'CANCELLED' && !isSuperAdmin && (
                            <button
                              onClick={() => { setScheduleMatchId(m.id); setShowScheduleModal(true); }}
                              className="text-primary hover:text-primary/70 transition-colors"
                              title="Riprogramma Partita"
                            >
                              <span className="material-symbols-outlined text-sm">edit_calendar</span>
                            </button>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 border
                          ${m.status === 'FINISHED'
                            ? 'bg-[#6B8E23]/10 text-[#6B8E23] dark:text-[#A3C86D] border-[#6B8E23]/20'
                            : 'bg-blue-500/10 text-blue-700 border-blue-500/20'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[10px] font-black">
                            {m.status === 'FINISHED' ? 'check_circle' : 'pending'}
                          </span>
                          {m.status === 'FINISHED' ? 'Completato' : 'In Attesa'}
                        </span>
                      </div>
                      <div className="space-y-3 relative z-10">
                        {m.players.map(p => {
                          const user = players.find(u => u.id === p.userId);
                          const isWinner = m.winnerId === p.userId;
                          const isLoser = m.status === 'FINISHED' && !isWinner;

                          return (
                            <div key={p.userId} className={`flex items-center justify-between p-3 rounded-lg border ${isWinner ? 'bg-secondary/10 border-secondary/30' : (isLoser ? 'bg-surface-variant/50 border-transparent opacity-60' : 'bg-surface-container-high border-outline-variant/20')}`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm overflow-hidden ${isWinner ? 'bg-secondary' : 'bg-surface-container-highest'}`}>
                                  {user ? <img src={getPlayerAvatar(user)} alt={user.username} className="w-full h-full object-cover" /> : <span className="font-black text-xs uppercase text-on-surface">?</span>}
                                </div>
                                <div>
                                  <span className={`text-sm block leading-none ${isWinner ? 'font-bold text-on-surface' : 'font-semibold text-on-surface-variant'}`}>
                                    {user ? getPlayerName(user) : `Player ${p.userId}`}
                                  </span>
                                  {isWinner && (
                                    <span className="text-[9px] font-bold text-secondary uppercase tracking-widest mt-1 block">
                                      {tournamentWinner === p.userId && tournamentWinner === m.winnerId && tournamentWinner !== null ? (
                                        <span className="inline-flex items-center gap-1.5 align-middle">
                                          <svg className="w-3.5 h-3.5 text-amber-500 fill-current shrink-0" viewBox="0 0 24 24">
                                            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v3c0 2.21 1.79 4 4 4h2.27c.49 1.04 1.35 1.86 2.4 2.2L11 20H8v2h8v-2h-3l-.67-3.8c1.05-.34 1.91-1.16 2.4-2.2H17c2.21 0 4-1.79 4-4V7c0-1.1-.9-2-2-2zM5 10V7h2v3c0 1.1-.9 2-2 2zm14 0c-1.1 0-2-.9-2-2V7h2v3z" />
                                          </svg>
                                          <span>VINCITORE DEL TORNEO</span>
                                        </span>
                                      ) : 'Avanza al turno'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className={`text-sm font-mono font-bold ${isWinner ? 'text-secondary' : 'text-on-surface-variant'}`}>
                                ₮{p.balance}
                              </span>
                            </div>
                          );
                        })}
                        {m.players.length === 1 && (
                          <div className="flex items-center justify-between p-3 rounded-lg border bg-surface-variant/30 border-transparent border-dashed">
                            <span className="text-sm font-medium text-on-surface-variant/50 italic">In attesa sfidante...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-64 text-on-surface-variant italic text-center p-6 space-y-2">
                <span className="material-symbols-outlined text-4xl text-outline-variant/60">account_tree</span>
                <p className="font-semibold text-sm">Nessun torneo ad eliminazione in corso</p>
                <p className="text-xs not-italic max-w-md">Utilizza il pulsante "Crea Torneo" per generare un nuovo tabellone a eliminazione diretta e associare i giocatori ai match iniziali.</p>
              </div>
            )}
          </div>

          
          <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 shadow-[0px_12px_32px_rgba(43,33,24,0.06)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="headline text-lg font-bold text-on-surface">Registro della Classifica</h3>
            </div>
            <div className="overflow-hidden">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                    <th className="pb-2 text-center pl-4">Posizione</th>
                    <th className="pb-2 pl-2">Giocatore</th>
                    <th className="pb-2 text-center">Partite Giocate</th>
                    <th className="pb-2 text-center">Stato</th>
                    <th className="pb-2 text-center pr-4">Punteggio</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {players.map((p, index) => (
                    <tr key={p.id} className="bg-surface-container-low/30 hover:bg-surface-container-low transition-colors rounded-lg">
                      <td className="py-3 text-center pl-4 font-bold text-primary rounded-l-lg">#{p.rank || (index + 1)}</td>
                      <td className="py-3 pl-2 font-semibold text-on-surface flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center overflow-hidden">
                          <img src={getPlayerAvatar(p)} alt={p.username} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="leading-none">{p.fullName || p.username}</p>
                          <p className="text-[10px] text-on-surface-variant">
                            {`@${p.username.toLowerCase()}`}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 text-center text-on-surface-variant font-mono">{p.matches || 0}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${p.status === 'IN GIOCO' ? 'bg-orange-100 text-orange-700' :
                            p.status === 'IN ATTESA' ? 'bg-gray-100 text-gray-700' :
                              'bg-[#6B8E23]/10 text-[#6B8E23] dark:text-[#A3C86D] border border-[#6B8E23]/20'
                          }`}>
                          {p.status || 'Pronto'}
                        </span>
                      </td>
                      <td className="py-3 text-center pr-4 rounded-r-lg font-mono font-bold text-[#5B0F18] dark:text-[#FFEDAC]">
                        {p.totalScore || 0}
                      </td>
                    </tr>
                  ))}
                  {players.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-on-surface-variant italic text-sm">
                        Nessun giocatore registrato nel DB
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        
        <aside className="lg:col-span-4 space-y-6">
          
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-[0px_4px_20px_rgba(43,33,24,0.03)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="headline text-sm font-bold text-on-surface uppercase tracking-widest">Registro Iscrizioni</h3>
              <span className="text-[10px] bg-secondary-fixed text-on-secondary-fixed-variant px-2 py-0.5 rounded font-bold">{candidates.length} Candidati</span>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {candidates.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/20 overflow-hidden">
                      <img src={getPlayerAvatar(p)} alt={p.username} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface leading-tight">{p.fullName || p.username}</p>
                      <p className="text-[10px] text-on-surface-variant">
                        {`@${p.username.toLowerCase()}`}
                      </p>
                    </div>
                  </div>
                  <span className="bg-[#6B8E23]/10 text-[#6B8E23] dark:text-[#A3C86D] border border-[#6B8E23]/20 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                    <span className="material-symbols-outlined text-[10px] fill-current">emoji_events</span>
                    Candidato
                  </span>
                </div>
              ))}
              {candidates.length === 0 && (
                <div className="text-center py-6 text-xs text-on-surface-variant italic">
                  Nessun giocatore si è ancora iscritto al torneo.
                </div>
              )}
            </div>
          </div>

        </aside>
      </div>

      
      {showCreateModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-high rounded-2xl max-w-md w-full border border-outline-variant/30 p-8 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-2xl font-extrabold text-primary mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined">add_circle</span>
              Pianifica Nuova Partita
            </h3>

            <form onSubmit={handleCreateMatch} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Locale (Sede)
                </label>
                <select
                  value={selectedVenueId}
                  onChange={(e) => handleVenueChange(e.target.value)}
                  className="w-full bg-surface-container text-on-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Seleziona Locale</option>
                  {venuesList.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Tavolo Fisico
                </label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full bg-surface-container text-on-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  disabled={!selectedVenueId}
                >
                  <option value="">Seleziona Table</option>
                  {selectedVenueId && venuesList.find(v => v.id.toString() === selectedVenueId)?.tables?.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (Stato: {t.status})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Data e Ora di Inizio
                </label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-surface-container text-on-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Max Giocatori
                </label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                  className="w-full bg-surface-container text-on-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                >
                  <option value={2}>2 Giocatori</option>
                  <option value={3}>3 Giocatori</option>
                  <option value={4}>4 Giocatori</option>
                  <option value={5}>5 Giocatori</option>
                  <option value={6}>6 Giocatori</option>
                </select>
              </div>

              {createError && (
                <p className="text-xs text-error font-semibold mt-2">{createError}</p>
              )}
              {createSuccess && (
                <p className="text-xs text-secondary font-semibold mt-2">{createSuccess}</p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/2 py-3 bg-outline-variant/20 text-on-surface font-bold rounded-xl text-sm hover:bg-outline-variant/30 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-primary-container text-on-primary font-bold rounded-xl text-sm hover:bg-primary transition-colors shadow-lg shadow-primary/10"
                >
                  Crea Partita
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      
      {showTourneyModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-high rounded-2xl max-w-lg w-full border border-outline-variant/30 p-8 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setShowTourneyModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-2xl font-extrabold text-primary mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined">emoji_events</span>
              Configura Torneo (Eliminazione)
            </h3>

            <form onSubmit={handleCreateTournament} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Nome Torneo
                </label>
                <input
                  type="text"
                  value={tourneyName}
                  onChange={(e) => setTourneyName(e.target.value)}
                  placeholder="Es. Coppa Primavera 2026"
                  className="w-full bg-surface-container text-on-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Locale Ospitante
                </label>
                <select
                  value={selectedVenueId}
                  onChange={(e) => handleVenueChange(e.target.value)}
                  className="w-full bg-surface-container text-on-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Seleziona Locale</option>
                  {venuesList.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Seleziona Giocatori Iscritti
                  </label>
                  <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded">
                    {selectedPlayers.length} selezionati
                  </span>
                </div>
                <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                  {[...players].filter(p => p.wantsTournament).map(p => (
                    <label key={p.id} className="flex items-center justify-between p-2 rounded hover:bg-surface-container-high cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedPlayers.includes(p.id)}
                          onChange={() => togglePlayer(p.id)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant/30 bg-surface-container-highest"
                        />
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center overflow-hidden">
                            <img src={getPlayerAvatar(p)} alt={p.username} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-sm font-semibold text-on-surface">{getPlayerName(p)}</span>
                        </div>
                      </div>
                      {p.wantsTournament && (
                        <span className="bg-[#6B8E23]/10 text-[#6B8E23] dark:text-[#A3C86D] border border-[#6B8E23]/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[10px] fill-current">emoji_events</span>
                          Candidato
                        </span>
                      )}
                    </label>
                  ))}
                  {[...players].filter(p => p.wantsTournament).length === 0 && (
                    <p className="text-xs text-on-surface-variant italic text-center py-4">Nessun candidato disponibile</p>
                  )}
                </div>
              </div>

              {tourneyError && (
                <p className="text-xs text-error font-semibold mt-2 bg-error/10 p-2 rounded">{tourneyError}</p>
              )}
              {tourneySuccess && (
                <p className="text-xs text-secondary font-semibold mt-2 bg-secondary/10 p-2 rounded">{tourneySuccess}</p>
              )}

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowTourneyModal(false)}
                  className="w-1/3 py-3 bg-outline-variant/20 text-on-surface font-bold rounded-xl text-sm hover:bg-outline-variant/30 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 bg-secondary-container text-on-secondary-container font-bold rounded-xl text-sm hover:bg-secondary hover:text-white transition-all shadow-lg shadow-secondary/10 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">account_tree</span>
                  Genera Tabellone
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      
      {showScheduleModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl p-8 max-w-md w-full shadow-2xl border border-outline-variant/20">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant/10">
              <span className="material-symbols-outlined text-3xl text-primary">edit_calendar</span>
              <h3 className="text-2xl font-black text-on-surface">Riprogramma Partita</h3>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Tavolo di Gioco</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">table_restaurant</span>
                  <select
                    value={selectedTableId}
                    onChange={(e) => setSelectedTableId(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none"
                    required
                  >
                    <option value="" disabled>Seleziona un tavolo</option>
                    {venuesList.flatMap(v => v.tables).map(t => (
                      <option key={t.id} value={t.id}>
                        Tavolo {t.tableCode || t.id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Data e Ora</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">schedule</span>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="w-1/3 py-3 bg-outline-variant/20 text-on-surface font-bold rounded-xl text-sm hover:bg-outline-variant/30 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 bg-primary text-on-primary font-bold rounded-xl text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TournamentManagement;

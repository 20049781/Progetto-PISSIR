import { useState, useEffect } from 'react';

const PlayerDashboard = () => {
  const [playerProfile, setPlayerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinStatus, setJoinStatus] = useState('');
  const [timeHorizon, setTimeHorizon] = useState('ALL');
  const [minHour, setMinHour] = useState('');

  const fetchDashboard = () => {
    const userStr = localStorage.getItem('monopoly_user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    fetch(`/api/users/${user.id}/dashboard`)
      .then(res => res.json())
      .then(data => {
        setPlayerProfile(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Errore nel caricamento della dashboard:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleWantsTournament = () => {
    const userStr = localStorage.getItem('monopoly_user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    const newWants = !playerProfile.wantsTournament;

    fetch(`/api/users/${user.id}/wants-tournament?wants=${newWants}`, {
      method: 'PUT'
    })
      .then(res => {
        if (!res.ok) throw new Error("Errore nell'aggiornamento candidatura");
        return res.json();
      })
      .then(() => {
        fetchDashboard();
      })
      .catch(err => {
        console.error(err);
      });
  };

  const handleJoinTournament = (matchId = null) => {
    const userStr = localStorage.getItem('monopoly_user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    fetch('/api/matches/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, matchId: matchId })
    })
      .then(res => res.text())
      .then(text => {
        setJoinStatus(text);
        fetchDashboard();
        // Nasconde lo status dopo 3 secondi
        setTimeout(() => setJoinStatus(''), 3000);
      })
      .catch(err => {
        console.error("Errore nell'iscrizione:", err);
      });
  };

  const handleLeaveTournament = (matchId) => {
    const userStr = localStorage.getItem('monopoly_user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    fetch('/api/matches/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, matchId: matchId })
    })
      .then(res => {
        if (!res.ok) {
          return res.text().then(text => { throw new Error(text) });
        }
        return res.text();
      })
      .then(text => {
        setJoinStatus(text);
        fetchDashboard();
        // Nasconde lo status dopo 3 secondi
        setTimeout(() => setJoinStatus(''), 3000);
      })
      .catch(err => {
        console.error("Errore nell'annullamento dell'iscrizione:", err);
        setJoinStatus(err.message || "Errore nell'annullamento");
      });
  };

  const parseMatchDate = (scheduledTimeStr) => {
    if (!scheduledTimeStr || scheduledTimeStr === 'Subito') {
      return new Date();
    }
    try {
      const parts = scheduledTimeStr.split(' alle ore ');
      const dateParts = parts[0].split('/');
      const timeParts = parts[1].split(':');
      return new Date(
        parseInt(dateParts[2]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[0]),
        parseInt(timeParts[0]),
        parseInt(timeParts[1])
      );
    } catch {
      return new Date();
    }
  };

  const filteredTournaments = (playerProfile?.upcomingTournaments || []).filter(tournament => {
    const matchDate = parseMatchDate(tournament.scheduledTime);
    const now = new Date();

    const diffTime = matchDate - now;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (timeHorizon === 'TODAY') {
      const isToday = matchDate.getDate() === now.getDate() &&
        matchDate.getMonth() === now.getMonth() &&
        matchDate.getFullYear() === now.getFullYear();
      if (!isToday && tournament.scheduledTime !== 'Subito') return false;
    } else if (timeHorizon === 'WEEK') {
      if (diffDays < -0.1 || diffDays > 7) return false;
    } else if (timeHorizon === 'MONTH') {
      if (diffDays < -0.1 || diffDays > 30) return false;
    }

    if (minHour !== '') {
      const targetHour = parseInt(minHour);
      const matchHour = matchDate.getHours();
      if (matchHour < targetHour && tournament.scheduledTime !== 'Subito') return false;
    }

    return true;
  });

  if (loading || !playerProfile) {
    return <div className="p-12 text-center text-on-surface-variant">Caricamento cruscotto dati dal Registro Centrale...</div>;
  }
  return (
    <>
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Dashboard</h1>
          <p className="text-on-surface-variant font-medium">Le attività di gioco di <span className="text-primary font-bold">{playerProfile.username}</span></p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="bg-surface-container-low px-6 py-3 rounded-xl shadow-sm border border-outline-variant/5 min-w-[180px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-1.5">Candidatura Tornei</p>
            <button
              onClick={handleToggleWantsTournament}
              className={`w-full px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm border ${
                playerProfile.wantsTournament
                  ? 'bg-[#6B8E23]/10 text-[#6B8E23] dark:text-[#A3C86D] border-[#6B8E23]/20 hover:bg-[#6B8E23]/20'
                  : 'bg-outline-variant/20 hover:bg-outline-variant/30 text-on-surface border-outline-variant/30'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {playerProfile.wantsTournament ? 'check_circle' : 'star_border'}
              </span>
              {playerProfile.wantsTournament ? 'Candidato' : 'Vorrei Partecipare'}
            </button>
          </div>
          <div className="bg-surface-container-low px-6 py-3 rounded-xl shadow-sm border border-outline-variant/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-1">Posizione in Classifica</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-primary">#{playerProfile.ranking}</span>
              <span className="text-xs font-bold text-secondary">{playerProfile.tier}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/5 shadow-[0px_12px_32px_rgba(43,33,24,0.03)] flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-primary-container">sports_esports</span>
            <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-tighter">Partite Totali</span>
          </div>
          <div>
            <p className="text-3xl font-black text-on-surface">{playerProfile.totalMatches}</p>
            <p className="text-xs text-secondary font-medium">Miglior {playerProfile.topPercentile} di sempre</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/5 shadow-[0px_12px_32px_rgba(43,33,24,0.03)] flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-secondary">trending_up</span>
            <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-tighter">Percentuale Vittorie</span>
          </div>
          <div>
            <p className="text-3xl font-black text-on-surface">{playerProfile.winLossRatio}<span className="text-lg">%</span></p>
            <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-secondary h-full" style={{ width: `${playerProfile.winLossRatio}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/5 shadow-[0px_12px_32px_rgba(43,33,24,0.03)] flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-tertiary">payments</span>
            <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-tighter">Saldo Medio</span>
          </div>
          <div>
            <p className="text-3xl font-black text-on-surface">{playerProfile.avgBalance}</p>
            <p className="text-xs text-on-surface-variant font-medium">Deviatorie standard {playerProfile.stdDevBalance}</p>
          </div>
        </div>

      </div>

      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
          <h2 className="text-xl font-extrabold tracking-tight text-on-surface">Bacheca Trofei ({playerProfile.wonTournaments?.length || 0})</h2>
        </div>
        {playerProfile.wonTournaments && playerProfile.wonTournaments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {playerProfile.wonTournaments.map((t, idx) => (
              <div 
                key={idx} 
                className="bg-surface-container-low hover:bg-surface-container border border-outline-variant/15 hover:border-amber-500/30 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center relative overflow-hidden group"
              >
                
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-[#fef9e9] flex items-center justify-center shadow-[0_8px_20px_rgba(217,119,6,0.3)] mb-4 group-hover:scale-110 transition-transform duration-300 relative">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v3c0 2.21 1.79 4 4 4h2.27c.49 1.04 1.35 1.86 2.4 2.2L11 20H8v2h8v-2h-3l-.67-3.8c1.05-.34 1.91-1.16 2.4-2.2H17c2.21 0 4-1.79 4-4V7c0-1.1-.9-2-2-2zM5 10V7h2v3c0 1.1-.9-2-2-2zM19 10c-1.1 0-2-.9-2-2V7h2v3zm0 0H19z" />
                  </svg>
                </div>
                
                <h3 className="font-black text-sm text-on-surface leading-tight mb-1 group-hover:text-amber-500 transition-colors">{t.name}</h3>
                <p className="text-[10px] font-bold text-amber-600/80 uppercase tracking-widest mb-3">Vincitore Ufficiale</p>
                
                <div className="w-full pt-3 border-t border-amber-500/10 mt-auto flex items-center justify-between text-[10px] text-on-surface-variant/70 font-semibold">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                    {t.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">group</span>
                    {t.participants} Sfidanti
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center shadow-inner">
            <div className="w-12 h-12 rounded-full bg-surface-container-high text-on-surface-variant/40 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl">emoji_events</span>
            </div>
            <p className="font-bold text-sm text-on-surface mb-1">Nessun trofeo in bacheca</p>
            <p className="text-xs text-on-surface-variant max-w-sm flex items-center justify-center gap-1.5 flex-wrap">
              Partecipa ai tornei attivi, scala la classifica e sconfiggi i tuoi sfidanti per sbloccare la tua prima coppa dorata!
              <svg className="w-4 h-4 text-amber-500 fill-current inline-block align-middle shrink-0" viewBox="0 0 24 24">
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v3c0 2.21 1.79 4 4 4h2.27c.49 1.04 1.35 1.86 2.4 2.2L11 20H8v2h8v-2h-3l-.67-3.8c1.05-.34 1.91-1.16 2.4-2.2H17c2.21 0 4-1.79 4-4V7c0-1.1-.9-2-2-2zM5 10V7h2v3c0 1.1-.9 2-2 2zm14 0c-1.1 0-2-.9-2-2V7h2v3z" />
              </svg>
            </p>
          </div>
        )}
      </section>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-surface-container-high p-6 rounded-xl border border-outline-variant/10 shadow-sm">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
                  <h2 className="text-sm font-black uppercase tracking-widest">Iscriviti a una partita</h2>
                </div>
                <span className="px-2 py-1 bg-surface-container rounded text-[9px] font-bold uppercase text-on-surface-variant">
                  {filteredTournaments.length} Disponibile/i
                </span>
              </div>

              <div className="flex bg-surface-container-low p-1 rounded-lg gap-1">
                {[
                  { id: 'ALL', label: 'Tutte' },
                  { id: 'TODAY', label: 'Oggi' },
                  { id: 'WEEK', label: 'Settimana' },
                  { id: 'MONTH', label: 'Mese' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setTimeHorizon(tab.id)}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded transition-all ${timeHorizon === tab.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:bg-outline-variant/10'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-2 rounded-lg border border-outline-variant/5">
                <span className="material-symbols-outlined text-xs text-on-surface-variant">schedule</span>
                <select
                  value={minHour}
                  onChange={(e) => setMinHour(e.target.value)}
                  className="flex-1 bg-transparent text-[11px] font-bold text-on-surface-variant outline-none cursor-pointer"
                >
                  <option value="">Qualsiasi ora</option>
                  <option value="8">Dalle 08:00 in poi</option>
                  <option value="12">Dalle 12:00 in poi</option>
                  <option value="15">Dalle 15:00 in poi</option>
                  <option value="18">Dalle 18:00 in poi</option>
                  <option value="20">Dalle 20:00 in poi</option>
                </select>
                {minHour && (
                  <button onClick={() => setMinHour('')} className="text-on-surface-variant hover:text-error">
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                )}
              </div>
            </div>

            {joinStatus && (
              <div className="mb-4 p-3 bg-secondary-fixed text-on-secondary-fixed-variant rounded-xl font-bold text-xs flex items-center gap-2 animate-fade-in shadow-sm border border-secondary/20">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                {joinStatus}
              </div>
            )}

            <div className="space-y-4">
              {filteredTournaments.map((tournament, idx) => (
                <div key={idx} className="p-4 bg-surface-container-lowest rounded-lg border border-outline-variant/10 shadow-sm flex items-center justify-between hover:border-primary/20 transition-all duration-300">
                  <div>
                    <p className="text-sm font-bold text-on-surface">{tournament.name}</p>
                    <p className="text-[10px] font-medium text-on-surface-variant mb-2">{tournament.time}</p>
                  </div>
                  {tournament.joined ? (
                    <span className="text-xs font-black text-secondary bg-secondary/10 px-3 py-1.5 rounded-lg flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      Già Iscritto
                    </span>
                  ) : tournament.active ? (
                    <button
                      onClick={() => handleJoinTournament(tournament.matchId)}
                      className="px-4 py-2 bg-primary-container text-on-primary font-bold rounded-lg text-xs hover:bg-primary transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-xs">edit_calendar</span>
                      Iscriviti
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-on-surface-variant/40 bg-surface-container-low px-3 py-1.5 rounded-lg flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">group</span>
                      Pieno
                    </span>
                  )}
                </div>
              ))}
              {filteredTournaments.length === 0 && (
                <div className="text-center py-6 text-xs text-on-surface-variant italic border border-dashed border-outline-variant rounded-lg">
                  Nessuna partita corrispondente ai filtri.
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <h2 className="text-sm font-black uppercase tracking-widest text-on-surface">Le Tue Iscrizioni</h2>
            </div>
            <div className="space-y-4">
              {(playerProfile.subscribedMatches || []).map((match, idx) => (
                <div key={idx} className="p-4 bg-surface-container-lowest rounded-lg border border-outline-variant/10 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-on-surface">{match.name}</p>
                    <p className="text-[10px] font-medium text-on-surface-variant mb-1">
                      Inizio: <span className="text-primary font-bold">{match.time}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {match.active ? (
                      <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-1 rounded uppercase tracking-wider animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                        In Corso
                      </span>
                    ) : (
                      <>
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-wider">
                          Confermata
                        </span>
                        <button
                          onClick={() => handleLeaveTournament(match.matchId)}
                          className="p-1 rounded-md text-error hover:bg-error/10 transition-colors flex items-center justify-center"
                          title="Annulla iscrizione"
                        >
                          <span className="material-symbols-outlined text-sm">cancel</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {(!playerProfile.subscribedMatches || playerProfile.subscribedMatches.length === 0) && (
                <div className="text-center py-6 text-xs text-on-surface-variant italic border border-dashed border-outline-variant rounded-lg">
                  Non sei ancora iscritto a nessuna partita attiva.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full mt-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight">Le tue partite</h2>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/5 shadow-sm overflow-hidden">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/10">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Partita</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Durata</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Entrate</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Risultato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {playerProfile.recentEntries && playerProfile.recentEntries.length > 0 ? (
                  playerProfile.recentEntries.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3 w-full">
                          <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-xs font-bold">{entry.id}</div>
                          <span className="text-sm font-bold text-on-surface">{entry.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-on-surface-variant font-medium">{entry.duration}</td>
                      <td className="px-6 py-4 text-center font-bold text-on-surface">{entry.revenue}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${
                          entry.outcome === 'Vittoria' ? 'bg-[#6B8E23]/10 text-[#6B8E23] dark:text-[#A3C86D] border border-[#6B8E23]/20' : 
                          entry.outcome === 'Sconfitta' ? 'bg-red-100 text-red-800 border border-red-200' : 
                          entry.outcome === 'In Corso' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-surface-variant text-on-surface-variant border border-outline-variant/50'
                        }`}>
                          {entry.outcome}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-on-surface-variant text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">sports_esports</span>
                        <p className="font-bold text-lg text-on-surface">Ancora nessuna partita</p>
                        <p className="text-xs opacity-70">Iscriviti e gioca una partita per vedere qui i tuoi risultati!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlayerDashboard;

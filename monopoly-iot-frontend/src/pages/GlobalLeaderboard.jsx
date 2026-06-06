import { useState, useEffect } from 'react';

const GlobalLeaderboard = () => {
  const [data, setData] = useState(null);
  const [venues, setVenues] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const playersPerPage = 5;
  const tablePlayers = data ? data.allPlayers.slice(3) : [];
  const totalPages = Math.max(1, Math.ceil(tablePlayers.length / playersPerPage));

  const startIndex = (currentPage - 1) * playersPerPage;
  const endIndex = startIndex + playersPerPage;
  const displayedTablePlayers = tablePlayers.slice(startIndex, endIndex);

  const getAvatar = (player) => {
    if (!player) return `https://api.dicebear.com/7.x/adventurer/svg?seed=Unknown&backgroundColor=b6e3f4`;
    if (player.avatar) return player.avatar;
    const u = usersMap[player.username] || usersMap[player.fullName];
    if (u && u.avatar) return u.avatar;
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(player.username || 'Unknown')}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  };

  const getPlayerName = (player) => {
    if (!player) return 'Unknown';
    return player.fullName || player.username;
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics/leaderboard').then(res => res.json()),
      fetch('/api/venues/list').then(res => res.json()),
      fetch('/api/users').then(res => res.json())
    ])
      .then(([leaderboardData, venueList, usersList]) => {
        setData(leaderboardData);
        setVenues(venueList);
        // Costruisce una mappa indicizzata sia per username che per fullName per una ricerca flessibile
        const m = {};
        usersList.forEach(u => {
          if (u.username) m[u.username] = u;
          if (u.fullName) m[u.fullName] = u;
        });
        setUsersMap(m);

        const isPlayer = (p) => {
          const u = m[p.username] || m[p.fullName];
          if (u && u.email) {
            return !u.email.includes('admin') && !u.email.includes('venue') && !u.email.includes('game');
          }
          return true;
        };
        const validPlayers = leaderboardData.allPlayers.filter(isPlayer);
        
        setData({
          ...leaderboardData,
          allPlayers: validPlayers,
          topPlayers: validPlayers.slice(0, 3)
        });
        
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return <div className="p-12 text-center text-on-surface-variant">Caricamento classifica dal DB in corso...</div>;
  }

  // Prepara la Top 3 se ci sono abbastanza giocatori
  const top1 = data.topPlayers.length > 0 ? data.topPlayers[0] : null;
  const top2 = data.topPlayers.length > 1 ? data.topPlayers[1] : null;
  const top3 = data.topPlayers.length > 2 ? data.topPlayers[2] : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tighter text-on-surface">Classifica Giocatori</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {top2 ? (
          <div className="bg-surface-container-low p-6 rounded-xl flex flex-col items-center justify-center relative group hover:translate-y-[-4px] transition-all duration-300">
            <div className="bg-blue-500/15 text-blue-600 px-4 py-1 rounded-full mb-6 font-bold text-xs flex items-center gap-1">
              2° CLASSIFICATO
            </div>
            <div className="w-24 h-24 rounded-full border-4 border-blue-300 p-1 mb-4 overflow-hidden bg-surface-container-high">
              <img src={getAvatar(top2)} alt={getPlayerName(top2)} className="w-full h-full object-cover rounded-full" />
            </div>
            <h3 className="text-xl font-bold text-on-surface">{getPlayerName(top2)}</h3>
            <div className="mt-8 grid grid-cols-3 gap-6 w-full">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest opacity-70">Vittorie</p>
                <p className="text-xl font-bold">{top2.wins}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest opacity-70">Partite</p>
                <p className="text-xl font-bold">{top2.matches}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest opacity-70">Punteggio</p>
                <p className="text-xl font-bold">{top2.totalScore}</p>
              </div>
            </div>
          </div>
        ) : <div className="bg-surface-container-lowest rounded-xl flex items-center justify-center"><p className="text-on-surface-variant">Non disponibile</p></div>}

        {top1 ? (
          <div className="bg-primary-container text-on-primary p-8 rounded-xl flex flex-col items-center justify-center relative shadow-xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-50"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="bg-secondary-container text-on-secondary-container px-4 py-1 rounded-full mb-6 font-bold text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">workspace_premium</span>
                CAMPIONE
              </div>
              <div className="w-32 h-32 rounded-full border-4 border-secondary-container p-1.5 mb-6 shadow-2xl overflow-hidden bg-primary">
                <img src={getAvatar(top1)} alt={getPlayerName(top1)} className="w-full h-full object-cover rounded-full" />
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight">{getPlayerName(top1)}</h3>
              <div className="mt-8 grid grid-cols-3 gap-6 w-full">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest opacity-70">Vittorie</p>
                  <p className="text-xl font-bold">{top1.wins}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest opacity-70">Partite</p>
                  <p className="text-xl font-bold">{top1.matches}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest opacity-70">Punteggio</p>
                  <p className="text-xl font-bold">{top1.totalScore}</p>
                </div>
              </div>
            </div>
          </div>
        ) : <div className="bg-surface-container-lowest rounded-xl flex items-center justify-center"><p className="text-on-surface-variant">Nessun giocatore</p></div>}

        {top3 ? (
          <div className="bg-surface-container-low p-6 rounded-xl flex flex-col items-center justify-center relative group hover:translate-y-[-4px] transition-all duration-300">
            <div className="bg-red-500/10 text-red-600 px-4 py-1 rounded-full mb-6 font-bold text-xs flex items-center gap-1">
              3° CLASSIFICATO
            </div>
            <div className="w-24 h-24 rounded-full border-4 border-red-300 p-1 mb-4 overflow-hidden bg-surface-container-high">
              <img src={getAvatar(top3)} alt={getPlayerName(top3)} className="w-full h-full object-cover rounded-full" />
            </div>
            <h3 className="text-xl font-bold text-on-surface">{getPlayerName(top3)}</h3>
            <div className="mt-8 grid grid-cols-3 gap-6 w-full">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest opacity-70">Vittorie</p>
                <p className="text-xl font-bold">{top3.wins}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest opacity-70">Partite</p>
                <p className="text-xl font-bold">{top3.matches}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest opacity-70">Punteggio</p>
                <p className="text-xl font-bold">{top3.totalScore}</p>
              </div>
            </div>
          </div>
        ) : <div className="bg-surface-container-lowest rounded-xl flex items-center justify-center"><p className="text-on-surface-variant">Non disponibile</p></div>}
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(43,33,24,0.06)] overflow-hidden">
        <div className="px-8 py-6 flex justify-between items-center bg-surface-container-low/50 border-b border-outline-variant/10">
          <h3 className="text-lg font-bold text-on-surface">Ranking Completo</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-on-surface-variant bg-surface-container-high/30">
                <th className="px-8 py-4 font-bold text-center">Posizione</th>
                <th className="px-8 py-4 font-bold text-center">Giocatore</th>
                <th className="px-8 py-4 font-bold text-center">Vittorie</th>
                <th className="px-8 py-4 font-bold text-center">Partite</th>
                <th className="px-8 py-4 font-bold text-center">Tornei</th>
                <th className="px-8 py-4 font-bold text-center">Punteggio Totale</th>
                <th className="px-8 py-4 font-bold text-center">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {displayedTablePlayers.length > 0 ? displayedTablePlayers.map((p, idx) => (
                <tr key={p.id || idx} className="hover:bg-surface-container/50 transition-colors">
                  <td className="px-8 py-5 text-center">
                    <span className="text-sm font-bold text-on-surface-variant">{(p.rank).toString().padStart(2, '0')}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-surface-container">
                        <img src={getAvatar(p)} alt={getPlayerName(p)} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">{getPlayerName(p)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center text-sm font-medium">{p.wins}</td>
                  <td className="px-8 py-5 text-center text-sm font-medium">{p.matches}</td>
                  <td className="px-8 py-5 text-center text-sm font-medium">{p.tournaments}</td>
                  <td className="px-8 py-5 text-center font-mono text-sm font-bold text-primary">{p.totalScore}</td>
                  <td className="px-8 py-5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold border ${p.status === 'IN GIOCO'
                        ? 'bg-orange-100 text-orange-700 border-orange-200'
                        : p.status === 'IN ATTESA'
                          ? 'bg-gray-100 text-gray-700 border-gray-200'
                          : 'bg-[#6B8E23]/10 text-[#6B8E23] dark:text-[#A3C86D] border-[#6B8E23]/20'
                      }`}>
                      {p.status === 'IN GIOCO' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-700"></span>
                      )}
                      {p.status === 'IN ATTESA' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span>
                      )}
                      {p.status === 'ONLINE' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E23] dark:bg-[#A3C86D]"></span>
                      )}

                      {p.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="px-8 py-12 text-center text-on-surface-variant">Non ci sono altri giocatori in classifica dal DB.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-4 bg-surface-container-low flex justify-between items-center border-t border-outline-variant/10">
          <p className="text-xs text-on-surface-variant">
            visualizzati <span className="font-bold">{displayedTablePlayers.length + (data.topPlayers ? data.topPlayers.length : 0)}</span> di <span className="font-bold">{data.allPlayers.length}</span> giocatori
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-outline-variant transition-colors ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="text-xs font-bold px-2">Pagina {currentPage} di {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-outline-variant transition-colors ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalLeaderboard;

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';

const TopNavBar = () => {
  const navigate = useNavigate();

  const getLocalUser = () => {
    const userStr = localStorage.getItem('monopoly_user');
    return userStr ? JSON.parse(userStr) : {
      name: 'Amministratore',
      email: 'admin@ledger.com',
      role: 'super_admin',
      roleLabel: 'Super Admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'
    };
  };

  const [user, setUser] = useState(getLocalUser);
  const [adminNotice, setAdminNotice] = useState(null);
  const [showNoticeDropdown, setShowNoticeDropdown] = useState(false);

  const handleCreaTorneoClick = () => {
    if (window.location.pathname !== '/dashboard/tournaments') {
      navigate('/dashboard/tournaments');
      setTimeout(() => {
        window.dispatchEvent(new Event('open-create-tournament-modal'));
      }, 150);
    } else {
      window.dispatchEvent(new Event('open-create-tournament-modal'));
    }
  };

  useEffect(() => {
    if (user && user.id) {
      fetch(`/api/users/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.adminNotice) {
            setAdminNotice(data.adminNotice);
          } else {
            setAdminNotice(null);
          }
        })
        .catch(err => console.error("Error fetching user data:", err));
    }
  }, [user]);

  const handleClearNotice = () => {
    if (user && user.id) {
      fetch(`/api/users/${user.id}/notice`, { method: 'DELETE' })
        .then(res => {
          if (res.ok) {
            setAdminNotice(null);
            setShowNoticeDropdown(false);
          }
        });
    }
  };

  useEffect(() => {
    const handleProfileUpdate = () => {
      setUser(getLocalUser());
    };
    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('monopoly_user');
    navigate('/login');
  };

  // Variabili di stato per la creazione della partita
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [venuesList, setVenuesList] = useState([]);
  const [gameTables, setGameTables] = useState([]);
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

  useEffect(() => {
    if (showCreateModal && (user.role === 'super_admin' || user.role === 'venue_admin')) {
      Promise.all([
        fetch('/api/venues/list').then(res => res.json()),
        fetch('/api/gametables').then(res => res.json())
      ])
        .then(([venuesData, tablesData]) => {
          setVenuesList(venuesData);
          setGameTables(tablesData);
          if (venuesData.length > 0) {
            setSelectedVenueId(venuesData[0].id.toString());
            if (venuesData[0].tables && venuesData[0].tables.length > 0) {
              setSelectedTableId(venuesData[0].tables[0].id.toString());
            }
          }
        })
        .catch(err => console.error("Errore nel caricamento delle sedi o tavoli:", err));
    }
  }, [showCreateModal, user.role]);

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

  const roleBadgeStyles = {
    player: 'bg-[#6B8E23]/10 text-[#6B8E23] dark:text-[#A3C86D] border border-[#6B8E23]/20',
    game_admin: 'bg-[#6D28D9]/10 text-[#6D28D9] dark:text-[#A78BFA] border border-[#6D28D9]/20',
    venue_admin: 'bg-[#1F4E5F]/10 text-[#1F4E5F] dark:text-[#7FB3C8] border border-[#1F4E5F]/20',
    super_admin: 'bg-[#7A1414]/10 text-[#7A1414] dark:text-[#E07A7A] border border-[#7A1414]/20'
  };

  const badgeClass = roleBadgeStyles[user.role] || roleBadgeStyles.player;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#fef9e9] dark:bg-[#1d1c12] border-b border-outline-variant/15 shadow-sm flex justify-between items-center w-full px-8 py-3 tonal-transition">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tighter text-[#4c0900] dark:text-[#ffb4a3] uppercase">IL REGISTRO DEL MONOPOLY</span>
          <div className="hidden md:flex items-center gap-6">
            <Link
              className="px-4 py-1.5 bg-[#ffdcbc] text-[#663e09] font-extrabold rounded-lg flex items-center gap-1.5 shadow-sm hover:bg-[#f6bb7c] transition-all active:scale-95 text-xs font-['Manrope'] mr-2"
              to="/spectator"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="material-symbols-outlined text-sm">tv</span>
              <span>Schermo Spettatori</span>
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Pulsanti Crea Torneo e Nuova Partita per gestori/amministratori autorizzati */}
          {user.role === 'venue_admin' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreaTorneoClick}
                className="px-4 py-1.5 bg-[#fef9e9] text-[#4c0900] border border-[#4c0900]/30 hover:bg-[#e6e3d3]/50 dark:bg-[#1d1c12] dark:text-[#ffb4a3] dark:border-[#ffb4a3]/30 dark:hover:bg-[#e6e3d3]/10 font-extrabold rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95 text-xs font-['Manrope'] mr-1"
              >
                <span className="material-symbols-outlined text-sm">emoji_events</span>
                <span>Crea Torneo</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-1.5 bg-[#4c0900] text-white font-extrabold rounded-lg flex items-center gap-1.5 shadow-sm hover:bg-[#6f1a07] transition-all active:scale-95 text-xs font-['Manrope'] mr-2 border border-[#4c0900]/20"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                <span>Nuova Partita</span>
              </button>
            </div>
          )}

          <span className={`px-3 py-1 rounded-full text-xs font-bold font-headline ${badgeClass}`}>
            {user.roleLabel}
          </span>

          <div className="flex items-center gap-3 pl-2 border-l border-outline-variant/20">
            <Link to="/dashboard/profile" className="flex items-center gap-3 hover:opacity-85 transition-opacity mr-2">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/10">
                <img alt={user.name} src={user.avatar} className="w-full h-full object-cover" />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-on-surface leading-tight font-headline">{user.name}</p>
                <p className="text-[10px] text-on-surface-variant opacity-75 leading-none">{user.email}</p>
              </div>
            </Link>

            {adminNotice && (
              <div className="relative">
                <button
                  onClick={() => setShowNoticeDropdown(!showNoticeDropdown)}
                  className="relative p-1.5 ml-2 hover:bg-[#6f1a07]/10 hover:text-[#6f1a07] transition-colors rounded-lg text-on-surface-variant flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-xl">notifications</span>
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full animate-pulse border-2 border-[#fef9e9] dark:border-[#1d1c12]"></span>
                </button>

                {showNoticeDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-xl p-5 z-50 animate-scale-in">
                    <div className="flex items-center gap-2 mb-3 text-error">
                      <span className="material-symbols-outlined text-xl">warning</span>
                      <h4 className="font-extrabold text-sm uppercase tracking-wider">Avviso di Sistema</h4>
                    </div>
                    <p className="text-sm text-on-surface-variant font-medium leading-relaxed mb-4">
                      {adminNotice}
                    </p>
                    <button
                      onClick={handleClearNotice}
                      className="w-full py-2 bg-error/10 hover:bg-error/20 text-error font-bold rounded-lg text-xs transition-colors"
                    >
                      Segna come letto
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleLogout}
              type="button"
              title="Disconnetti"
              className="p-1.5 ml-2 hover:bg-red-500/10 hover:text-red-600 transition-colors rounded-lg text-on-surface-variant flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </nav>
      {showCreateModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fef9e9] dark:bg-[#1d1c12] bg-gradient-to-br from-[#fef9e9] to-[#f6f0db] dark:from-[#1d1c12] dark:to-[#251e18] rounded-2xl max-w-md w-full border border-outline-variant/30 p-8 shadow-2xl relative animate-scale-in font-['Manrope']">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-2xl font-extrabold text-[#4c0900] dark:text-[#ffb4a3] mb-6 flex items-center gap-2">
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
                  className="w-full bg-surface-container text-on-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#6f1a07] transition-colors"
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
                  className="w-full bg-surface-container text-on-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#6f1a07] transition-colors"
                >
                  <option value="">Seleziona Tavolo</option>
                  {selectedVenueId && venuesList.find(v => v.id.toString() === selectedVenueId)?.tables?.map(t => {
                    const fullTable = gameTables.find(gt => gt.id === t.id);
                    const tableName = fullTable ? (fullTable.displayName || fullTable.name) : `Tavolo #${t.id}`;
                    return <option key={t.id} value={t.id}>{tableName} (Stato: {t.status})</option>
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Orario di Inizio
                </label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-surface-container text-on-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#6f1a07] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Giocatori Massimi
                </label>
                <input
                  type="number"
                  min="2"
                  max="6"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  className="w-full bg-surface-container text-on-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#6f1a07] transition-colors"
                />
              </div>

              {createError && (
                <div className="p-3 bg-red-100 border border-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {createError}
                </div>
              )}

              {createSuccess && (
                <div className="p-3 bg-[#6B8E23]/10 border border-[#6B8E23]/20 text-[#6B8E23] dark:text-[#A3C86D] text-xs font-semibold rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {createSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-surface-container hover:bg-surface-container-highest font-bold rounded-xl text-xs transition-colors border border-outline-variant/20"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#4c0900] hover:bg-[#6f1a07] text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95"
                >
                  Crea Partita
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default TopNavBar;

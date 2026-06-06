import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const PlatformAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeUser, setNoticeUser] = useState(null);
  const [noticeText, setNoticeText] = useState('');

  const loadUsers = () => {
    setLoading(true);
    fetch('/api/users')
      .then(res => {
        if (!res.ok) throw new Error('Errore nel caricamento degli utenti');
        return res.json();
      })
      .then(data => {
        const userStr = localStorage.getItem('monopoly_user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        if (currentUser) {
          const filtered = data.filter(u => 
            u.id !== currentUser.id && 
            u.email !== currentUser.email && 
            u.username !== currentUser.username
          );
          setUsers(filtered);
        } else {
          setUsers(data);
        }
        setError('');
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDeleteUser = (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo utente? Questa operazione è irreversibile.')) return;

    fetch(`/api/users/${id}`, {
      method: 'DELETE'
    })
      .then(res => {
        if (res.ok) {
          setUsers(users.filter(u => u.id !== id));
        } else {
          alert("Impossibile eliminare l'utente.");
        }
      })
      .catch(err => console.error("Errore cancellazione utente:", err));
  };

  const getRoleBadge = (email) => {
    if (email && email.includes('admin')) return { label: 'Super Admin', class: 'bg-[#7A1414]/10 text-[#7A1414] dark:text-[#E07A7A] border border-[#7A1414]/20' };
    if (email && email.includes('venue')) return { label: 'Gestore Sede', class: 'bg-[#1F4E5F]/10 text-[#1F4E5F] dark:text-[#7FB3C8] border border-[#1F4E5F]/20' };
    if (email && email.includes('game')) return { label: 'Ammin. Gioco', class: 'bg-[#6D28D9]/10 text-[#6D28D9] dark:text-[#A78BFA] border border-[#6D28D9]/20' };
    return { label: 'Giocatore', class: 'bg-[#6B8E23]/10 text-[#6B8E23] dark:text-[#A3C86D] border border-[#6B8E23]/20' };
  };

  const handleMakeAdmin = (user) => {
    if (!window.confirm(`Vuoi promuovere ${user.username} a Super Admin?`)) return;
    
    // In questa implementazione base il ruolo dipende dall'email.
    // Sostituiamo o aggiungiamo "admin" per renderlo admin.
    let newEmail = user.email;
    if (!newEmail.includes('admin')) {
      newEmail = "admin_" + newEmail;
    }
    
    const updatedUser = { ...user, email: newEmail };
    
    fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
    })
      .then(res => {
        if(res.ok) {
          loadUsers();
        } else {
          alert("Impossibile aggiornare l'utente.");
        }
      });
  };

  const handleSendNotice = (e) => {
    e.preventDefault();
    if (!noticeUser) return;
    
    fetch(`/api/users/${noticeUser.id}/notice`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notice: noticeText })
    })
      .then(res => {
        if(res.ok) {
          setShowNoticeModal(false);
          setNoticeText('');
          setNoticeUser(null);
          loadUsers();
          alert('Avviso inviato con successo!');
        } else {
          alert('Impossibile inviare l\'avviso.');
        }
      });
  };

  return (
    <div className="flex-1 overflow-y-auto px-10 py-8 relative font-['Manrope'] antialiased">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-primary leading-none mb-2">Amministrazione Piattaforma</h2>
          <p className="text-on-surface-variant font-medium">Gestione globale degli utenti, supervisione dei locali e monitoraggio del sistema.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Link to="/dashboard/venues-boards" className="bg-surface-container-low hover:bg-surface-container rounded-2xl p-6 border border-outline-variant/10 shadow-sm transition-all group flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-3xl text-secondary">location_city</span>
              <h3 className="text-xl font-extrabold text-on-surface">Gestione Locali</h3>
            </div>
            <p className="text-sm text-on-surface-variant">Configura le sedi, registra i tavoli Live e verifica lo stato dei sensori hardware.</p>
          </div>
          <div className="flex justify-end mt-4">
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">arrow_forward</span>
          </div>
        </Link>

        <Link to="/dashboard/analytics" className="bg-surface-container-low hover:bg-surface-container rounded-2xl p-6 border border-outline-variant/10 shadow-sm transition-all group flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-3xl text-[#6f1a07]">monitoring</span>
              <h3 className="text-xl font-extrabold text-on-surface">Statistiche Globali</h3>
            </div>
            <p className="text-sm text-on-surface-variant">Analizza i dati aggregati, le performance economiche e i KPI della piattaforma.</p>
          </div>
          <div className="flex justify-end mt-4">
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-[#6f1a07] transition-colors">arrow_forward</span>
          </div>
        </Link>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-extrabold text-primary mb-1">Gestione Utenti</h3>
            <p className="text-sm text-on-surface-variant">Visualizza e gestisci tutti gli utenti registrati nel sistema.</p>
          </div>
          <div className="bg-slate-100 text-slate-600 border border-slate-200/60 px-4 py-2 rounded-lg font-bold text-sm">
            {users.length} Utenti Totali
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-on-surface-variant">Caricamento utenti in corso...</div>
        ) : error ? (
          <div className="p-12 text-center text-error font-bold">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-center text-sm border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-bold uppercase tracking-wider text-[10px] border-b border-outline-variant/10">
                  <th className="py-4 px-6 text-left">Utente</th>
                  <th className="py-4 px-6 text-center">Email (Credenziale)</th>
                  <th className="py-4 px-6 text-center">Ruolo</th>
                  <th className="py-4 px-6 text-center">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {users.map((user) => {
                  const roleBadge = getRoleBadge(user.email);
                  const isSuperAdmin = user.email && user.email.includes('admin');
                  return (
                    <tr key={user.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="py-4 px-6 text-left">
                        <div className="flex items-center gap-3">
                          <img 
                            src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'} 
                            alt={user.username} 
                            className="w-10 h-10 rounded-full object-cover border border-outline-variant/20"
                          />
                          <div className="text-left">
                            <p className="font-bold text-on-surface">{user.fullName || user.username}</p>
                            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center font-mono text-xs text-on-surface-variant">
                        {user.email}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md ${roleBadge.class}`}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center space-x-2 flex justify-center items-center">
                        <button
                          onClick={() => {
                            setNoticeUser(user);
                            setNoticeText(user.adminNotice || '');
                            setShowNoticeModal(true);
                          }}
                          className="px-3 py-1.5 bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 rounded-lg text-xs font-bold transition-colors"
                          title="Invia Avviso"
                        >
                          Avvisa
                        </button>
                        {!isSuperAdmin && (
                          <button
                            onClick={() => handleMakeAdmin(user)}
                            className="px-3 py-1.5 bg-surface-container text-on-surface hover:bg-outline-variant/20 rounded-lg text-xs font-bold transition-colors"
                            title="Promuovi a Super Admin"
                          >
                            Promuovi
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 text-error hover:bg-error-container rounded-lg transition-colors flex items-center justify-center"
                          title="Elimina Utente"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-on-surface-variant italic">
                      Nessun utente trovato nel database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNoticeModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-high rounded-2xl max-w-md w-full border border-outline-variant/30 p-8 shadow-2xl relative animate-scale-in overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-[#7A1414]"></div>
            <button 
              onClick={() => setShowNoticeModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <h3 className="text-xl font-extrabold text-[#7A1414] mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-700">notifications_active</span>
              Invia Avviso
            </h3>
            
            <p className="text-sm text-on-surface-variant mb-4">
              Stai lasciando un avviso per l'utente <span className="font-bold text-on-surface">{noticeUser?.username}</span>. L'utente lo vedrà nella sua barra in alto.
            </p>

            <form onSubmit={handleSendNotice} className="space-y-5">
              <div>
                <textarea 
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  placeholder="Es. 'Per favore cambia il tuo username...'"
                  className="w-full bg-surface-container text-on-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#7A1414] focus:ring-1 focus:ring-[#7A1414] transition-colors h-32 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="flex-1 py-3 bg-outline-variant/20 text-on-surface font-bold rounded-xl text-sm hover:bg-outline-variant/30 transition-colors"
                >
                  Annulla
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-[#7A1414] hover:bg-[#570F0F] text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95"
                >
                  Invia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformAdminDashboard;

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [dbUsers, setDbUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetch('/api/users')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setDbUsers(data);
        } else {
          throw new Error('Formato dati non valido dal server');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Errore nel caricamento degli utenti dal DB:", err);
        setDbUsers([]);
        setLoading(false);
      });
  }, []);

  const getRoleInfo = (u) => {
    if (u.email && u.email.includes('admin')) {
      return { role: 'super_admin', roleLabel: 'Super Admin', path: '/dashboard/platform-admin', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80' };
    } else if (u.email && u.email.includes('venue')) {
      return { role: 'venue_admin', roleLabel: 'Gestore Sede', path: '/dashboard/venues-boards', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80' };
    } else if (u.email && u.email.includes('game')) {
      return { role: 'game_admin', roleLabel: 'Ammin. Gioco', path: '/dashboard/game-admin', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80' };
    }
    return { role: 'player', roleLabel: 'Giocatore', path: '/dashboard/player', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80' };
  };



  const getUserAvatar = (u, index) => {
    if (u.avatar) return u.avatar;
    const avatars = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80'
    ];
    return avatars[index % avatars.length];
  };

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Trova l'utente corrispondente alle credenziali inserite
    const matchedUser = dbUsers.find(
      (u) => u.email === email && u.passwordHash === password
    );

    if (matchedUser) {
      setError('');
      const roleInfo = getRoleInfo(matchedUser);
      // Salva le informazioni utente in localStorage
      localStorage.setItem('monopoly_user', JSON.stringify({
        id: matchedUser.id,
        email: matchedUser.email,
        name: matchedUser.fullName || matchedUser.username,
        role: roleInfo.role,
        roleLabel: roleInfo.roleLabel,
        avatar: matchedUser.avatar || roleInfo.avatar
      }));

      // Reindirizza alla pagina predefinita in base al ruolo
      navigate(roleInfo.path);
    } else {
      setError('Credenziali non valide. Verifica i tuoi dati e riprova.');
    }
  };

  return (
    <div className="bg-surface min-h-screen flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-0 overflow-hidden bg-surface-container-low rounded-xl shadow-[0px_12px_32px_rgba(43,33,24,0.06)]">
        
        <div className="relative hidden md:flex flex-col justify-between p-12 overflow-hidden bg-primary-container text-on-primary">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg fill="none" height="100%" viewBox="0 0 400 400" width="100%" xmlns="http://www.w3.org/2000/svg">
              <rect height="300" stroke="currentColor" strokeWidth="2" width="300" x="50" y="50"></rect>
              <path d="M50 150H350M50 250H350M150 50V350M250 50V350" stroke="currentColor" strokeWidth="1"></path>
              <circle cx="200" cy="200" r="40" stroke="currentColor" strokeWidth="1"></circle>
              <path d="M200 200L280 280M120 120L200 200M280 120L200 200M200 200L120 280" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1"></path>
              <rect fill="currentColor" height="10" width="10" x="195" y="195"></rect>
            </svg>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-4xl text-inverse-primary" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
              <h1 className="text-headline text-2xl font-extrabold tracking-tighter uppercase">MONOPOLY</h1>
            </div>
            <h2 className="text-headline text-5xl font-extrabold tracking-tighter leading-tight mb-6">
              Piattaforma Monopoly Connessa
            </h2>
            <p className="text-lg opacity-80 font-light max-w-md">
              Tracciamento e gestione intelligente del gioco da tavolo fisico. Monitora gli asset reali e i movimenti dei giocatori attraverso la nostra piattaforma Monopoly Live.
            </p>
          </div>
          
            <div className="relative z-10 mt-auto">
              <div className="flex items-center gap-4 p-6 bg-surface-container-highest/10 backdrop-blur-md rounded-xl border border-outline-variant/10">
                <div className="flex -space-x-3">
                  {dbUsers.slice(0, 3).map((u, i) => (
                    <img key={u.id || i} className="w-10 h-10 rounded-full border-2 border-primary-container object-cover" alt={u.fullName || u.username || 'Utente'} src={getUserAvatar(u, i)} />
                  ))}
                </div>
                <div className="text-sm">
                  <p className="font-semibold">Unisciti a oltre {dbUsers.length || 2400} amministratori e giocatori</p>
                  <p className="opacity-70 text-xs">Gestione di economie fisico-digitali globali</p>
                </div>
              </div>
            </div>
        </div>
        
        <div className="bg-surface-container-lowest p-8 md:p-16 flex flex-col justify-center">
          <div className="md:hidden flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-3xl text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
            <span className="text-headline text-xl font-bold tracking-tighter">MONOPOLY</span>
          </div>
          
          <div className="max-w-md w-full mx-auto">
            <div className="mb-8">
              <h2 className="text-headline text-3xl font-bold text-on-surface mb-2">Accesso Utente</h2>
              <p className="text-on-surface-variant text-sm">Inserisci le tue credenziali per accedere.</p>
            </div>
            
            {error && <div className="p-4 mb-4 text-sm font-medium text-error bg-error-container rounded-lg">{error}</div>}
            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="email">Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">mail</span>
                  <input className="w-full bg-surface-container-high border-0 border-b-2 border-transparent focus:border-primary-container focus:ring-0 rounded-none px-12 py-3.5 text-on-surface transition-all placeholder:text-outline/50 text-sm" id="email" name="email" placeholder="nome@test.it" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="password">Password</label>
                  <a className="text-xs font-medium text-secondary hover:text-primary transition-colors" href="#">Recupera Password</a>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">lock</span>
                  <input 
                    className="w-full bg-surface-container-high border-0 border-b-2 border-transparent focus:border-primary-container focus:ring-0 rounded-none pl-12 pr-12 py-3.5 text-on-surface transition-all placeholder:text-outline/50 text-sm" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••••••" 
                    required 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 rounded-lg transition-colors flex items-center justify-center"
                    title={showPassword ? "Nascondi password" : "Mostra password"}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 py-1">
                <input className="w-4 h-4 rounded-sm border-outline text-primary-container focus:ring-primary-container/20" id="remember" type="checkbox"/>
                <label className="text-sm text-on-surface-variant" htmlFor="remember">Autorizza dispositivo per 30 giorni</label>
              </div>
              
              <button className="w-full bg-primary-container text-on-primary py-4 rounded-xl font-bold text-headline tracking-tight hover:bg-primary transition-all shadow-[0px_4px_12px_rgba(111,26,7,0.2)] active:scale-[0.98]" type="submit">
                Accedi
              </button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-outline-variant/30 text-center">
              <p className="text-sm text-on-surface-variant">
                Non hai un account? 
                <Link to="/register" className="font-bold text-primary hover:underline ml-1">Registrati qui</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

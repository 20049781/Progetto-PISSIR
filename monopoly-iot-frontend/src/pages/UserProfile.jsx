import { useState, useEffect } from 'react';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Jasmine&skinColor=ffdbb4&backgroundColor=b6e3f4', // Female Light Skin
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Lily&skinColor=ae5d29&backgroundColor=d1d4f9',     // Female Dark Skin
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe&skinColor=f8d25c&backgroundColor=ffdf00',      // Female Tan Skin
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Maya&skinColor=d28e5d&backgroundColor=c0aede',     // Female Medium Skin
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Ava&skinColor=ffdbb4&backgroundColor=ffb4a3',      // Female Light Skin 2
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Mia&skinColor=fd9841&backgroundColor=b6e3f4',      // Female Tan Skin 2
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Chloe&skinColor=ae5d29&backgroundColor=d1d4f9',    // Female Dark Skin 2
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Ruby&skinColor=ffdbb4&backgroundColor=ffdf00',      // Female Light Skin 3
  
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack&skinColor=fd9841&backgroundColor=c0aede',     // Male Tan Skin
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo&skinColor=8d5524&backgroundColor=ffb4a3',      // Male Dark Skin
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver&skinColor=e0a39a&backgroundColor=b6e3f4',   // Male Light Skin
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Lucas&skinColor=ffdbb4&backgroundColor=d1d4f9',    // Male Light Skin 2
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Max&skinColor=f8d25c&backgroundColor=ffdf00',      // Male Tan Skin 2
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Ethan&skinColor=ffdbb4&backgroundColor=c0aede',    // Male Light Skin 3
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Ryan&skinColor=8d5524&backgroundColor=d1d4f9',     // Male Dark Skin 2
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Owen&skinColor=d28e5d&backgroundColor=ffb4a3',     // Male Medium Skin
  
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Cat&backgroundColor=b6e3f4',   // Cute pixel cat
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Dog&backgroundColor=c0aede',   // Cute pixel dog
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Fox&backgroundColor=d1d4f9',   // Cute pixel fox
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Panda&backgroundColor=ffb4a3', // Cute pixel panda
  
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robo1&backgroundColor=ffdf00',   // Tech bot 1
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robo2&backgroundColor=b6e3f4',   // Tech bot 2
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robo3&backgroundColor=c0aede',   // Tech bot 3
  'https://api.dicebear.com/7.x/bottts/svg?seed=Mecha&backgroundColor=d1d4f9'    // Tech bot 4
];

const UserProfile = () => {
  const [user, setUser] = useState({
    id: null,
    username: '',
    email: '',
    fullName: '',
    bio: '',
    gender: '',
    age: '',
    avatar: ''
  });

  const [loading, setLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Stato dei campi password
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fetchProfile = () => {
    const userStr = localStorage.getItem('monopoly_user');
    if (!userStr) return;
    const localUser = JSON.parse(userStr);

    fetch(`/api/users/${localUser.id}`)
      .then(res => {
        if (!res.ok) throw new Error("Impossibile caricare il profilo");
        return res.json();
      })
      .then(data => {
        setUser({
          id: data.id,
          username: data.username,
          email: data.email,
          fullName: data.fullName || '',
          bio: data.bio || '',
          gender: data.gender || '',
          age: data.age != null ? data.age.toString() : '',
          avatar: data.avatar || ''
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });

    const payload = {
      username: user.username,
      fullName: user.fullName,
      bio: user.bio,
      gender: user.gender,
      age: user.age ? parseInt(user.age) : null,
      avatar: user.avatar
    };

    fetch(`/api/users/${user.id}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Errore durante il salvataggio");
        }
        return res.json();
      })
      .then((updatedUser) => {
        setProfileMessage({ type: 'success', text: 'Profilo salvato con successo!' });
        
        // Aggiorna nome e avatar in localStorage se modificati
        const userStr = localStorage.getItem('monopoly_user');
        if (userStr) {
          const localUser = JSON.parse(userStr);
          localUser.name = updatedUser.fullName || updatedUser.username || localUser.name;
          localUser.avatar = updatedUser.avatar || localUser.avatar;
          localStorage.setItem('monopoly_user', JSON.stringify(localUser));
          
          // Invia evento personalizzato per notificare TopNavBar dell'aggiornamento del profilo
          window.dispatchEvent(new Event('user-profile-updated'));
        }

        setTimeout(() => setProfileMessage({ type: '', text: '' }), 3000);
      })
      .catch(err => {
        setProfileMessage({ type: 'error', text: err.message });
      });
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Tutti i campi password sono obbligatori' });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Le nuove password non corrispondono' });
      return;
    }

    if (passwords.newPassword.length < 5) {
      setPasswordMessage({ type: 'error', text: 'La nuova password deve essere di almeno 5 caratteri' });
      return;
    }

    const payload = {
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword
    };

    fetch(`/api/users/${user.id}/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Errore durante il cambio password");
        }
        return res.text();
      })
      .then((msg) => {
        setPasswordMessage({ type: 'success', text: msg || 'Password aggiornata con successo!' });
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000);
      })
      .catch(err => {
        setPasswordMessage({ type: 'error', text: err.message });
      });
  };

  if (loading) {
    return <div className="p-12 text-center text-on-surface-variant font-['Inter']">Caricamento delle informazioni del profilo...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 font-['Inter']">
      <header className="mb-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Profilo Utente</h1>
        <p className="text-on-surface-variant font-medium">Gestisci le tue informazioni personali e le impostazioni di sicurezza</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col items-center text-center h-fit relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary via-secondary to-tertiary"></div>
          
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#6f1a07]/20 to-[#fef9e9] p-1 shadow-md mb-4 relative">
            <img 
              src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
              alt={user.username} 
              className="w-full h-full object-cover rounded-full" 
            />
          </div>

          <h2 className="text-xl font-extrabold text-on-surface leading-tight mb-1">{user.fullName || user.username}</h2>
          {user.username ? (
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-4">@{user.username}</p>
          ) : (
            <div className="h-[16px] mb-4"></div>
          )}

          <div className="w-full border-t border-outline-variant/10 pt-4 space-y-3 text-left text-xs text-on-surface-variant/80 font-medium">
            <div className="flex items-center justify-between">
              <span className="opacity-70">Email</span>
              <span className="font-bold text-on-surface">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="opacity-70">Identificatore ID</span>
              <span className="font-mono bg-surface-container-low px-2 py-0.5 rounded font-bold text-on-surface">#{user.id}</span>
            </div>
          </div>

          <div className="w-full border-t border-outline-variant/10 mt-6 pt-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-on-surface text-left mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">photo_library</span>
              Scegli la tua foto profilo
            </h3>
            <div className="max-h-48 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              <div className="grid grid-cols-4 gap-2 p-1">
                {PRESET_AVATARS.map((avatarUrl, idx) => {
                  const isSelected = user.avatar === avatarUrl;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setUser(prev => ({ ...prev, avatar: avatarUrl }))}
                      className={`relative aspect-square rounded-full overflow-hidden p-0.5 transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                        isSelected 
                          ? 'ring-4 ring-amber-400 dark:ring-amber-500 shadow-lg shadow-amber-500/30 scale-110 z-10' 
                          : 'border border-outline-variant/20 hover:border-primary/50'
                      }`}
                    >
                      <img 
                        src={avatarUrl} 
                        alt={`Gamerpic preset ${idx + 1}`} 
                        className="w-full h-full object-cover rounded-full bg-surface-container-low" 
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">account_circle</span>
              Dettagli Personali
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">
                    Nome Completo
                  </label>
                  <input 
                    type="text" 
                    name="fullName"
                    value={user.fullName}
                    onChange={handleProfileChange}
                    placeholder="Es. Luca Rossi"
                    className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl px-4 py-3 text-sm outline-none transition-colors font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">
                    Username
                  </label>
                  <input 
                    type="text" 
                    name="username"
                    value={user.username}
                    onChange={handleProfileChange}
                    placeholder="Es. mario99"
                    className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl px-4 py-3 text-sm outline-none transition-colors font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">
                    Sesso
                  </label>
                  <select 
                    name="gender"
                    value={user.gender}
                    onChange={handleProfileChange}
                    className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl px-4 py-3 text-sm outline-none transition-colors font-semibold cursor-pointer"
                  >
                    <option value="">Seleziona sesso</option>
                    <option value="Maschio">Maschio</option>
                    <option value="Femmina">Femmina</option>
                    <option value="Altro">Altro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">
                    Età
                  </label>
                  <input 
                    type="number" 
                    name="age"
                    min="1"
                    max="120"
                    value={user.age}
                    onChange={handleProfileChange}
                    placeholder="Es. 25"
                    className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl px-4 py-3 text-sm outline-none transition-colors font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">
                  Biografia Personale (Bio)
                </label>
                <textarea 
                  name="bio"
                  value={user.bio}
                  onChange={handleProfileChange}
                  placeholder="Scrivi qualcosa su di te, sulla tua passione per il Monopoly o sulla tua strategia di gioco..."
                  rows="4"
                  className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl px-4 py-3 text-sm outline-none transition-colors font-semibold resize-none"
                />
              </div>

              {profileMessage.text && (
                <div className={`p-4 rounded-xl font-bold text-xs flex items-center gap-2 animate-fade-in border ${
                  profileMessage.type === 'success' 
                    ? 'bg-[#6B8E23]/10 border-[#6B8E23]/20 text-[#6B8E23] dark:text-[#A3C86D]' 
                    : 'bg-red-100 border-red-200 text-red-800'
                }`}>
                  <span className="material-symbols-outlined text-sm">
                    {profileMessage.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  {profileMessage.text}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  className="px-6 py-3 bg-[#4c0900] text-white font-bold rounded-xl text-xs hover:bg-[#6f1a07] transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  Salva Informazioni
                </button>
              </div>
            </form>
          </div>

          <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">lock</span>
              Sicurezza & Password
            </h3>

            <form onSubmit={handleSavePassword} className="space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">
                    Password Corrente
                  </label>
                  <div className="relative">
                    <input 
                      type={showCurrentPassword ? "text" : "password"} 
                      name="currentPassword"
                      value={passwords.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="••••••••••••"
                      className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl pl-4 pr-12 py-3 text-sm outline-none transition-colors font-semibold"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors flex items-center justify-center"
                      title={showCurrentPassword ? "Nascondi password" : "Mostra password"}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {showCurrentPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">
                      Nuova Password
                    </label>
                    <div className="relative">
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        name="newPassword"
                        value={passwords.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Minimo 5 caratteri"
                        className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl pl-4 pr-12 py-3 text-sm outline-none transition-colors font-semibold"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors flex items-center justify-center"
                        title={showNewPassword ? "Nascondi password" : "Mostra password"}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {showNewPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">
                      Conferma Nuova Password
                    </label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        name="confirmPassword"
                        value={passwords.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Ripeti la nuova password"
                        className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl pl-4 pr-12 py-3 text-sm outline-none transition-colors font-semibold"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors flex items-center justify-center"
                        title={showConfirmPassword ? "Nascondi password" : "Mostra password"}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {showConfirmPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {passwordMessage.text && (
                <div className={`p-4 rounded-xl font-bold text-xs flex items-center gap-2 animate-fade-in border ${
                  passwordMessage.type === 'success' 
                    ? 'bg-[#6B8E23]/10 border-[#6B8E23]/20 text-[#6B8E23] dark:text-[#A3C86D]' 
                    : 'bg-red-100 border-red-200 text-red-800'
                }`}>
                  <span className="material-symbols-outlined text-sm">
                    {passwordMessage.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  {passwordMessage.text}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  className="px-6 py-3 bg-[#4c0900] text-white font-bold rounded-xl text-xs hover:bg-[#6f1a07] transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">key</span>
                  Aggiorna Password
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};

export default UserProfile;

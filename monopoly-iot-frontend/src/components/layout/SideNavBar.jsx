import { NavLink } from 'react-router-dom';

const SideNavBar = () => {
  const userStr = localStorage.getItem('monopoly_user');
  const user = userStr ? JSON.parse(userStr) : { role: 'player' };
  const role = user.role || 'player';

  // Configurazione delle voci del menu per ciascun ruolo con ordine realistico (landing page per prima)
  const menuConfigs = {
    player: [
      { to: '/dashboard/player', label: 'Dashboard', icon: 'dashboard' },
      { to: '/dashboard/leaderboard', label: 'Classifica', icon: 'leaderboard' },
      { to: '/dashboard/profile', label: 'Profilo', icon: 'person' },
    ],
    venue_admin: [
      { to: '/dashboard/venues-boards', label: 'La Tua Sede', icon: 'location_city' },
      { to: '/dashboard/tournaments', label: 'Tornei', icon: 'emoji_events' },
      { to: '/dashboard/leaderboard', label: 'Classifica', icon: 'leaderboard' },
      { to: '/dashboard/profile', label: 'Profilo', icon: 'person' },
    ],
    game_admin: [
      { to: '/dashboard/game-admin', label: 'Config. Gioco', icon: 'settings_input_component' },
      { to: '/dashboard/profile', label: 'Profilo', icon: 'person' },
    ],
    super_admin: [
      { to: '/dashboard/platform-admin', label: 'Amministrazione', icon: 'admin_panel_settings' },
      { to: '/dashboard/venues-boards', label: 'Sedi', icon: 'location_city' },
      { to: '/dashboard/tournaments', label: 'Tornei', icon: 'emoji_events' },
      { to: '/dashboard/analytics', label: 'Analisi', icon: 'monitoring' },
      { to: '/dashboard/leaderboard', label: 'Classifica', icon: 'leaderboard' },
      { to: '/dashboard/profile', label: 'Profilo', icon: 'person' },
    ],
  };

  const visibleItems = menuConfigs[role] || [];

  return (
    <aside className="hidden md:flex flex-col h-[calc(100vh-64px)] w-64 fixed left-0 bg-[#f8f4e4] dark:bg-[#1d1c12] bg-gradient-to-r from-[#f8f4e4] to-[#fef9e9] dark:from-[#1d1c12] dark:to-[#2b2118] py-6 font-['Manrope'] antialiased">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-[#4c0900]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
          <span className="text-lg font-black uppercase tracking-widest text-[#4c0900]">MONOPOLY</span>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60 font-bold">Monitoraggio Economico</p>
      </div>

      <nav className="flex-1 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `flex items-center gap-4 px-6 py-3 transition-all duration-300 ${isActive ? 'text-[#1d1c12] dark:text-[#ffffff] font-semibold bg-[#ffffff] dark:bg-[#6f1a07] shadow-sm rounded-r-lg' : 'text-[#57423d] dark:text-[#ddc0ba] opacity-80 hover:translate-x-1 hover:text-[#6f1a07]'}`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default SideNavBar;

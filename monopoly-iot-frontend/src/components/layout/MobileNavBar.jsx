import { NavLink } from 'react-router-dom';

const MobileNavBar = () => {
  const userStr = localStorage.getItem('monopoly_user');
  const user = userStr ? JSON.parse(userStr) : { role: 'player' };
  const role = user.role || 'player';
  const menuConfigs = {
    player: [
      { to: '/dashboard/player', label: 'Pannello', icon: 'dashboard' },
      { to: '/dashboard/leaderboard', label: 'Classifica', icon: 'leaderboard' },
      { to: '/dashboard/profile', label: 'Profilo', icon: 'person' },
    ],
    venue_admin: [
      { to: '/dashboard/venues-boards', label: 'Sedi', icon: 'location_city' },
      { to: '/dashboard/tournaments', label: 'Tornei', icon: 'emoji_events' },
      { to: '/dashboard/leaderboard', label: 'Classifica', icon: 'leaderboard' },
      { to: '/dashboard/profile', label: 'Profilo', icon: 'person' },
    ],
    game_admin: [
      { to: '/dashboard/game-admin', label: 'Config', icon: 'settings_input_component' },
      { to: '/dashboard/profile', label: 'Profilo', icon: 'person' },
    ],
    super_admin: [
      { to: '/dashboard/platform-admin', label: 'Admin', icon: 'admin_panel_settings' },
      { to: '/dashboard/venues-boards', label: 'Sedi', icon: 'location_city' },
      { to: '/dashboard/tournaments', label: 'Tornei', icon: 'emoji_events' },
      { to: '/dashboard/analytics', label: 'Analisi', icon: 'monitoring' },
      { to: '/dashboard/leaderboard', label: 'Classifica', icon: 'leaderboard' },
      { to: '/dashboard/profile', label: 'Profilo', icon: 'person' },
    ],
  };

  const visibleItems = (menuConfigs[role] || []).slice(0, 6);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#fef9e9] dark:bg-[#1d1c12] tonal-transition shadow-[0_-4px_12px_rgba(43,33,24,0.08)] flex justify-around items-center px-4 py-3">
      {visibleItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-[#6f1a07] font-bold' : 'text-[#57423d] dark:text-[#e6e3d3] opacity-80'}`}
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileNavBar;

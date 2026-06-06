import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import TopNavBar from './TopNavBar';
import SideNavBar from './SideNavBar';
import MobileNavBar from './MobileNavBar';

const DashboardLayout = () => {
  const location = useLocation();
  const userStr = localStorage.getItem('monopoly_user');
  
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);
  const role = user.role || 'player';

  const rolePermissions = {
    player: ['/dashboard/player', '/dashboard/leaderboard', '/dashboard/profile'],
    venue_admin: [
      '/dashboard/tournaments',
      '/dashboard/leaderboard',
      '/dashboard/venues-boards',
      '/dashboard/profile'
    ],
    super_admin: [
      '/dashboard/player',
      '/dashboard/analytics',
      '/dashboard/leaderboard',
      '/dashboard/tournaments',
      '/dashboard/venues-boards',
      '/dashboard/profile',
      '/dashboard/platform-admin'
    ],
    game_admin: [
      '/dashboard/game-admin',
      '/dashboard/leaderboard',
      '/dashboard/profile'
    ]
  };

  const allowedPaths = rolePermissions[role] || [];
  
  // Gestiamo la rotta principale /dashboard reindirizzandola alla dashboard predefinita del ruolo
  const currentPath = location.pathname;
  
  if (currentPath === '/dashboard' || currentPath === '/dashboard/') {
    const defaultPath = role === 'player' ? '/dashboard/player' : role === 'venue_admin' ? '/dashboard/venues-boards' : role === 'game_admin' ? '/dashboard/game-admin' : '/dashboard/platform-admin';
    return <Navigate to={defaultPath} replace />;
  }

  const isAllowed = allowedPaths.some(path => currentPath.startsWith(path));

  if (!isAllowed) {
    return (
      <div className="bg-surface text-on-surface antialiased min-h-screen">
        <TopNavBar />
        <div className="flex min-h-screen pt-[64px] justify-center items-center p-8 bg-surface">
          <div className="max-w-md w-full bg-surface-container-low border border-outline-variant/10 p-8 rounded-2xl shadow-lg text-center font-['Manrope']">
            <span className="material-symbols-outlined text-6xl text-error mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>gpp_bad</span>
            <h2 className="text-3xl font-black font-headline text-on-surface mb-2">Accesso Negato</h2>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              Il tuo profilo <strong>{user.roleLabel}</strong> non dispone delle autorizzazioni necessarie per visualizzare questa pagina.
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                to={role === 'player' ? '/dashboard/player' : role === 'venue_admin' ? '/dashboard/venues-boards' : role === 'game_admin' ? '/dashboard/game-admin' : '/dashboard/platform-admin'}
                className="px-6 py-2.5 bg-primary-container text-on-primary rounded-xl text-sm font-bold shadow-sm hover:translate-y-[-1px] transition-all"
              >
                Torna alla Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen">
      <TopNavBar />
      <div className="flex min-h-screen pt-[64px]">
        <SideNavBar />
        <main className="flex-1 md:ml-64 p-8 bg-surface pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileNavBar />
    </div>
  );
};

export default DashboardLayout;

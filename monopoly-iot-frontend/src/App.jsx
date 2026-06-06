import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import SpectatorView from './pages/SpectatorView';
import DashboardLayout from './components/layout/DashboardLayout';
import PlayerDashboard from './pages/PlayerDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import GlobalLeaderboard from './pages/GlobalLeaderboard';
import TournamentManagement from './pages/TournamentManagement';
import VenuesAndBoardsManagement from './pages/VenuesAndBoardsManagement';
import GameAdminDashboard from './pages/GameAdminDashboard';
import UserProfile from './pages/UserProfile';
import PlatformAdminDashboard from './pages/PlatformAdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/spectator" element={<ErrorBoundary><SpectatorView /></ErrorBoundary>} />
        
        {/* Rotte protette della Dashboard */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<PlayerDashboard />} />
          <Route path="player" element={<PlayerDashboard />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="leaderboard" element={<GlobalLeaderboard />} />
          <Route path="tournaments" element={<TournamentManagement />} />
          <Route path="venues-boards" element={<VenuesAndBoardsManagement />} />
          <Route path="game-admin" element={<GameAdminDashboard />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="platform-admin" element={<PlatformAdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

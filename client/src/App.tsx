import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

import Home from './pages/Home';
import Song from './pages/Song';
import Library from './pages/Library';
import SessionLobby from './pages/SessionLobby';
import SessionView from './pages/SessionView';

import Settings from './pages/Settings';
import QuickChatSettings from './pages/QuickChatSettings';

import { SessionProvider } from './contexts/SessionContext';

function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <Router>
          <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-purple-900 selection:text-white relative">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/song" element={<Song />} />
              <Route path="/library" element={<Library />} />
              <Route path="/session/lobby" element={<SessionLobby />} />
              <Route path="/session/:sessionId" element={<SessionView />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/quick-chat" element={<QuickChatSettings />} />
            </Routes>
          </div>
        </Router>
      </SessionProvider>
    </AuthProvider>
  );
}

export default App;

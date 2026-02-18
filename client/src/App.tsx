import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

import Home from './pages/Home';
import Song from './pages/Song';
import Library from './pages/Library';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-purple-900 selection:text-white relative">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/song/*" element={<Song />} />
            <Route path="/library" element={<Library />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

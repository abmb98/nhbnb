import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Matches from './pages/Matches';
import Teams from './pages/Teams';
import Players from './pages/Players';
import TopScorers from './pages/TopScorers';
import LiveMatches from './pages/LiveMatches';
import Eliminations from './pages/Eliminations';
import Admin from './pages/Admin';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/players" element={<Players />} />
              <Route path="/top-scorers" element={<TopScorers />} />
              <Route path="/live" element={<LiveMatches />} />
              <Route path="/eliminations" element={<Eliminations />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;
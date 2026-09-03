import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CandidatesView } from './components/CandidatesView';
import { SpaceMap3D } from './components/SpaceMap3D';
import { ExoWikiView } from './components/ExoWikiView';
import { SkyScannerView } from './components/SkyScannerView';
import { PipelineView } from './components/PipelineView';
import { ClassifierLabView } from './components/ClassifierLabView';
import { ModelMetricsView } from './components/ModelMetricsView';
import { AuthModal } from './components/AuthModal';

import { MOCK_STATS, MOCK_CATEGORIES, MOCK_CANDIDATES } from './lib/mockData';

const VALID_TABS = ['dashboard', 'candidates', 'map', 'wiki', 'scanner', 'pipeline', 'lab', 'metrics'];

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return VALID_TABS.includes(hash) ? hash : 'dashboard';
  });

  const [selectedCandidateId, setSelectedCandidateId] = useState('kic-100234');
  const [apiStatus, setApiStatus] = useState({ connected: false, label: 'Demo Mode (Offline)' });
  const [stats, setStats] = useState(MOCK_STATS);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES);

  // Theme State ('dark' | 'light')
  const [theme, setTheme] = useState(() => localStorage.getItem('exovision_theme') || 'dark');

  // Multi-Language State (default 'en')
  const [lang, setLang] = useState(() => localStorage.getItem('exovision_lang') || 'en');

  // Save theme & lang to localStorage and document element
  useEffect(() => {
    localStorage.setItem('exovision_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('exovision_lang', lang);
  }, [lang]);

  // Authentication State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('exovision_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (VALID_TABS.includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Ping backend API & auth status
  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => {
        setApiStatus({ connected: true, label: 'ML API Connected' });

        fetch('http://localhost:8000/api/stats').then(r => r.ok && r.json()).then(d => d && setStats(d)).catch(() => {});
        fetch('http://localhost:8000/api/categories').then(r => r.ok && r.json()).then(d => d && setCategories(d)).catch(() => {});
        fetch('http://localhost:8000/api/candidates').then(r => r.ok && r.json()).then(d => d && setCandidates(d)).catch(() => {});

        // Check user session endpoint
        fetch('http://localhost:8000/api/auth/me')
          .then(r => r.ok && r.json())
          .then(data => {
            if (data && data.authenticated && data.user) {
              setUser(data.user);
              localStorage.setItem('exovision_user', JSON.stringify(data.user));
            }
          })
          .catch(() => {});
      })
      .catch(() => {
        setApiStatus({ connected: false, label: 'Demo Mode' });
        setStats(MOCK_STATS);
        setCategories(MOCK_CATEGORIES);
        setCandidates(MOCK_CANDIDATES);
      });
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('exovision_user');
    fetch('http://localhost:8000/api/auth/logout', { method: 'POST' }).catch(() => {});
  };

  return (
    <div className="app-shell" data-theme={theme}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiStatus={apiStatus}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
      />

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            candidates={candidates}
            setActiveTab={setActiveTab}
            setSelectedCandidate={(id) => {
              setSelectedCandidateId(id);
              setActiveTab('candidates');
            }}
            lang={lang}
          />
        )}

        {activeTab === 'candidates' && (
          <CandidatesView
            candidates={candidates}
            selectedCandidateId={selectedCandidateId}
            setSelectedCandidateId={setSelectedCandidateId}
            categories={categories}
            apiConnected={apiStatus.connected}
          />
        )}

        {activeTab === 'map' && (
          <SpaceMap3D
            candidates={candidates}
            selectedCandidateId={selectedCandidateId}
            setSelectedCandidateId={setSelectedCandidateId}
            setActiveTab={setActiveTab}
            lang={lang}
          />
        )}

        {activeTab === 'wiki' && <ExoWikiView lang={lang} />}

        {activeTab === 'scanner' && (
          <SkyScannerView
            candidates={candidates}
            setSelectedCandidateId={setSelectedCandidateId}
            setActiveTab={setActiveTab}
            lang={lang}
          />
        )}

        {activeTab === 'pipeline' && <PipelineView apiConnected={apiStatus.connected} />}

        {activeTab === 'lab' && <ClassifierLabView apiConnected={apiStatus.connected} />}

        {activeTab === 'metrics' && <ModelMetricsView apiConnected={apiStatus.connected} />}
      </main>

      <footer>
        <div className="brand">
          <i />
          EXOVISION
        </div>
        <p>Autonomous Exoplanet Candidate Intelligence · Vite + React 18 + FastAPI + XGBoost</p>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(u) => setUser(u)}
      />
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

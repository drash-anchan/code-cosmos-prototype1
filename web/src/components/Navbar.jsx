import React from 'react';
import { LANGUAGES, getTranslation } from '../lib/translations';

export function Navbar({
  activeTab,
  setActiveTab,
  apiStatus,
  user,
  onOpenAuth,
  onLogout,
  theme,
  setTheme,
  lang,
  setLang
}) {
  const t = (key) => getTranslation(lang, key);

  const navItems = [
    { id: 'dashboard', label: t('nav_dashboard') },
    { id: 'candidates', label: t('nav_catalog') },
    { id: 'map', label: t('nav_map') },
    { id: 'wiki', label: t('nav_wiki') },
    { id: 'scanner', label: t('nav_scanner') },
    { id: 'pipeline', label: t('nav_pipeline') },
    { id: 'lab', label: t('nav_lab') },
    { id: 'metrics', label: t('nav_metrics') },
  ];

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <nav className="navbar">
      <div className="brand" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
        <i />
        <span>{t('brand')}</span>
      </div>

      <div className="navlinks">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(item.id);
              window.location.hash = `#${item.id}`;
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="nav-right">
        {/* Language Selector */}
        <div className="lang-select-wrapper" title="Select Interface Language">
          <span className="lang-icon">🌐</span>
          <select
            className="lang-dropdown"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* Theme Switcher Toggle Button */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>

        {user ? (
          <div className="user-profile-badge" title={`Signed in as ${user.email}`}>
            <span className="user-avatar">👤</span>
            <span className="user-name">{user.username || user.email.split('@')[0]}</span>
            <button className="logout-btn" onClick={onLogout} title="Sign Out">
              ✕
            </button>
          </div>
        ) : (
          <button className="auth-nav-btn" onClick={onOpenAuth}>
            {t('nav_signin')}
          </button>
        )}

        <div className="api-badge" title={apiStatus.connected ? 'Connected to FastAPI backend' : 'Running offline in client-side Demo mode'}>
          <b className={apiStatus.connected ? 'online' : 'offline'} />
          <span>{apiStatus.label}</span>
        </div>
      </div>
    </nav>
  );
}

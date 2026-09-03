import React, { useState } from 'react';
import { getTranslation } from '../lib/translations';

export function ExoWikiView({ lang }) {
  const t = (key) => getTranslation(lang, key);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState('trappist-1e');

  const ARTICLES = [
    {
      id: 'trappist-1e',
      title: 'TRAPPIST-1e',
      category: 'habitable',
      constellation: 'Aquarius',
      distanceLy: 39.6,
      discoveryYear: 2017,
      method: 'Transit Photometry',
      massEarth: 0.69,
      radiusEarth: 0.92,
      orbitalPeriod: '6.1 days',
      equilibriumTempK: 251,
      image: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=800&auto=format&fit=crop',
      summary: 'TRAPPIST-1e is an Earth-sized exoplanet orbiting within the habitable zone of the ultracool dwarf star TRAPPIST-1, located 39.6 light-years away.',
      description: `TRAPPIST-1e is considered one of the most promising habitable candidates discovered to date. It receives roughly 66% of the solar flux Earth receives from the Sun, making its surface temperature suitable for liquid water under appropriate atmospheric conditions.

JWST transmission spectroscopy observations are actively probing TRAPPIST-1e to determine if it has retained a secondary terrestrial atmosphere rich in nitrogen, carbon dioxide, or water vapor, or if stellar flares from TRAPPIST-1 have stripped its volatile inventory.`,
      keyFacts: [
        { label: 'Host Star', value: 'TRAPPIST-1 (M8V Ultra-cool Dwarf)' },
        { label: 'Surface Gravity', value: '0.93 g (9.12 m/s²)' },
        { label: 'Habitability Index', value: '0.85 (Earth = 1.0)' },
        { label: 'Tidal Locking', value: 'Likely tidally locked' }
      ]
    },
    {
      id: 'proxima-b',
      title: 'Proxima Centauri b',
      category: 'habitable',
      constellation: 'Centaurus',
      distanceLy: 4.24,
      discoveryYear: 2016,
      method: 'Radial Velocity',
      massEarth: 1.17,
      radiusEarth: 1.03,
      orbitalPeriod: '11.2 days',
      equilibriumTempK: 234,
      summary: 'The closest known exoplanet to Earth, orbiting in the habitable zone of Proxima Centauri, the nearest star to our Solar System.',
      description: `Proxima Centauri b lies just 4.24 light-years from Earth. Discovered by the European Southern Observatory (ESO) using radial velocity measurements with HARPS, Proxima b orbits its red dwarf host star at a distance of 0.05 AU.

Despite its close orbit, Proxima b resides within the habitable zone due to the host star's low luminosity. However, intense X-ray and extreme ultraviolet (EUV) stellar flares pose significant challenges for atmospheric retention and surface life.`,
      keyFacts: [
        { label: 'Host Star', value: 'Proxima Centauri (M5.5V Red Dwarf)' },
        { label: 'Distance', value: '4.24 Light-Years (1.30 pc)' },
        { label: 'Stellar Flux', value: '65% of Earth irradiance' },
        { label: 'Flare Environment', value: 'Extreme UV/X-ray irradiation' }
      ]
    },
    {
      id: 'toi-700-d',
      title: 'TOI-700 d',
      category: 'habitable',
      constellation: 'Dorado',
      distanceLy: 101.4,
      discoveryYear: 2020,
      method: 'Transit Photometry (TESS)',
      massEarth: 1.72,
      radiusEarth: 1.14,
      orbitalPeriod: '37.4 days',
      equilibriumTempK: 269,
      summary: 'First Earth-sized habitable zone planet discovered by NASA\'s Transiting Exoplanet Survey Satellite (TESS).',
      description: `TOI-700 d orbits a quiet M-dwarf star located 101.4 light-years away in the constellation Dorado. Unlike many red dwarf host stars, TOI-700 shows low magnetic activity and no recorded superflares over years of TESS monitoring.

Climate modeling indicates TOI-700 d could host a global liquid ocean or Earth-like atmospheric circulation, making it a prime candidate for future space telescope atmospheric characterization.`,
      keyFacts: [
        { label: 'Host Star', value: 'TOI-700 (M2V Quiet Red Dwarf)' },
        { label: 'System Multiplicity', value: '4 planets (b, c, d, e)' },
        { label: 'Insolation', value: '86% of Earth solar flux' }
      ]
    },
    {
      id: 'kepler-22b',
      title: 'Kepler-22b',
      category: 'super-earth',
      constellation: 'Cygnus',
      distanceLy: 635.0,
      discoveryYear: 2011,
      method: 'Transit Photometry (Kepler)',
      massEarth: 9.1,
      radiusEarth: 2.4,
      orbitalPeriod: '289.9 days',
      equilibriumTempK: 262,
      summary: 'The first transiting Super-Earth confirmed inside the habitable zone of a Sun-like (G-type) star.',
      description: `Kepler-22b is a famous exoplanet located 635 light-years away in the Cygnus constellation. Radius measurements (2.4 R_Earth) place Kepler-22b on the boundary between a massive rocky Super-Earth and an ocean-covered Mini-Neptune with a volatile gas envelope.

If Kepler-22b has a dense atmosphere, its surface temperature could be comparable to Earth's average temperature of 15°C (59°F).`,
      keyFacts: [
        { label: 'Host Star', value: 'Kepler-22 (G5V Sun-like Star)' },
        { label: 'Semi-major Axis', value: '0.85 AU' },
        { label: 'Composition', value: 'Ocean World / Mini-Neptune boundary' }
      ]
    },
    {
      id: 'wasp-12b',
      title: 'WASP-12b',
      category: 'hot-jupiter',
      constellation: 'Auriga',
      distanceLy: 1410.0,
      discoveryYear: 2008,
      method: 'Transit Photometry',
      massEarth: 464.0,
      radiusEarth: 1.9,
      orbitalPeriod: '1.09 days',
      equilibriumTempK: 2500,
      summary: 'An ultra-hot gas giant in a spiraling death orbit, currently being tidally disrupted and consumed by its host star.',
      description: `WASP-12b is one of the hottest known exoplanets, with dayside temperatures exceeding 2,500 K (4,000°F). Orbiting its star at a distance of just 0.022 AU, extreme tidal gravitational forces have distorted the planet into an egg-like shape.

Sub-arcsecond observations demonstrate WASP-12b is actively leaking mass to its host star via tidal stripping, and its orbital period is decaying at a rate of 29 milliseconds per year.`,
      keyFacts: [
        { label: 'Host Star', value: 'WASP-12 (F1V Late-F Star)' },
        { label: 'Tidal Distortion', value: 'Egg-shaped prolate ellipsoid' },
        { label: 'Orbital Decay', value: 'Collision in ~3 million years' }
      ]
    },
    {
      id: 'kic-8462852',
      title: 'KIC 8462852 (Tabby\'s Star)',
      category: 'anomalous',
      constellation: 'Cygnus',
      distanceLy: 1470.0,
      discoveryYear: 2015,
      method: 'Transit Anomalies (Kepler)',
      massEarth: 4.8,
      radiusEarth: 1.5,
      orbitalPeriod: 'Irregular Dips',
      equilibriumTempK: 6750,
      summary: 'An unusual star showing asymmetric non-periodic light curve dips up to 22% depth, attributed to circumstellar dust or fragmented comets.',
      description: `Discovered by Citizen Scientists in Kepler light curve telemetry, Tabby's Star exhibited deep, erratic brightness drops that could not be explained by a single spherical transiting planet.

Multi-wavelength follow-up confirmed the dips are wavelength-dependent (starlight dims more in blue than infrared), proving the obscuring material consists of fine dust grains, likely from disintegrating exocomets or colliding planetesimals.`,
      keyFacts: [
        { label: 'Host Star', value: 'KIC 8462852 (F3V Star)' },
        { label: 'Max Dip Depth', value: '22% brightness drop' },
        { label: 'Cause', value: 'Circumstellar dust / Exocomet swarm' }
      ]
    }
  ];

  const filteredArticles = ARTICLES.filter((art) => {
    const matchesCategory = activeCategory === 'all' || art.category === activeCategory;
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.constellation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedArticle = ARTICLES.find((a) => a.id === selectedArticleId) || ARTICLES[0];

  return (
    <div className="exo-wiki-container">
      {/* Header Banner */}
      <div className="wiki-hero-header">
        <div className="eyebrow">EXOPLANET KNOWLEDGE BASE</div>
        <h1>Encyclopedia of Exoplanets</h1>
        <p>Comprehensive scientific directory of extrasolar planets, detection techniques, and physical classification.</p>

        {/* Search & Category Filter Bar */}
        <div className="wiki-filter-bar">
          <div className="wiki-search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search exoplanets (e.g. TRAPPIST, Kepler, Proxima, Cygnus)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="category-pills">
            <button
              className={`pill ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All Planets
            </button>
            <button
              className={`pill ${activeCategory === 'habitable' ? 'active' : ''}`}
              onClick={() => setActiveCategory('habitable')}
            >
              Habitable Zone 🌍
            </button>
            <button
              className={`pill ${activeCategory === 'super-earth' ? 'active' : ''}`}
              onClick={() => setActiveCategory('super-earth')}
            >
              Super-Earths 🪐
            </button>
            <button
              className={`pill ${activeCategory === 'hot-jupiter' ? 'active' : ''}`}
              onClick={() => setActiveCategory('hot-jupiter')}
            >
              Hot Jupiters 🔥
            </button>
            <button
              className={`pill ${activeCategory === 'anomalous' ? 'active' : ''}`}
              onClick={() => setActiveCategory('anomalous')}
            >
              Anomalous Systems ✨
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Directory Sidebar + Detailed Article View */}
      <div className="wiki-layout">
        {/* Left Sidebar: Article List */}
        <div className="wiki-sidebar">
          <h3>DISCOVERED TARGETS ({filteredArticles.length})</h3>
          <div className="article-list">
            {filteredArticles.map((art) => (
              <div
                key={art.id}
                className={`article-card-item ${selectedArticleId === art.id ? 'selected' : ''}`}
                onClick={() => setSelectedArticleId(art.id)}
              >
                <div className="item-header">
                  <h4>{art.title}</h4>
                  <span className="badge-dist">{art.distanceLy} ly</span>
                </div>
                <div className="item-sub">
                  <span>{art.constellation}</span> &bull; <span>{art.method}</span>
                </div>
                <p>{art.summary.slice(0, 85)}...</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Content View: Full Article */}
        <div className="wiki-article-view">
          <div className="article-main-header">
            <div>
              <div className="eyebrow">{selectedArticle.category.toUpperCase()} PLANETARY SYSTEM</div>
              <h2>{selectedArticle.title}</h2>
              <div className="article-meta-tags">
                <span className="tag">📍 Constellation: {selectedArticle.constellation}</span>
                <span className="tag">📏 Distance: {selectedArticle.distanceLy} Light-Years</span>
                <span className="tag">📅 Discovered: {selectedArticle.discoveryYear}</span>
                <span className="tag">🔭 Method: {selectedArticle.method}</span>
              </div>
            </div>
          </div>

          <div className="article-body-grid">
            <div className="article-text-content">
              <h3>Scientific Overview</h3>
              {selectedArticle.description.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}

              <div className="wiki-section-box">
                <h3>Detection & Photometric Signature</h3>
                <p>
                  Observed via <strong>{selectedArticle.method}</strong>. Light curves show periodic dips consistent with an orbital period of {selectedArticle.orbitalPeriod}.
                  Equilibrium temperature is estimated at <strong>{selectedArticle.equilibriumTempK} K</strong> ({Math.round(selectedArticle.equilibriumTempK - 273.15)}°C).
                </p>
              </div>
            </div>

            {/* Infobox Panel */}
            <div className="wiki-infobox">
              <div className="infobox-header">PLANETARY PARAMETERS</div>
              <div className="infobox-rows">
                <div className="row">
                  <span>Mass (M<sub>⊕</sub>)</span>
                  <b>{selectedArticle.massEarth} Earths</b>
                </div>
                <div className="row">
                  <span>Radius (R<sub>⊕</sub>)</span>
                  <b>{selectedArticle.radiusEarth} Earths</b>
                </div>
                <div className="row">
                  <span>Orbital Period</span>
                  <b>{selectedArticle.orbitalPeriod}</b>
                </div>
                <div className="row">
                  <span>Equilibrium Temp</span>
                  <b>{selectedArticle.equilibriumTempK} K</b>
                </div>

                {selectedArticle.keyFacts.map((fact, i) => (
                  <div className="row" key={i}>
                    <span>{fact.label}</span>
                    <b>{fact.value}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

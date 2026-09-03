import React, { useState, useEffect } from 'react';
import gsap from 'gsap';
import { getMockCandidateDetail } from '../lib/mockData';

export function CandidatesView({ candidates, selectedCandidateId, setSelectedCandidateId, categories, apiConnected }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minConf, setMinConf] = useState(0);
  const [multiOnly, setMultiOnly] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const filteredCandidates = candidates.filter((cand) => {
    if (search && !cand.name.toLowerCase().includes(search.toLowerCase()) && !cand.id.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== 'all' && cand.category !== selectedCategory) {
      return false;
    }
    if (cand.confidence < minConf) {
      return false;
    }
    if (multiOnly && !cand.isMultiPlanet) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (!selectedCandidateId && candidates.length > 0) {
      setSelectedCandidateId(candidates[0].id);
    }
  }, [candidates]);

  // Ensure selected candidate is visible in list and scroll into view
  useEffect(() => {
    if (!selectedCandidateId) return;
    const isVisible = candidates.filter((cand) => {
      if (search && !cand.name.toLowerCase().includes(search.toLowerCase()) && !cand.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedCategory !== 'all' && cand.category !== selectedCategory) return false;
      if (cand.confidence < minConf) return false;
      if (multiOnly && !cand.isMultiPlanet) return false;
      return true;
    }).some(c => c.id === selectedCandidateId);

    if (!isVisible) {
      setSearch('');
      setSelectedCategory('all');
      setMinConf(0);
      setMultiOnly(false);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCandidateId]);

  useEffect(() => {
    if (!selectedCandidateId) return;
    setLoadingDetail(true);

    if (apiConnected) {
      fetch(`http://localhost:8000/api/candidates/${selectedCandidateId}`)
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => {
          setDetailData(data);
          setLoadingDetail(false);
        })
        .catch(() => {
          setDetailData(getMockCandidateDetail(selectedCandidateId));
          setLoadingDetail(false);
        });
    } else {
      setDetailData(getMockCandidateDetail(selectedCandidateId));
      setLoadingDetail(false);
    }
  }, [selectedCandidateId, apiConnected]);

  useEffect(() => {
    if (!loadingDetail) {
      gsap.fromTo(
        '.candidate-detail-card',
        { opacity: 0, scale: 0.96, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [loadingDetail, selectedCandidateId]);

  const activeCand = detailData || getMockCandidateDetail(selectedCandidateId || 'kic-100234');
  const planet = activeCand.planets?.[0];

  return (
    <div className="candidates-container">
      <header className="page-header">
        <div>
          <div className="eyebrow">TARGET EXPLORER</div>
          <h2>Candidate Catalog & Light Curves</h2>
          <p>Filter candidates across Kepler and TESS missions. Inspect raw vs detrended flux and vetting checks.</p>
        </div>
        <div className="catalog-count-pill">
          Showing <b>{filteredCandidates.length}</b> of {candidates.length} Targets
        </div>
      </header>

      <div className="catalog-layout">
        {/* Left Filter Bar & List */}
        <div className="catalog-sidebar">
          <div className="filter-box">
            <input
              type="text"
              className="search-input"
              placeholder="Search star ID or target name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="filter-group">
              <label>Classification Category</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="all">All Categories ({candidates.length})</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.label} ({cat.count})
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>
                Min Confidence Threshold: <span>{Math.round(minConf * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="0.95"
                step="0.05"
                value={minConf}
                onChange={(e) => setMinConf(parseFloat(e.target.value))}
              />
            </div>
            <div className="filter-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={multiOnly}
                  onChange={(e) => setMultiOnly(e.target.checked)}
                />
                Multi-planet systems only
              </label>
            </div>
          </div>

          <div className="candidates-list">
            {filteredCandidates.length === 0 ? (
              <div className="empty-state">No candidates match current search filters.</div>
            ) : (
              filteredCandidates.map((cand) => (
                <div
                  key={cand.id}
                  className={`list-item ${selectedCandidateId === cand.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCandidateId(cand.id)}
                >
                  <div className="item-head">
                    <span className="cand-name">{cand.name}</span>
                    <span className={`cand-conf ${cand.confidence >= 0.85 ? 'high' : 'medium'}`}>
                      {Math.round(cand.confidence * 100)}%
                    </span>
                  </div>
                  <div className="item-sub">
                    <span className="cand-cat">{cand.categoryLabel}</span>
                    <span>P = {cand.periodDays} d</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="catalog-detail-pane">
          {loadingDetail ? (
            <div className="loading-pane">Loading light curve and vetting data…</div>
          ) : activeCand ? (
            <div className="candidate-detail-card">
              <div className="detail-header">
                <div>
                  <span className="mission-pill">{activeCand.mission}</span>
                  <h2>{activeCand.name}</h2>
                  <p className="description-text">{activeCand.categoryDescription}</p>
                </div>
                <div className="confidence-score-badge">
                  <div className="score-val">{Math.round(activeCand.confidence * 100)}%</div>
                  <small>{activeCand.categoryLabel}</small>
                </div>
              </div>

              {/* Stellar & Planetary Parameters Grid */}
              <div className="parameter-grid">
                <div className="param-card">
                  <span>Period</span>
                  <strong>{activeCand.periodDays} days</strong>
                </div>
                <div className="param-card">
                  <span>Transit Depth</span>
                  <strong>{activeCand.depthPpm} ppm</strong>
                </div>
                <div className="param-card">
                  <span>Planet Radius</span>
                  <strong>{activeCand.radiusEarth} R<sub>⊕</sub></strong>
                </div>
                <div className="param-card">
                  <span>Duration</span>
                  <strong>{activeCand.durationHours} hours</strong>
                </div>
                <div className="param-card">
                  <span>SDE / SNR</span>
                  <strong>{activeCand.sde} / {activeCand.snr}</strong>
                </div>
                <div className="param-card">
                  <span>Host Star Radius</span>
                  <strong>{activeCand.star?.radiusRsun} R<sub>☉</sub></strong>
                </div>
              </div>

              {/* Light Curve Phase Plot Simulation */}
              <div className="chart-panel">
                <div className="chart-header">
                  <h3>FOLDED TRANSIT LIGHT CURVE & BEST FIT MODEL</h3>
                  <span>Phase range: -0.5 to +0.5</span>
                </div>
                <div className="svg-curve-wrapper">
                  <svg className="light-curve-svg" viewBox="0 0 500 180" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="90" x2="500" y2="90" stroke="#333333" strokeDasharray="3,3" />
                    <line x1="250" y1="0" x2="250" y2="180" stroke="#333333" strokeDasharray="3,3" />
                    
                    {/* Phase points */}
                    {planet?.folded?.phase?.map((ph, idx) => {
                      const x = (ph + 0.5) * 500;
                      const fl = planet.folded.flux[idx] || 1.0;
                      const depthNorm = (1.0 - fl) * 3500;
                      const y = 90 + depthNorm;
                      return <circle key={idx} cx={x} cy={y} r="1.8" fill="#ffffff" opacity="0.85" />;
                    })}

                    {/* Model Line */}
                    {planet?.model?.phase && (
                      <polyline
                        fill="none"
                        stroke="#888888"
                        strokeWidth="2"
                        points={planet.model.phase.map((ph, idx) => {
                          const x = (ph + 0.5) * 500;
                          const fl = planet.model.flux[idx] || 1.0;
                          const depthNorm = (1.0 - fl) * 3500;
                          const y = 90 + depthNorm;
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        }).join(' ')}
                      />
                    )}
                  </svg>
                </div>
                <div className="chart-legend">
                  <span><b style={{ background: '#ffffff' }} /> Folded Photometric Data</span>
                  <span><b style={{ background: '#888888' }} /> Best-Fit Transit Model</span>
                </div>
              </div>

              {/* Physics Vetting Checks */}
              <div className="vetting-checks-section">
                <h3>Physics-Led Vetting Diagnostics</h3>
                <div className="vetting-grid">
                  {planet?.vetting?.checks?.map((check, i) => (
                    <div key={i} className={`vetting-card ${check.passed ? 'passed' : 'flagged'}`}>
                      <div className="vet-head">
                        <strong>{check.name}</strong>
                        <span className={`status-badge ${check.passed ? 'pass' : 'fail'}`}>
                          {check.passed ? 'PASS' : 'FLAGGED'}
                        </span>
                      </div>
                      <p>{check.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Posterior Sampling */}
              {planet?.posterior && (
                <div className="posterior-section">
                  <h3>MCMC Posterior Parameters (emcee)</h3>
                  <div className="posterior-table">
                    {planet.posterior.parameters.map((p) => (
                      <div key={p.name} className="post-row">
                        <span className="p-name">{p.name} ({p.unit})</span>
                        <span className="p-val">{p.median} ± {p.upper}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SpaceMap3D } from './SpaceMap3D';
import { getTranslation } from '../lib/translations';

gsap.registerPlugin(ScrollTrigger);

export function DashboardView({ stats, candidates, setActiveTab, setSelectedCandidate, lang }) {
  const t = (key) => getTranslation(lang, key);

  const heroRef = useRef(null);
  const bgImgRef = useRef(null);
  const heroContentRef = useRef(null);
  const cardsGridRef = useRef(null);
  const pipelineRef = useRef(null);

  const highConf = candidates.filter(c => c.confidence >= 0.85);
  const displayCandidates = (highConf.length >= 5 ? highConf : candidates).slice(0, 5);

  useEffect(() => {
    const heroEl = heroRef.current;
    const bgEl = bgImgRef.current;
    const heroContent = heroContentRef.current;

    // Interactive 3D Mouse Movement Parallax on Hero Section
    const handleMouseMove = (e) => {
      if (!heroEl || !bgEl) return;
      const rect = heroEl.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const normX = x / (rect.width / 2);
      const normY = y / (rect.height / 2);

      gsap.to(bgEl, {
        rotateY: normX * 6,
        rotateX: -normY * 6,
        scale: 1.08,
        duration: 0.8,
        ease: 'power2.out'
      });

      if (heroContent) {
        gsap.to(heroContent, {
          x: normX * 12,
          y: normY * 8,
          duration: 0.6,
          ease: 'power2.out'
        });
      }
    };

    const handleMouseLeave = () => {
      if (bgEl) {
        gsap.to(bgEl, {
          rotateY: 0,
          rotateX: 0,
          scale: 1,
          duration: 1,
          ease: 'power2.out'
        });
      }
      if (heroContent) {
        gsap.to(heroContent, {
          x: 0,
          y: 0,
          duration: 1,
          ease: 'power2.out'
        });
      }
    };

    if (heroEl) {
      heroEl.addEventListener('mousemove', handleMouseMove);
      heroEl.addEventListener('mouseleave', handleMouseLeave);
    }

    // ScrollTrigger Scroll-driven Scaling & Parallax
    if (bgEl && heroEl) {
      gsap.to(bgEl, {
        scale: 1.25,
        opacity: 0.4,
        y: 80,
        scrollTrigger: {
          trigger: heroEl,
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        }
      });
    }

    // Stagger Entrance Animation for Discovery Cards
    if (cardsGridRef.current) {
      const cards = cardsGridRef.current.querySelectorAll('.candidate-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 50, scale: 0.92, rotateX: 10 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardsGridRef.current,
            start: 'top 85%'
          }
        }
      );
    }

    // Pipeline Architecture Stagger Entrance
    if (pipelineRef.current) {
      const stages = pipelineRef.current.querySelectorAll('.mini-stage');
      gsap.fromTo(
        stages,
        { opacity: 0, x: 40 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: pipelineRef.current,
            start: 'top 80%'
          }
        }
      );
    }

    return () => {
      if (heroEl) {
        heroEl.removeEventListener('mousemove', handleMouseMove);
        heroEl.removeEventListener('mouseleave', handleMouseLeave);
      }
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [candidates]);

  // Card 3D Tilt mouse hover handlers
  const handleCardMouseMove = (e, cardEl) => {
    const rect = cardEl.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const normX = x / (rect.width / 2);
    const normY = y / (rect.height / 2);

    gsap.to(cardEl, {
      rotateY: normX * 10,
      rotateX: -normY * 10,
      scale: 1.03,
      duration: 0.4,
      ease: 'power1.out',
      transformPerspective: 800
    });
  };

  const handleCardMouseLeave = (cardEl) => {
    gsap.to(cardEl, {
      rotateY: 0,
      rotateX: 0,
      scale: 1,
      duration: 0.6,
      ease: 'power2.out'
    });
  };

  return (
    <div className="dashboard-container">
      {/* Hero Section with 3D Mouse Parallax & Scroll Scale */}
      <section className="hero" ref={heroRef} style={{ perspective: 1000, overflow: 'hidden' }}>
        <img
          src="/space-hero-bg.png"
          alt="Deep Space Exoplanet Horizon"
          className="hero-bg-image"
          ref={bgImgRef}
          style={{ willChange: 'transform, opacity', transformStyle: 'preserve-3d' }}
        />
        <div className="hero-overlay" />
        <div ref={heroContentRef} style={{ willChange: 'transform' }}>
          <div className="eyebrow">{t('eyebrow_hero')}</div>
          <h1>
            {t('hero_title_1')}<br />
            <em>{t('hero_title_2')}</em>
          </h1>
          <p>{t('hero_desc')}</p>

          <div className="hero-actions">
            <button className="button" onClick={() => setActiveTab('lab')}>
              {t('btn_run_lab')} <span>↓</span>
            </button>
            <button className="button secondary" onClick={() => setActiveTab('candidates')}>
              {t('btn_browse_catalog')} <span>→</span>
            </button>
          </div>

          <div className="heroMetrics">
            <div>
              <strong>{stats?.starsScanned || 540}</strong>
              <small>{t('stars_scanned')}</small>
            </div>
            <div>
              <strong>{stats?.candidatesFound || 12}</strong>
              <small>{t('candidates_found')}</small>
            </div>
            <div>
              <strong>{stats?.planetsDetected || 17}</strong>
              <small>{t('planets_identified')}</small>
            </div>
            <div>
              <strong>{stats?.modelAccuracy ? Math.round(stats.modelAccuracy * 100) : 88}%</strong>
              <small>{t('model_accuracy')}</small>
            </div>
          </div>
        </div>
      </section>

      {/* Discovery Summary Grid */}
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <div className="eyebrow">{t('eyebrow_discoveries')}</div>
            <h2>{t('title_discoveries')}</h2>
          </div>
          <button className="text-btn" onClick={() => setActiveTab('candidates')}>
            {t('view_all_candidates')}
          </button>
        </div>

        <div className="candidate-cards-grid" ref={cardsGridRef}>
          {displayCandidates.map((cand) => (
            <div
              key={cand.id}
              className="candidate-card hover-glow"
              onMouseMove={(e) => handleCardMouseMove(e, e.currentTarget)}
              onMouseLeave={(e) => handleCardMouseLeave(e.currentTarget)}
              onClick={() => {
                setSelectedCandidate(cand.id);
                setActiveTab('candidates');
                window.location.hash = '#candidates';
              }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="card-top">
                <span className="mission-tag">{cand.mission}</span>
                <span className={`confidence-pill ${cand.confidence >= 0.85 ? 'high' : 'medium'}`}>
                  {Math.round(cand.confidence * 100)}% {t('match')}
                </span>
              </div>
              <h3>{cand.name}</h3>
              <div className="category-label">{cand.categoryLabel}</div>
              <div className="card-metrics">
                <div>
                  <span>{t('period')}</span>
                  <b>{cand.periodDays} d</b>
                </div>
                <div>
                  <span>{t('depth')}</span>
                  <b>{cand.depthPpm} ppm</b>
                </div>
                <div>
                  <span>{t('radius')}</span>
                  <b>{cand.radiusEarth} R<sub>⊕</sub></b>
                </div>
                <div>
                  <span>SDE / SNR</span>
                  <b>{cand.sde} / {cand.snr}</b>
                </div>
              </div>
              <div className="card-footer">
                <span>{cand.isMultiPlanet ? `Multi-planet (${cand.nPlanets} signals)` : 'Single planet candidate'}</span>
                <span className="view-link">{t('inspect')}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3D Interactive Space Map Section */}
      <section className="dashboard-section">
        <SpaceMap3D
          candidates={candidates}
          selectedCandidateId={candidates[0]?.id}
          setSelectedCandidateId={setSelectedCandidate}
          setActiveTab={setActiveTab}
          lang={lang}
        />
      </section>

      {/* Pipeline Architecture Banner */}
      <section className="dashboard-section dark-card" ref={pipelineRef}>
        <div className="pipeline-preview">
          <div>
            <div className="eyebrow">{t('eyebrow_pipeline')}</div>
            <h2>{t('title_pipeline')}</h2>
            <p>{t('desc_pipeline')}</p>
            <button className="button" onClick={() => setActiveTab('pipeline')}>
              {t('btn_explore_pipeline')}
            </button>
          </div>
          <div className="stage-mini-list">
            <div className="mini-stage"><span>01</span> <strong>Photometry Cleaning & GP Detrending</strong></div>
            <div className="mini-stage"><span>02</span> <strong>BLS / TLS Periodogram Search</strong></div>
            <div className="mini-stage"><span>03</span> <strong>Physics Vetting Diagnostics</strong></div>
            <div className="mini-stage"><span>04</span> <strong>XGBoost 5-Class Classifier</strong></div>
            <div className="mini-stage"><span>05</span> <strong>MCMC Posteriors & Parameter Fit</strong></div>
          </div>
        </div>
      </section>
    </div>
  );
}

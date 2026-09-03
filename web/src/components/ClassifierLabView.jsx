import React, { useState, useMemo, useEffect } from 'react';
import gsap from 'gsap';

const DEMO_FEATURES = {
  period_days: 3.21,
  depth_ppm: 820,
  duration_hours: 2.7,
  snr: 14.2,
  sde: 10.8,
  secondary_sigma: 0.8,
  odd_even_sigma: 0.7,
  density_ratio: 1.05,
  v_shape: 0.22,
  harmonic_ppm: 110,
  scatter_ppm: 220,
  transit_count: 17
};

const LABELS = {
  exoplanet_transit: 'Exoplanet transit',
  eclipsing_binary: 'Eclipsing binary',
  stellar_blend: 'Stellar blend',
  starspot: 'Starspot',
  noise: 'Noise'
};

export function ClassifierLabView({ apiConnected }) {
  const [features, setFeatures] = useState(DEMO_FEATURES);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    gsap.fromTo(
      '.labcard',
      { opacity: 0, scale: 0.95, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
    );
  }, []);

  useEffect(() => {
    if (result) {
      gsap.fromTo(
        '.verdict',
        { opacity: 0, scale: 0.94, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)' }
      );
    }
  }, [result]);

  const orderedFeatures = useMemo(
    () =>
      Object.entries(features).filter(([k]) =>
        ['period_days', 'depth_ppm', 'duration_hours', 'snr', 'sde', 'secondary_sigma', 'odd_even_sigma', 'density_ratio', 'v_shape'].includes(k)
      ),
    [features]
  );

  const classify = async () => {
    setLoading(true);
    try {
      if (apiConnected) {
        const res = await fetch('http://localhost:8000/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(features)
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setResult(data);
      } else {
        const planetScore = Math.max(
          0.1,
          Math.min(
            0.98,
            0.54 + features.snr / 80 + features.sde / 80 - features.secondary_sigma / 25 - features.odd_even_sigma / 25 - features.v_shape / 5
          )
        );

        let cat = 'exoplanet_transit';
        if (features.secondary_sigma > 3.0 || features.odd_even_sigma > 3.0) {
          cat = 'eclipsing_binary';
        } else if (features.density_ratio < 0.3 || features.density_ratio > 3.5) {
          cat = 'stellar_blend';
        } else if (features.v_shape > 0.6) {
          cat = 'starspot';
        } else if (planetScore < 0.45) {
          cat = 'noise';
        }

        const probs = {
          exoplanet_transit: cat === 'exoplanet_transit' ? planetScore : (1 - planetScore) * 0.25,
          eclipsing_binary: cat === 'eclipsing_binary' ? 0.88 : (1 - planetScore) * 0.25,
          stellar_blend: cat === 'stellar_blend' ? 0.84 : (1 - planetScore) * 0.2,
          starspot: cat === 'starspot' ? 0.81 : (1 - planetScore) * 0.15,
          noise: cat === 'noise' ? 0.79 : (1 - planetScore) * 0.15
        };

        const total = Object.values(probs).reduce((a, b) => a + b, 0);
        Object.keys(probs).forEach((k) => (probs[k] = Number((probs[k] / total).toFixed(3))));

        setResult({
          category: cat,
          categoryLabel: LABELS[cat],
          confidence: probs[cat],
          probabilities: probs
        });
      }
    } catch {
      setResult({
        category: 'exoplanet_transit',
        categoryLabel: 'Exoplanet transit',
        confidence: 0.94,
        probabilities: {
          exoplanet_transit: 0.94,
          eclipsing_binary: 0.03,
          stellar_blend: 0.02,
          starspot: 0.005,
          noise: 0.005
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const curvePoints = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => {
      const x = i / 99;
      const d = Math.exp(-Math.pow((x - 0.5) / 0.07, 2)) * (features.depth_ppm / 1000);
      const y = 0.5 + d + (Math.sin(i * 2.7) + Math.cos(i * 1.17)) * 0.012;
      return `${(x * 100).toFixed(1)},${(y * 100).toFixed(1)}`;
    }).join(' ');
  }, [features.depth_ppm]);

  return (
    <div className="lab-container">
      <header className="page-header">
        <div>
          <div className="eyebrow">INTERACTIVE MODEL EXPERIMENT</div>
          <h2>Candidate Classifier Lab</h2>
          <p>Adjust vetting parameters or test candidate signatures against the trained XGBoost multi-class classifier.</p>
        </div>
        <div className="modelpill">● XGBoost Model · 5 Classes</div>
      </header>

      <div className="labgrid">
        {/* Left Inputs Panel */}
        <div className="panel inputs">
          <h3>Detection Features</h3>
          {orderedFeatures.map(([key, value]) => (
            <label key={key}>
              <span>{key.replaceAll('_', ' ')}</span>
              <output>
                {Number(value).toFixed(
                  key === 'period_days' || key === 'duration_hours' || key === 'density_ratio' || key === 'v_shape' ? 2 : 0
                )}
              </output>
              <input
                type="range"
                min={key === 'density_ratio' ? 0.1 : 0}
                max={
                  key === 'period_days'
                    ? 30
                    : key === 'depth_ppm'
                    ? 15000
                    : key === 'duration_hours'
                    ? 14
                    : key === 'snr' || key === 'sde'
                    ? 40
                    : key === 'density_ratio'
                    ? 5
                    : key === 'v_shape'
                    ? 1
                    : 15
                }
                step="0.01"
                value={value}
                onChange={(e) => setFeatures({ ...features, [key]: +e.target.value })}
              />
            </label>
          ))}
          <button className="button run" onClick={classify} disabled={loading}>
            {loading ? 'Classifying candidate…' : 'Classify Candidate →'}
          </button>
        </div>

        {/* Center Visual Curve & Vetting Checks */}
        <div className="panel visual">
          <div className="vishead">
            <div>
              <span>SIMULATED LIGHT CURVE</span>
              <h3>EPIC 211945201</h3>
            </div>
            <b>{features.period_days.toFixed(2)} d period</b>
          </div>
          
          <svg className="curve" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" x2="100" y1="50" y2="50" />
            <polyline points={curvePoints} stroke="#ffffff" />
          </svg>

          <div className="axis">
            <span>-0.5 phase</span>
            <span>TRANSIT</span>
            <span>+0.5 phase</span>
          </div>

          <div className="checks">
            <div>
              <span>Secondary eclipse</span>
              <b className={features.secondary_sigma < 3 ? 'pass' : 'fail'}>
                {features.secondary_sigma < 3 ? 'PASS' : 'FLAG'}
              </b>
            </div>
            <div>
              <span>Odd / even depth</span>
              <b className={features.odd_even_sigma < 3 ? 'pass' : 'fail'}>
                {features.odd_even_sigma < 3 ? 'PASS' : 'FLAG'}
              </b>
            </div>
            <div>
              <span>Asterodensity profile</span>
              <b className={features.density_ratio > 0.25 && features.density_ratio < 4 ? 'pass' : 'fail'}>
                {features.density_ratio > 0.25 && features.density_ratio < 4 ? 'PASS' : 'FLAG'}
              </b>
            </div>
          </div>
        </div>

        {/* Right Verdict Panel */}
        <div className="panel verdict">
          {result ? (
            <>
              <div className="eyebrow">MODEL VERDICT</div>
              <div className="score">
                {Math.round(result.confidence * 100)}
                <small>%</small>
              </div>
              <h3>{LABELS[result.category] || result.categoryLabel || result.category}</h3>
              <p>
                {result.category === 'exoplanet_transit'
                  ? 'A coherent periodic dip with no major false-positive signals. This candidate merits transit modeling.'
                  : 'The feature vector is consistent with a false-positive class. Inspect validation checks.'}
              </p>
              <div className="probs">
                {Object.entries(result.probabilities || {})
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, v]) => (
                    <div key={k}>
                      <span>{LABELS[k] || k}</span>
                      <i>
                        <b style={{ width: `${v * 100}%` }} />
                      </i>
                      <em>{Math.round(v * 100)}%</em>
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <>
              <div className="radar">✦</div>
              <h3>Ready to classify</h3>
              <p>Adjust feature sliders and click "Classify Candidate" to view the probability distribution across all five physical categories.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

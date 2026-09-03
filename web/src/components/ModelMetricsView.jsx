import React, { useState, useEffect } from 'react';
import gsap from 'gsap';
import { MOCK_MODEL_METRICS } from '../lib/mockData';

export function ModelMetricsView({ apiConnected }) {
  const [metrics, setMetrics] = useState(MOCK_MODEL_METRICS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    gsap.fromTo(
      '.metric-card',
      { opacity: 0, scale: 0.94, y: 25 },
      { opacity: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
    );
  }, [loading]);

  useEffect(() => {
    if (apiConnected) {
      setLoading(true);
      fetch('http://localhost:8000/api/model/metrics')
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => {
          setMetrics({ ...MOCK_MODEL_METRICS, ...data });
          setLoading(false);
        })
        .catch(() => {
          setMetrics(MOCK_MODEL_METRICS);
          setLoading(false);
        });
    }
  }, [apiConnected]);

  return (
    <div className="metrics-container">
      <header className="page-header">
        <div>
          <div className="eyebrow">MODEL PERFORMANCE DIAGNOSTICS</div>
          <h2>XGBoost Classifier Evaluation</h2>
          <p>Multi-class confusion matrix, feature importance rankings, cross-validation stability, and per-class precision/recall.</p>
        </div>
      </header>

      {/* Metrics Top Summary */}
      <div className="metrics-summary-grid">
        <div className="metric-box">
          <span>Accuracy</span>
          <strong>{Math.round(metrics.accuracy * 100)}%</strong>
        </div>
        <div className="metric-box">
          <span>Macro F1 Score</span>
          <strong>{Math.round(metrics.macroF1 * 100)}%</strong>
        </div>
        <div className="metric-box">
          <span>Planet Precision</span>
          <strong>{Math.round(metrics.planetPrecision * 100)}%</strong>
        </div>
        <div className="metric-box">
          <span>Planet Recall</span>
          <strong>{Math.round(metrics.planetRecall * 100)}%</strong>
        </div>
        <div className="metric-box">
          <span>ROC AUC</span>
          <strong>{metrics.planetRocAuc}</strong>
        </div>
      </div>

      <div className="metrics-detail-grid">
        {/* Feature Importance Chart */}
        <div className="panel-card">
          <h3>XGBoost Feature Importance Ranking</h3>
          <p className="card-sub">Gini impurity reduction across 12 transit & vetting features</p>
          <div className="importance-list">
            {metrics.featureImportance.map((feat) => (
              <div key={feat.name} className="importance-row">
                <span className="feat-name">{feat.name}</span>
                <div className="bar-wrapper">
                  <div className="bar-fill" style={{ width: `${feat.importance * 350}%` }} />
                </div>
                <span className="feat-val">{(feat.importance * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5-Class Confusion Matrix */}
        <div className="panel-card">
          <h3>5-Class Confusion Matrix</h3>
          <p className="card-sub">Test set evaluation across 450 simulated systems</p>
          <div className="matrix-grid">
            <div className="matrix-header">
              <span />
              {metrics.labels.map((l, i) => (
                <span key={i} className="col-head">{l.split(' ')[0]}</span>
              ))}
            </div>
            {metrics.confusionMatrix.map((row, rIdx) => (
              <div key={rIdx} className="matrix-row">
                <span className="row-head">{metrics.labels[rIdx]}</span>
                {row.map((val, cIdx) => (
                  <div
                    key={cIdx}
                    className={`matrix-cell ${rIdx === cIdx ? 'diagonal' : ''}`}
                    style={{
                      backgroundColor: rIdx === cIdx ? 'rgba(255, 255, 255, 0.22)' : 'rgba(38, 38, 38, 0.6)',
                      color: rIdx === cIdx ? '#ffffff' : '#b0b0b0'
                    }}
                  >
                    {val}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per Class Table */}
      <div className="panel-card full-width">
        <h3>Per-Class Performance Breakdown</h3>
        <table className="class-metrics-table">
          <thead>
            <tr>
              <th>Candidate Class</th>
              <th>Precision</th>
              <th>Recall</th>
              <th>F1 Score</th>
              <th>Support</th>
            </tr>
          </thead>
          <tbody>
            {metrics.perClass.map((cls) => (
              <tr key={cls.label}>
                <td><strong>{cls.label}</strong></td>
                <td>{Math.round(cls.precision * 100)}%</td>
                <td>{Math.round(cls.recall * 100)}%</td>
                <td><b style={{ color: '#ffffff' }}>{Math.round(cls.f1 * 100)}%</b></td>
                <td>{cls.support} systems</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

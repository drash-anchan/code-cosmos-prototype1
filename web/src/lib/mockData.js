/**
 * Merged & Enriched Exoplanet Candidate Database Store
 * Combines physical astrophysics parameters from Exovision & exoplanet-site datasets.
 */

export const MOCK_STATS = {
  starsScanned: 540,
  candidatesFound: 12,
  highConfidence: 8,
  multiPlanetSystems: 4,
  planetsDetected: 17,
  categoryCounts: {
    exoplanet_transit: 6,
    eclipsing_binary: 2,
    stellar_blend: 1,
    starspot: 1,
    noise: 2
  },
  modelAccuracy: 0.88,
  modelMacroF1: 0.86
};

export const MOCK_CATEGORIES = [
  {
    slug: 'exoplanet_transit',
    label: 'Exoplanet transit',
    index: 0,
    description: 'Flat-bottomed periodic dip, no secondary eclipse, odd and even depths agree, and the implied stellar density is consistent with the host.',
    count: 6
  },
  {
    slug: 'eclipsing_binary',
    label: 'Eclipsing binary',
    index: 1,
    description: 'Two stars eclipsing each other — deep and often V-shaped, with a secondary eclipse near phase 0.5 or mismatched odd/even depths.',
    count: 2
  },
  {
    slug: 'stellar_blend',
    label: 'Stellar blend',
    index: 2,
    description: 'A real eclipse diluted by a neighbouring star inside the aperture. The depth looks planetary but the shape and density do not.',
    count: 1
  },
  {
    slug: 'starspot',
    label: 'Starspot',
    index: 3,
    description: 'Rotational modulation from spots crossing the visible disc — smooth, quasi-periodic and sinusoidal rather than a discrete transit.',
    count: 1
  },
  {
    slug: 'noise',
    label: 'Noise',
    index: 4,
    description: 'No coherent transit: the periodogram peak is consistent with photometric scatter or an instrumental systematic.',
    count: 2
  }
];

export const MOCK_CANDIDATES = [
  {
    id: 'kic-100234',
    name: 'KIC 100234',
    mission: 'Kepler',
    confidence: 0.94,
    category: 'exoplanet_transit',
    categoryLabel: 'Exoplanet transit',
    isMultiPlanet: true,
    nPlanets: 2,
    periodDays: 3.2107,
    depthPpm: 5940,
    durationHours: 2.64,
    radiusEarth: 2.7,
    sde: 13.7,
    snr: 22.9,
    vetted: true,
    star: { radiusRsun: 0.94, massMsun: 0.97, teffK: 5620, densityRhoSun: 1.17, magnitude: 12.4 }
  },
  {
    id: 'toi-700',
    name: 'TOI 700',
    mission: 'TESS',
    confidence: 0.96,
    category: 'exoplanet_transit',
    categoryLabel: 'Exoplanet transit',
    isMultiPlanet: true,
    nPlanets: 3,
    periodDays: 16.051,
    depthPpm: 1250,
    durationHours: 3.12,
    radiusEarth: 1.07,
    sde: 16.4,
    snr: 25.1,
    vetted: true,
    star: { radiusRsun: 0.42, massMsun: 0.41, teffK: 3480, densityRhoSun: 5.54, magnitude: 13.1 }
  },
  {
    id: 'tic-88420',
    name: 'TIC 88420',
    mission: 'TESS',
    confidence: 0.97,
    category: 'exoplanet_transit',
    categoryLabel: 'Exoplanet transit',
    isMultiPlanet: true,
    nPlanets: 2,
    periodDays: 3.2,
    depthPpm: 2100,
    durationHours: 2.8,
    radiusEarth: 1.45,
    sde: 17.8,
    snr: 27.4,
    vetted: true,
    star: { radiusRsun: 0.82, massMsun: 0.85, teffK: 5120, densityRhoSun: 1.54, magnitude: 11.2 }
  },
  {
    id: 'kic-10593',
    name: 'KIC 10593',
    mission: 'Kepler',
    confidence: 0.88,
    category: 'exoplanet_transit',
    categoryLabel: 'Exoplanet transit',
    isMultiPlanet: false,
    nPlanets: 1,
    periodDays: 6.1,
    depthPpm: 1450,
    durationHours: 3.4,
    radiusEarth: 2.1,
    sde: 12.4,
    snr: 18.6,
    vetted: true,
    star: { radiusRsun: 1.02, massMsun: 1.01, teffK: 5740, densityRhoSun: 0.95, magnitude: 12.8 }
  },
  {
    id: 'toi-1233',
    name: 'TOI 1233',
    mission: 'TESS',
    confidence: 0.91,
    category: 'exoplanet_transit',
    categoryLabel: 'Exoplanet transit',
    isMultiPlanet: true,
    nPlanets: 4,
    periodDays: 3.79,
    depthPpm: 890,
    durationHours: 2.1,
    radiusEarth: 1.82,
    sde: 14.9,
    snr: 19.8,
    vetted: true,
    star: { radiusRsun: 0.88, massMsun: 0.91, teffK: 5320, densityRhoSun: 1.33, magnitude: 10.2 }
  },
  {
    id: 'toi-849',
    name: 'TOI 849',
    mission: 'TESS',
    confidence: 0.93,
    category: 'exoplanet_transit',
    categoryLabel: 'Exoplanet transit',
    isMultiPlanet: false,
    nPlanets: 1,
    periodDays: 0.765,
    depthPpm: 2840,
    durationHours: 1.45,
    radiusEarth: 3.45,
    sde: 18.2,
    snr: 28.6,
    vetted: true,
    star: { radiusRsun: 0.91, massMsun: 0.93, teffK: 5370, densityRhoSun: 1.23, magnitude: 11.9 }
  },
  {
    id: 'kic-20221',
    name: 'KIC 20221',
    mission: 'Kepler',
    confidence: 0.61,
    category: 'eclipsing_binary',
    categoryLabel: 'Eclipsing binary',
    isMultiPlanet: false,
    nPlanets: 1,
    periodDays: 14.4,
    depthPpm: 7200,
    durationHours: 5.1,
    radiusEarth: 4.2,
    sde: 8.4,
    snr: 11.2,
    vetted: true,
    star: { radiusRsun: 1.15, massMsun: 1.12, teffK: 6010, densityRhoSun: 0.74, magnitude: 13.5 }
  },
  {
    id: 'kic-12557548',
    name: 'KIC 12557548',
    mission: 'Kepler',
    confidence: 0.78,
    category: 'starspot',
    categoryLabel: 'Starspot',
    isMultiPlanet: false,
    nPlanets: 1,
    periodDays: 15.68,
    depthPpm: 6400,
    durationHours: 8.4,
    radiusEarth: 0.85,
    sde: 6.8,
    snr: 8.1,
    vetted: true,
    star: { radiusRsun: 0.66, massMsun: 0.68, teffK: 4450, densityRhoSun: 2.36, magnitude: 14.8 }
  },
  {
    id: 'kic-8462852',
    name: 'KIC 8462852 (Tabby\'s Star)',
    mission: 'Kepler',
    confidence: 0.42,
    category: 'stellar_blend',
    categoryLabel: 'Stellar blend',
    isMultiPlanet: false,
    nPlanets: 1,
    periodDays: 48.8,
    depthPpm: 18200,
    durationHours: 14.2,
    radiusEarth: 4.8,
    sde: 7.1,
    snr: 9.4,
    vetted: true,
    star: { radiusRsun: 1.58, massMsun: 1.43, teffK: 6750, densityRhoSun: 0.36, magnitude: 11.7 }
  },
  {
    id: 'kic-9832227',
    name: 'KIC 9832227',
    mission: 'Kepler',
    confidence: 0.89,
    category: 'eclipsing_binary',
    categoryLabel: 'Eclipsing binary',
    isMultiPlanet: false,
    nPlanets: 1,
    periodDays: 0.458,
    depthPpm: 42000,
    durationHours: 1.8,
    radiusEarth: 9.2,
    sde: 21.8,
    snr: 34.2,
    vetted: true,
    star: { radiusRsun: 1.12, massMsun: 1.08, teffK: 5890, densityRhoSun: 0.77, magnitude: 12.1 }
  },
  {
    id: 'kic-30114',
    name: 'KIC 30114',
    mission: 'Kepler',
    confidence: 0.22,
    category: 'noise',
    categoryLabel: 'Noise',
    isMultiPlanet: false,
    nPlanets: 0,
    periodDays: 2.1,
    depthPpm: 240,
    durationHours: 1.1,
    radiusEarth: 0.5,
    sde: 3.2,
    snr: 3.8,
    vetted: true,
    star: { radiusRsun: 0.79, massMsun: 0.81, teffK: 4950, densityRhoSun: 1.62, magnitude: 15.6 }
  },
  {
    id: 'kic-5807616',
    name: 'KIC 5807616',
    mission: 'Kepler',
    confidence: 0.35,
    category: 'noise',
    categoryLabel: 'Noise',
    isMultiPlanet: false,
    nPlanets: 0,
    periodDays: 2.11,
    depthPpm: 310,
    durationHours: 1.2,
    radiusEarth: 0.6,
    sde: 4.1,
    snr: 4.9,
    vetted: true,
    star: { radiusRsun: 1.05, massMsun: 1.02, teffK: 5780, densityRhoSun: 0.88, magnitude: 15.2 }
  }
];

export function getMockCandidateDetail(candId) {
  const base = MOCK_CANDIDATES.find(c => c.id.toLowerCase() === candId?.toLowerCase()) || MOCK_CANDIDATES[0];
  const n = 100;
  const period = base.periodDays;
  const depthFrac = base.depthPpm / 1e6;
  const durationHrs = base.durationHours;
  
  const time = Array.from({ length: n }, (_, i) => Number((i * (period * 2.2) / n).toFixed(3)));
  const rawFlux = [];
  const detrendedFlux = [];
  const trend = [];
  const phase = Array.from({ length: n }, (_, i) => Number(((i / (n - 1)) - 0.5).toFixed(3)));
  const modelFlux = [];

  for (let i = 0; i < n; i++) {
    const t = time[i];
    const tr = 1.0 + 0.0003 * Math.sin(2 * Math.PI * t / (period * 2.5));
    const p = phase[i];
    const inT = Math.abs(p) < (durationHrs / 24.0 / period / 2.0);
    const dip = inT ? depthFrac * Math.exp(-Math.pow(p / 0.025, 2)) : 0;
    
    const noise = (Math.sin(i * 3.7) + Math.cos(i * 1.9)) * 0.00015;
    const dt = 1.0 - dip + noise;
    detrendedFlux.push(Number(dt.toFixed(6)));
    rawFlux.push(Number((dt * tr).toFixed(6)));
    trend.append ? null : trend.push(Number(tr.toFixed(6)));
    modelFlux.push(Number((1.0 - dip).toFixed(6)));
  }

  const isEB = base.category === 'eclipsing_binary';
  const isBlend = base.category === 'stellar_blend';

  return {
    ...base,
    categoryDescription: MOCK_CATEGORIES.find(cat => cat.slug === base.category)?.description || '',
    lightCurve: { time, rawFlux, detrendedFlux, trend },
    planets: [
      {
        label: `Planet b · ${base.periodDays} d`,
        letter: 'b',
        periodDays: base.periodDays,
        t0: 1.4021,
        depthPpm: base.depthPpm,
        durationHours: base.durationHours,
        radiusEarth: base.radiusEarth,
        aOverRs: 9.8,
        impactParameter: 0.31,
        inclinationDeg: 88.2,
        equilibriumTempK: 1120,
        sde: base.sde,
        snr: base.snr,
        confidence: base.confidence,
        category: base.category,
        categoryLabel: base.categoryLabel,
        folded: { phase, flux: detrendedFlux },
        binned: { phase, flux: detrendedFlux, err: Array(n).fill(0.0003) },
        model: { phase, flux: modelFlux },
        vetting: {
          secondaryEclipseDepthPpm: isEB ? 415 : 41,
          secondaryEclipseSigma: isEB ? 4.8 : 0.8,
          secondaryEclipseFlag: isEB,
          oddDepthPpm: isEB ? base.depthPpm * 1.08 : base.depthPpm * 0.99,
          evenDepthPpm: isEB ? base.depthPpm * 0.92 : base.depthPpm * 1.01,
          oddEvenSigma: isEB ? 3.7 : 0.9,
          oddEvenFlag: isEB,
          impliedDensityRhoSun: isBlend ? 0.22 : base.star.densityRhoSun * 0.95,
          densityRatio: isBlend ? 0.18 : 0.98,
          asterodensityFlag: isBlend,
          vShapeScore: isEB ? 0.72 : 0.21,
          vShapeFlag: isEB,
          harmonicAmplitudePpm: 415,
          transitCount: Math.max(8, Math.round(90 / period)),
          verdict: isEB ? 'Flagged as Eclipsing Binary' : isBlend ? 'Flagged as Stellar Blend' : 'Passes all vetting checks',
          checks: [
            {
              name: 'Secondary eclipse',
              passed: !isEB,
              detail: isEB ? '4.8σ secondary at phase 0.5 — star companion detected' : '0.8σ at phase 0.5 — consistent with noise'
            },
            {
              name: 'Odd / even depths',
              passed: !isEB,
              detail: isEB ? '3.7σ depth offset between alternate transits' : 'Depths agree within 0.9σ'
            },
            {
              name: 'Asterodensity profile',
              passed: !isBlend,
              detail: isBlend ? 'Implied density ratio 0.18 disagrees with host star' : 'Implied density matches host star geometry'
            }
          ]
        },
        posterior: {
          sampler: 'emcee',
          nSamples: 6400,
          acceptanceFraction: 0.42,
          converged: true,
          parameters: [
            { name: 'period', unit: 'days', median: base.periodDays, lower: 0.0004, upper: 0.0004 },
            { name: 'rp_over_rs', unit: 'ratio', median: Number(Math.sqrt(base.depthPpm / 1e6).toFixed(4)), lower: 0.001, upper: 0.001 },
            { name: 'a_over_rs', unit: 'ratio', median: 9.8, lower: 0.3, upper: 0.3 },
            { name: 'inclination', unit: 'deg', median: 88.2, lower: 0.4, upper: 0.4 }
          ],
          chainSummary: { maxAutocorrTime: 41.2, nEffective: 155 }
        }
      }
    ],
    featureVector: {
      period_days: base.periodDays,
      depth_ppm: base.depthPpm,
      duration_hours: base.durationHours,
      snr: base.snr,
      sde: base.sde,
      secondary_sigma: isEB ? 4.8 : 0.8,
      odd_even_sigma: isEB ? 3.7 : 0.9,
      density_ratio: isBlend ? 0.18 : 0.98,
      v_shape: isEB ? 0.72 : 0.21,
      harmonic_ppm: 110,
      scatter_ppm: 220,
      transit_count: Math.max(8, Math.round(90 / period))
    },
    topFeatures: [
      { name: 'sde', value: base.sde, importance: 0.22 },
      { name: 'secondary_sigma', value: isEB ? 4.8 : 0.8, importance: 0.18 },
      { name: 'odd_even_sigma', value: isEB ? 3.7 : 0.9, importance: 0.15 },
      { name: 'density_ratio', value: isBlend ? 0.18 : 0.98, importance: 0.14 }
    ]
  };
}

export const MOCK_MODEL_METRICS = {
  accuracy: 0.88,
  balancedAccuracy: 0.86,
  macroF1: 0.86,
  planetPrecision: 0.92,
  planetRecall: 0.90,
  planetRocAuc: 0.96,
  labels: ['Exoplanet transit', 'Eclipsing binary', 'Stellar blend', 'Starspot', 'Noise'],
  confusionMatrix: [
    [88, 3, 4, 3, 2],
    [2, 91, 5, 1, 1],
    [5, 4, 85, 4, 2],
    [3, 1, 4, 89, 3],
    [2, 1, 2, 3, 92]
  ],
  perClass: [
    { label: 'Exoplanet transit', precision: 0.90, recall: 0.88, f1: 0.89, support: 100 },
    { label: 'Eclipsing binary', precision: 0.93, recall: 0.91, f1: 0.92, support: 100 },
    { label: 'Stellar blend', precision: 0.85, recall: 0.85, f1: 0.85, support: 100 },
    { label: 'Starspot', precision: 0.89, recall: 0.89, f1: 0.89, support: 100 },
    { label: 'Noise', precision: 0.92, recall: 0.92, f1: 0.92, support: 100 }
  ],
  featureImportance: [
    { name: 'sde', importance: 0.22 },
    { name: 'secondary_sigma', importance: 0.18 },
    { name: 'odd_even_sigma', importance: 0.15 },
    { name: 'density_ratio', importance: 0.14 },
    { name: 'v_shape', importance: 0.11 },
    { name: 'depth_ppm', importance: 0.08 },
    { name: 'duration_hours', importance: 0.07 },
    { name: 'harmonic_ppm', importance: 0.05 }
  ],
  crossValidation: { folds: 5, accuracyMean: 0.87, accuracyStd: 0.018 },
  nTrain: 1800,
  nTest: 450,
  nFeatures: 12
};

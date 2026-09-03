import React, { useState, useEffect, useRef } from 'react';
import { getTranslation } from '../lib/translations';

export function SkyScannerView({ candidates, setSelectedCandidateId, setActiveTab, lang }) {
  const t = (key) => getTranslation(lang, key);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [heading, setHeading] = useState(45); // 0 to 360 degrees
  const [pitch, setPitch] = useState(30); // altitude angle
  const [lockedPlanet, setLockedPlanet] = useState(null);
  const [isManualDrag, setIsManualDrag] = useState(false);
  const dragStartRef = useRef({ x: 0, heading: 45 });

  // Catalog of Sky Targets mapped to Celestial Sectors (Heading / Pitch)
  const SKY_TARGETS = [
    {
      id: 'proxima-b',
      name: 'Proxima Centauri b',
      constellation: 'Centaurus',
      distanceLy: 4.24,
      distancePc: 1.30,
      ra: '14h 29m 42s',
      dec: '-62° 40′ 46″',
      targetHeading: 180, // South
      targetPitch: 25,
      confidence: 0.98,
      type: 'Earth-mass Habitable Candidate'
    },
    {
      id: 'trappist-1e',
      name: 'TRAPPIST-1e',
      constellation: 'Aquarius',
      distanceLy: 39.6,
      distancePc: 12.1,
      ra: '23h 06m 29s',
      dec: '-05° 02′ 29″',
      targetHeading: 215, // SW
      targetPitch: 40,
      confidence: 0.95,
      type: 'Terrestrial Habitable Zone Planet'
    },
    {
      id: 'toi-700',
      name: 'TOI-700 d',
      constellation: 'Dorado',
      distanceLy: 101.4,
      distancePc: 31.1,
      ra: '06h 28m 23s',
      dec: '-65° 34′ 43″',
      targetHeading: 135, // SE
      targetPitch: 15,
      confidence: 0.96,
      type: 'TESS Habitable Zone Planet'
    },
    {
      id: 'kic-100234',
      name: 'KIC 100234',
      constellation: 'Cygnus',
      distanceLy: 480.0,
      distancePc: 147.2,
      ra: '19h 44m 10s',
      dec: '+45° 12′ 00″',
      targetHeading: 45, // NE
      targetPitch: 50,
      confidence: 0.94,
      type: 'Multi-planet Transit Candidate'
    },
    {
      id: 'kepler-22b',
      name: 'Kepler-22b',
      constellation: 'Cygnus',
      distanceLy: 635.0,
      distancePc: 194.7,
      ra: '19h 16m 52s',
      dec: '+47° 53′ 04″',
      targetHeading: 55, // NE
      targetPitch: 55,
      confidence: 0.92,
      type: 'Super-Earth Habitable Candidate'
    },
    {
      id: 'kic-8462852',
      name: 'KIC 8462852 (Tabby\'s Star)',
      constellation: 'Cygnus',
      distanceLy: 1470.0,
      distancePc: 450.7,
      ra: '20h 06m 15s',
      dec: '+44° 27′ 25″',
      targetHeading: 65, // NE
      targetPitch: 48,
      confidence: 0.42,
      type: 'Anomalous Stellar Dipper'
    }
  ];

  // 1. Initialize Device Camera Access
  useEffect(() => {
    let stream = null;
    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setCameraActive(true);
          }
        } else {
          setCameraError('Camera API not available on this browser.');
        }
      } catch (err) {
        setCameraError('Live camera permission not granted. Running in Night Sky AR Simulation mode.');
        setCameraActive(false);
      }
    }
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // 2. Device Orientation Compass API Listener (if supported on mobile)
  useEffect(() => {
    const handleOrientation = (e) => {
      if (e.alpha !== null && !isManualDrag) {
        const compassHeading = 360 - e.alpha;
        setHeading(Math.round(compassHeading % 360));
      }
      if (e.beta !== null && !isManualDrag) {
        setPitch(Math.round(Math.max(0, Math.min(90, e.beta))));
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, [isManualDrag]);

  // 3. Render Procedural Night Sky Backdrop if camera is offline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const renderSky = () => {
      ctx.fillStyle = '#05070f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw starfield
      const time = Date.now() * 0.001;
      for (let i = 0; i < 150; i++) {
        const sx = ((i * 137.5 + heading * 4) % canvas.width);
        const sy = ((i * 83.1 + pitch * 3) % canvas.height);
        const size = (i % 3) + 1;
        const alpha = 0.3 + 0.7 * Math.sin(time + i);

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Constellation Lines (Cygnus Cross)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      const cx = (canvas.width / 2) + (45 - heading) * 8;
      const cy = (canvas.height / 2) - (50 - pitch) * 8;

      ctx.beginPath();
      ctx.moveTo(cx - 60, cy);
      ctx.lineTo(cx + 60, cy);
      ctx.moveTo(cx, cy - 80);
      ctx.lineTo(cx, cy + 80);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '10px "DM Mono", monospace';
      ctx.fillText('CONSTELLATION: CYGNUS', cx - 50, cy - 90);

      animId = requestAnimationFrame(renderSky);
    };

    renderSky();
    return () => cancelAnimationFrame(animId);
  }, [heading, pitch]);

  // 4. Calculate Distance & Lock Target
  useEffect(() => {
    let closest = null;
    let minDelta = 25; // sector tolerance angle

    SKY_TARGETS.forEach((target) => {
      const dHeading = Math.abs(((heading - target.targetHeading + 540) % 360) - 180);
      const dPitch = Math.abs(pitch - target.targetPitch);
      const totalDelta = Math.hypot(dHeading, dPitch);

      if (totalDelta < minDelta) {
        minDelta = totalDelta;
        closest = target;
      }
    });

    setLockedPlanet(closest);
  }, [heading, pitch]);

  // Mouse Drag / Touch Simulation Handler for Desktop Heading Controls
  const handleMouseDown = (e) => {
    setIsManualDrag(true);
    dragStartRef.current = { x: e.clientX, heading };
  };

  const handleMouseMove = (e) => {
    if (!isManualDrag) return;
    const dx = e.clientX - dragStartRef.current.x;
    let newHeading = (dragStartRef.current.heading - dx * 0.4) % 360;
    if (newHeading < 0) newHeading += 360;
    setHeading(Math.round(newHeading));
  };

  const handleMouseUp = () => {
    setIsManualDrag(false);
  };

  return (
    <div
      className="sky-scanner-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Background Video Stream (or Procedural Sky Canvas) */}
      <div className="video-viewport">
        <video ref={videoRef} autoPlay playsInline muted className={`camera-video ${cameraActive ? 'active' : ''}`} />
        <canvas ref={canvasRef} width={800} height={500} className="sky-canvas" />
        <div className="scanner-vignette" />
      </div>

      {/* AR HUD Overlay */}
      <div className="ar-hud-overlay">
        {/* Top Telemetry Header */}
        <div className="hud-top-bar">
          <div className="hud-status">
            <span className={`pulse-dot ${cameraActive ? 'online' : 'sim'}`} />
            <span>{cameraActive ? 'LIVE CAMERA SENSOR ACTIVE' : 'AR NIGHT SKY SIMULATOR'}</span>
          </div>

          <div className="hud-coordinates">
            <span>RA: 19h 44m | DEC: +45° 12′</span>
            <span>ALT: {pitch}° | AZ: {heading}°</span>
          </div>
        </div>

        {/* Center Crosshair Target Overlay */}
        <div className="hud-crosshair">
          <div className="reticle-ring" />
          <div className="reticle-lines" />

          {lockedPlanet ? (
            <div className="target-lock-box">
              <div className="lock-label">TARGET LOCKED</div>
              <div className="target-title">{lockedPlanet.name}</div>
              <div className="target-dist">{lockedPlanet.distanceLy} LIGHT-YEARS AWAY ({lockedPlanet.distancePc} pc)</div>
              <div className="target-sub">{lockedPlanet.constellation} Sector &bull; {lockedPlanet.type}</div>

              <button
                className="button view-target-btn"
                onClick={() => {
                  setSelectedCandidateId(lockedPlanet.id.toLowerCase());
                  setActiveTab('candidates');
                  window.location.hash = '#candidates';
                }}
              >
                Inspect Telemetry →
              </button>
            </div>
          ) : (
            <div className="target-scanning-box">
              <div className="scan-text">SCANNING CELESTIAL SECTOR...</div>
              <div className="hint-text">Drag screen or rotate device to point compass to exoplanets (0° - 360°)</div>
            </div>
          )}
        </div>

        {/* Bottom HUD: Live Interactive Compass Rose */}
        <div className="hud-bottom-bar">
          <div className="compass-widget">
            <div className="compass-header">
              <span>COMPASS HEADING</span>
              <b>{heading}° {getHeadingCardinal(heading)}</b>
            </div>

            <div className="compass-dial-container">
              <div
                className="compass-rose-tape"
                style={{ transform: `translateX(calc(50% - ${heading * 4}px))` }}
              >
                {Array.from({ length: 360 / 15 }, (_, i) => {
                  const deg = i * 15;
                  const label = getCardinalLabel(deg);
                  return (
                    <div key={deg} className={`compass-tick ${label ? 'cardinal' : ''}`}>
                      <span>{label || deg}</span>
                      <i />
                    </div>
                  );
                })}
              </div>
              <div className="compass-center-indicator" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getHeadingCardinal(deg) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(deg / 45) % 8];
}

function getCardinalLabel(deg) {
  if (deg === 0 || deg === 360) return 'N';
  if (deg === 90) return 'E';
  if (deg === 180) return 'S';
  if (deg === 270) return 'W';
  return null;
}

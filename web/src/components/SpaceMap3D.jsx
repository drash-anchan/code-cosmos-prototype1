import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getTranslation } from '../lib/translations';

gsap.registerPlugin(ScrollTrigger);

export function SpaceMap3D({ candidates, selectedCandidateId, setSelectedCandidateId, setActiveTab, lang }) {
  const t = (key) => getTranslation(lang, key);
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState({ rx: 0.45, ry: 0.3 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragMoved, setDragMoved] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.9);
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewMode, setViewMode] = useState('galaxy'); // 'galaxy' | 'solar'

  // Store projected 2D screen positions for click hit-testing
  const screenCoordsRef = useRef([]);

  // Generate 220 3D Background Stars
  const backgroundStars = useRef(
    Array.from({ length: 220 }, () => ({
      x: (Math.random() - 0.5) * 1200,
      y: (Math.random() - 0.5) * 600,
      z: (Math.random() - 0.5) * 1200,
      size: Math.random() * 1.6 + 0.4,
      alpha: Math.random() * 0.7 + 0.3,
      twinkle: Math.random() * Math.PI * 2
    }))
  ).current;

  // Generate Milky Way Spiral Arm Particle Cloud (500 particles)
  const galaxyParticles = useRef(
    Array.from({ length: 550 }, (_, i) => {
      const arm = i % 4;
      const armAngle = (arm * Math.PI) / 2;
      const dist = 30 + Math.pow(Math.random(), 0.7) * 340;
      const angle = armAngle + dist * 0.012 + (Math.random() - 0.5) * 0.35;
      return {
        x: Math.cos(angle) * dist,
        y: (Math.random() - 0.5) * (30 + (340 - dist) * 0.08),
        z: Math.sin(angle) * dist,
        size: Math.random() * 1.5 + 0.3,
        alpha: Math.max(0.1, 0.85 - dist / 400)
      };
    })
  ).current;

  // Generate 3D spatial positions for exoplanet host candidates
  const spatialTargets = useRef(
    candidates.map((c, idx) => {
      const armOffset = (idx % 4) * (Math.PI / 2);
      const dist = 110 + (idx * 28) % 220;
      const angle = armOffset + dist * 0.01 + (idx * 0.4);
      const height = Math.sin(idx * 1.7) * 45;
      const lightYears = 4.2 + (idx + 1) * 38.5;
      return {
        ...c,
        lightYears: lightYears.toFixed(1),
        x3d: Math.cos(angle) * dist,
        y3d: height,
        z3d: Math.sin(angle) * dist,
        planets3d: Array.from({ length: c.nPlanets || 1 }, (_, pIdx) => ({
          dist: 16 + pIdx * 12,
          speed: 0.025 + pIdx * 0.01,
          size: Math.max(2.5, c.radiusEarth * 1.1),
          color: pIdx === 0 ? '#ffffff' : '#b0b0b0'
        }))
      };
    })
  ).current;

  // Solar System (Sol) static position
  const solSystem = useRef({
    name: 'Solar System (Sol)',
    id: 'sol-system',
    x3d: -75,
    y3d: 8,
    z3d: -45,
    planets: [
      { name: 'Earth', dist: 14, speed: 0.04, size: 3, color: '#ffffff' },
      { name: 'Jupiter', dist: 26, speed: 0.02, size: 5, color: '#cccccc' },
      { name: 'Saturn', dist: 38, speed: 0.012, size: 4.5, color: '#aaaaaa', hasRing: true }
    ]
  }).current;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const render = () => {
      time += 0.015;
      const width = (canvas.width = canvas.parentElement.clientWidth);
      const height = (canvas.height = 520);

      const currentRy = autoRotate ? rotation.ry + 0.0025 : rotation.ry;
      if (autoRotate) {
        setRotation((prev) => ({ ...prev, ry: prev.ry + 0.0025 }));
      }

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      const cosY = Math.cos(currentRy);
      const sinY = Math.sin(currentRy);
      const cosX = Math.cos(rotation.rx);
      const sinX = Math.sin(rotation.rx);
      const fov = 420;

      // 3D Projection helper
      const project3D = (x, y, z) => {
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        const y1 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        const scale = fov / (fov + z2 + 350);
        return {
          px: cx + x1 * zoom * scale,
          py: cy + y1 * zoom * scale,
          scale,
          z2
        };
      };

      // 1. Render Background Stars Parallax
      backgroundStars.forEach((star) => {
        const proj = project3D(star.x, star.y, star.z);
        if (proj.scale > 0) {
          const alpha = star.alpha * (0.6 + Math.sin(time * 3 + star.twinkle) * 0.4);
          ctx.beginPath();
          ctx.arc(proj.px, proj.py, Math.max(0.5, star.size * proj.scale), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
          ctx.fill();
        }
      });

      // 2. Render Milky Way Concentric Plane Rings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let r = 80; r <= 380; r += 75) {
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.06) {
          const px = Math.cos(a) * r;
          const pz = Math.sin(a) * r;
          const proj = project3D(px, 0, pz);
          if (a === 0) ctx.moveTo(proj.px, proj.py);
          else ctx.lineTo(proj.px, proj.py);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // 3. Render Milky Way Spiral Arm Particle Cloud
      galaxyParticles.forEach((p) => {
        const proj = project3D(p.x, p.y, p.z);
        if (proj.scale > 0) {
          ctx.beginPath();
          ctx.arc(proj.px, proj.py, Math.max(0.4, p.size * proj.scale), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${(p.alpha * proj.scale * 0.7).toFixed(2)})`;
          ctx.fill();
        }
      });

      // 4. Render Bright Galactic Core (Supermassive Black Hole & Stellar Haze)
      const coreProj = project3D(0, 0, 0);
      ctx.save();
      const coreGlow = ctx.createRadialGradient(
        coreProj.px,
        coreProj.py,
        2 * coreProj.scale,
        coreProj.px,
        coreProj.py,
        45 * coreProj.scale * zoom
      );
      coreGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      coreGlow.addColorStop(0.3, 'rgba(200, 200, 200, 0.4)');
      coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(coreProj.px, coreProj.py, 45 * coreProj.scale * zoom, 0, Math.PI * 2);
      ctx.fillStyle = coreGlow;
      ctx.fill();

      ctx.font = `${Math.max(9, Math.round(11 * coreProj.scale))}px 'DM Mono', monospace`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('MILKY WAY CORE', coreProj.px + 10, coreProj.py - 10);
      ctx.restore();

      // 5. Render Solar System (Sol)
      const solProj = project3D(solSystem.x3d, solSystem.y3d, solSystem.z3d);

      // Sol Orbiting Planets
      solSystem.planets.forEach((p) => {
        const pAngle = time * p.speed * 20;
        const pxOrbit = solProj.px + Math.cos(pAngle) * p.dist * solProj.scale * zoom;
        const pyOrbit = solProj.py + Math.sin(pAngle) * (p.dist * 0.4) * solProj.scale * zoom;

        ctx.beginPath();
        ctx.arc(pxOrbit, pyOrbit, Math.max(1.5, p.size * solProj.scale * 0.7), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        if (p.hasRing) {
          ctx.beginPath();
          ctx.ellipse(
            pxOrbit,
            pyOrbit,
            p.size * 1.8 * solProj.scale,
            p.size * 0.6 * solProj.scale,
            -0.3,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // Sol Central Sun Node
      ctx.beginPath();
      ctx.arc(solProj.px, solProj.py, Math.max(6, 8 * solProj.scale), 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffffff';
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = `bold ${Math.max(10, Math.round(12 * solProj.scale))}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText('★ Solar System (Sol)', solProj.px + 12, solProj.py + 4);

      // 6. Render 3D Exoplanet Candidates & collect screen positions
      const newScreenCoords = [];

      spatialTargets.forEach((target) => {
        const proj = project3D(target.x3d, target.y3d, target.z3d);
        newScreenCoords.push({ id: target.id, px: proj.px, py: proj.py, radius: 26 * proj.scale });

        const isSelected = target.id === selectedCandidateId;

        // Line down to Galactic Plane
        const planeProj = project3D(target.x3d, 0, target.z3d);
        ctx.beginPath();
        ctx.moveTo(proj.px, proj.py);
        ctx.lineTo(planeProj.px, planeProj.py);
        ctx.strokeStyle = isSelected ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbiting Candidate Planets
        target.planets3d.forEach((p) => {
          const pAngle = time * p.speed * 20;
          const pxOrbit = proj.px + Math.cos(pAngle) * p.dist * proj.scale * zoom;
          const pyOrbit = proj.py + Math.sin(pAngle) * (p.dist * 0.4) * proj.scale * zoom;

          ctx.beginPath();
          ctx.arc(pxOrbit, pyOrbit, Math.max(2, p.size * proj.scale * 0.6), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        });

        // Target Star Node
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, Math.max(6, 9 * proj.scale), 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#ffffff' : '#cccccc';
        if (isSelected) {
          ctx.shadowBlur = 18;
          ctx.shadowColor = '#ffffff';
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.font = `${Math.max(10, Math.round(12 * proj.scale))}px 'DM Mono', monospace`;
        ctx.fillStyle = isSelected ? '#ffffff' : '#aaaaaa';
        ctx.fillText(`${target.name} (${target.lightYears} ly)`, proj.px + 12, proj.py + 4);

        // Selection Pulse Ring
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(proj.px, proj.py, 15 * proj.scale + Math.sin(time * 4) * 3, 0, Math.PI * 2);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      screenCoordsRef.current = newScreenCoords;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [rotation, zoom, autoRotate, selectedCandidateId, spatialTargets, backgroundStars, galaxyParticles]);

  const mapWrapperRef = useRef(null);

  useEffect(() => {
    if (mapWrapperRef.current) {
      gsap.fromTo(
        mapWrapperRef.current,
        { opacity: 0, scale: 0.95, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: mapWrapperRef.current,
            start: 'top 85%'
          }
        }
      );
    }
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragMoved(false);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      setDragMoved(true);
    }
    setRotation((prev) => ({
      rx: Math.max(-Math.PI / 3, Math.min(Math.PI / 3, prev.rx + dy * 0.005)),
      ry: prev.ry + dx * 0.005
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCanvasClick = (e) => {
    if (dragMoved) return; // ignore click if user was dragging rotation

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let clickedTargetId = null;
    let minDistance = 35;

    screenCoordsRef.current.forEach((item) => {
      const dist = Math.hypot(mouseX - item.px, mouseY - item.py);
      if (dist < minDistance) {
        minDistance = dist;
        clickedTargetId = item.id;
      }
    });

    if (clickedTargetId) {
      setSelectedCandidateId(clickedTargetId);
      if (setActiveTab) {
        setActiveTab('candidates');
        window.location.hash = '#candidates';
      }
    }
  };

  const selectAndRedirect = (targetId) => {
    setSelectedCandidateId(targetId);
    if (setActiveTab) {
      setActiveTab('candidates');
      window.location.hash = '#candidates';
    }
  };

  return (
    <div className="space-map-3d-wrapper" ref={mapWrapperRef}>
      <div className="map-3d-header">
        <div>
          <div className="eyebrow">MILKY WAY & SOLAR NEIGHBORHOOD CARTOGRAPHY</div>
          <h2>3D Galactic & Solar System Space Map</h2>
          <p>Interactive 3D projection of the Milky Way, Solar System (Sol), and exoplanet host stars. Click any exoplanet node to open catalog details.</p>
        </div>
        <div className="map-controls">
          <button
            className={`map-btn ${viewMode === 'galaxy' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('galaxy');
              setZoom(0.9);
            }}
          >
            {t('milky_way_view')}
          </button>
          <button
            className={`map-btn ${viewMode === 'solar' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('solar');
              setZoom(1.5);
            }}
          >
            {t('solar_system_view')}
          </button>
          <button
            className={`map-btn ${autoRotate ? 'active' : ''}`}
            onClick={() => setAutoRotate(!autoRotate)}
          >
            {autoRotate ? 'Pause ⏸' : 'Rotate ⟳'}
          </button>
          <button className="map-btn" onClick={() => setZoom((z) => Math.min(2.2, z + 0.2))}>
            +
          </button>
          <button className="map-btn" onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}>
            -
          </button>
        </div>
      </div>

      <div
        className="canvas-container-3d"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
      >
        <canvas ref={canvasRef} />
        <div className="map-hint-overlay">
          <span>Click any star node to open Candidate Catalog · Drag mouse to rotate 3D view</span>
        </div>
      </div>

      {/* Target Selector Bar */}
      <div className="target-selector-bar">
        {spatialTargets.map((target) => (
          <button
            key={target.id}
            className={`target-btn ${selectedCandidateId === target.id ? 'selected' : ''}`}
            onClick={() => selectAndRedirect(target.id)}
          >
            <span className="dot" />
            <strong>{target.name}</strong>
            <small>{target.lightYears} ly · {target.categoryLabel}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

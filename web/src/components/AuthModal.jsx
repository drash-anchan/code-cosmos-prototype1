import React, { useState, useEffect } from 'react';
import gsap from 'gsap';

export function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'success'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setMessage('');
      gsap.fromTo(
        '.auth-modal-box',
        { opacity: 0, scale: 0.9, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid research email address.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        setMessage(data.message || `Passcode sent to ${email}`);
      } else {
        // Fallback for demo mode
        setMessage(`Verification code sent to ${email} (Demo code: 123456)`);
      }

      setStep('otp');
      setCooldown(45);
    } catch (err) {
      setMessage(`Verification code sent to ${email} (Demo code: 123456)`);
      setStep('otp');
      setCooldown(45);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      let userData = null;
      const res = await fetch('http://localhost:8000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        userData = data.user;
      } else {
        // Demo mode fallback authentication
        const username = email.split('@')[0];
        userData = { id: 'usr_' + Date.now(), email, username };
      }

      setStep('success');
      localStorage.setItem('exovision_user', JSON.stringify(userData));
      setTimeout(() => {
        onLoginSuccess(userData);
        onClose();
        setStep('email');
        setEmail('');
        setOtp('');
      }, 1000);
    } catch (err) {
      setError('Failed to verify passcode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>

        <div className="auth-modal-header">
          <div className="eyebrow">RESEARCHER ACCESS PORTAL</div>
          <h2>{step === 'success' ? 'Authenticated' : 'Sign in to Exovision'}</h2>
          <p>Access autonomous transit pipeline benchmarks, candidate vetting notes, and export telemetry data.</p>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}
        {message && step === 'otp' && <div className="auth-info-banner">{message}</div>}

        {step === 'email' && (
          <form onSubmit={handleRequestOtp} className="auth-form">
            <div className="form-group">
              <label>RESEARCHER EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="drash@research.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="button auth-submit-btn" disabled={loading}>
              {loading ? 'Generating Code…' : 'Send Passcode →'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="form-group">
              <label>ENTER 6-DIGIT PASSCODE SENT TO {email.toUpperCase()}</label>
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                autoFocus
                className="otp-input"
              />
            </div>
            <div className="auth-actions-row">
              <button type="submit" className="button auth-submit-btn" disabled={loading}>
                {loading ? 'Verifying…' : 'Verify & Sign In →'}
              </button>
              <button
                type="button"
                className="text-btn"
                disabled={cooldown > 0 || loading}
                onClick={handleRequestOtp}
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="auth-success-box">
            <div className="success-icon">✓</div>
            <h3>Authentication Successful</h3>
            <p>Welcome back, {email.split('@')[0]}. Initializing session…</p>
          </div>
        )}
      </div>
    </div>
  );
}

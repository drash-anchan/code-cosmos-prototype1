import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Exovision Error Boundary captured an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '#dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0a0a0a',
          color: '#ffffff',
          fontFamily: "'Space Grotesk', sans-serif",
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            background: '#1a1a1a',
            border: '1px solid #444444',
            borderRadius: '12px',
            padding: '36px',
            maxWidth: '640px',
            width: '100%',
            boxShadow: '0 12px 32px rgba(0,0,0,0.8)'
          }}>
            <div style={{
              display: 'inline-block',
              padding: '6px 14px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              borderRadius: '20px',
              fontSize: '12px',
              fontFamily: "'DM Mono', monospace",
              marginBottom: '18px'
            }}>
              RENDER SAFETY RECOVERY
            </div>
            <h2 style={{ fontSize: '28px', margin: '0 0 12px 0', letterSpacing: '-0.03em' }}>
              Interface state recovered
            </h2>
            <p style={{ color: '#aaaaaa', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px 0' }}>
              An unexpected render issue occurred on this view. The boundary caught the exception to prevent a blank screen.
            </p>
            {this.state.error && (
              <pre style={{
                background: '#121212',
                padding: '14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: "'DM Mono', monospace",
                color: '#ffffff',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '24px',
                border: '1px solid #333333'
              }}>
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              style={{
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 700,
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif"
              }}
            >
              Return to Dashboard →
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

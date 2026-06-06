import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FAF6F0',
          fontFamily: 'Inter, sans-serif',
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            border: '1px solid #ddc0ba',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '700px',
            width: '100%',
            boxShadow: '0 8px 32px rgba(111,26,7,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>⚠️</span>
              <div>
                <h1 style={{ color: '#4c0900', fontWeight: 900, fontSize: '1.25rem', margin: 0 }}>
                  Errore di Rendering
                </h1>
                <p style={{ color: '#57423d', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                  Si è verificato un errore JavaScript durante il caricamento dello Schermo Spettatori.
                </p>
              </div>
            </div>
            <div style={{
              background: '#fff5f5',
              border: '1px solid #fda4a0',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <strong style={{ color: '#ba1a1a', fontSize: '0.875rem' }}>
                {this.state.error && this.state.error.toString()}
              </strong>
            </div>
            {this.state.errorInfo && (
              <details style={{ marginTop: '1rem' }}>
                <summary style={{ cursor: 'pointer', color: '#57423d', fontSize: '0.75rem', fontWeight: 700 }}>
                  Dettagli tecnici (stack trace)
                </summary>
                <pre style={{
                  background: '#f8f4e4',
                  border: '1px solid #ddc0ba',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  fontSize: '0.7rem',
                  overflowX: 'auto',
                  marginTop: '0.5rem',
                  color: '#1d1c12'
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1.5rem',
                background: '#4c0900',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.625rem 1.5rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              🔄 Ricarica la pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

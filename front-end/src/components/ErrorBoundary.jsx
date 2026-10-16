import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            backgroundColor: '#f8fafc',
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '36px',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                margin: '0 auto 18px',
              }}
            >
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
              Đã Xảy Ra Lỗi Hiển Thị
            </h2>

            <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '22px' }}>
              Hệ thống đã ghi nhận lỗi và bảo vệ giao diện không bị gián đoạn. Bạn có thể thử tải lại hoặc quay về trang chủ.
            </p>

            {this.state.error?.message && (
              <div
                style={{
                  backgroundColor: '#f1f5f9',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  color: '#475569',
                  textAlign: 'left',
                  marginBottom: '24px',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.hash = '#/';
                  window.location.reload();
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                <i className="fa-solid fa-rotate-right" style={{ marginRight: '6px' }}></i>
                Tải lại trang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

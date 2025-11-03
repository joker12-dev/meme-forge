import React from 'react';

/**
 * ErrorAlert Component
 * Displays user-friendly error messages with retry functionality
 */
const ErrorAlert = ({ 
  error, 
  onRetry, 
  onDismiss,
  type = 'error' // 'error', 'warning', 'info'
}) => {
  if (!error) return null;

  const bgColor = {
    error: '#ff4d4f',
    warning: '#faad14',
    info: '#1890ff'
  }[type];

  const borderColor = {
    error: '#ff7875',
    warning: '#ffc53d',
    info: '#69c0ff'
  }[type];

  return (
    <div
      style={{
        background: bgColor,
        color: '#fff',
        border: `2px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '1rem 1.2rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        animation: 'slideDown 0.3s ease-out'
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.3rem' }}>
          {type === 'error' ? '❌ Hata' : type === 'warning' ? '⚠️ Uyarı' : 'ℹ️ Bilgi'}
        </div>
        <div style={{ fontSize: '0.9rem', opacity: 0.95 }}>
          {error}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', whiteSpace: 'nowrap' }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '4px',
              padding: '0.4rem 0.8rem',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
              outline: 'none'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            }}
          >
            🔄 Tekrar Dene
          </button>
        )}
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '4px',
              padding: '0.4rem 0.8rem',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
              outline: 'none'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            }}
          >
            ✕ Kapat
          </button>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ErrorAlert;


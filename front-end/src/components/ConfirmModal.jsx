import React from 'react';

export default function ConfirmModal({
  isOpen,
  title = 'Xác nhận hành động',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này không?',
  confirmText = 'Xác nhận xóa',
  cancelText = 'Hủy bỏ',
  type = 'danger', // 'danger' | 'warning' | 'primary'
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: isDanger ? '#fee2e2' : '#fef3c7',
              color: isDanger ? '#dc2626' : '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              flexShrink: 0,
            }}
          >
            <i className={`fa-solid ${isDanger ? 'fa-trash-can' : 'fa-triangle-exclamation'}`}></i>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
              {title}
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '6px 0 0', lineHeight: 1.5 }}>
              {message}
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div
          style={{
            padding: '14px 24px 20px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              backgroundColor: 'white',
              border: '1px solid #cbd5e1',
              color: '#475569',
              fontSize: '0.88rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              backgroundColor: isDanger ? '#dc2626' : '#0284c7',
              border: 'none',
              color: 'white',
              fontSize: '0.88rem',
              fontWeight: '700',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isDanger ? '0 2px 8px rgba(220, 38, 38, 0.3)' : '0 2px 8px rgba(2, 132, 199, 0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            {isLoading && <i className="fa-solid fa-circle-notch fa-spin"></i>}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

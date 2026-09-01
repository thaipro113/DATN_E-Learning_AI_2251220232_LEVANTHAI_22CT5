import React from 'react';

export default function CertificateModal({ isOpen, onClose, user, courseTitle }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 120,
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '720px',
          width: '100%',
          padding: '36px',
          boxShadow: 'var(--shadow-lg)',
          border: '8px solid #fef3c7',
          position: 'relative',
          textAlign: 'center',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '1.2rem', color: '#94a3b8' }}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Certificate Border & Header */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
            }}
          >
            <i className="fa-solid fa-award"></i>
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', fontWeight: '800', letterSpacing: '2px', color: '#d97706', textTransform: 'uppercase' }}>
          E-LEARNING AI PLATFORM
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', margin: '6px 0 16px 0', fontFamily: 'serif' }}>
          CHỨNG CHỈ HOÀN THÀNH KHÓA HỌC
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic' }}>
          Chứng nhận danh dự được cấp cho:
        </p>

        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0284c7', margin: '12px 0', borderBottom: '2px solid #e2e8f0', display: 'inline-block', paddingBottom: '4px' }}>
          {user?.full_name || 'Lê Văn Thái'}
        </div>

        <p style={{ fontSize: '0.95rem', color: '#334155', maxWidth: '520px', margin: '0 auto 20px auto', lineHeight: 1.6 }}>
          Đã xuất sắc hoàn thành 100% chương trình học và vượt qua các bài kiểm tra đánh giá năng lực của khóa học:
          <strong style={{ display: 'block', color: '#0f172a', marginTop: '6px', fontSize: '1.05rem' }}>
            "{courseTitle || 'Ngữ Pháp & Giao Tiếp Tiếng Anh Toàn Diện (CEFR B1-B2)'}"
          </strong>
        </p>

        {/* Certificate Details Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '20px', fontSize: '0.8rem', color: '#64748b' }}>
          <div>
            <span style={{ display: 'block', fontWeight: '700', color: '#0f172a' }}>MÃ XÁC THỰC</span>
            <span>EL-AI-2026-8914B6F5</span>
          </div>
          <div>
            <span style={{ display: 'block', fontWeight: '700', color: '#0f172a' }}>NGÀY CẤP</span>
            <span>31/08/2026</span>
          </div>
          <div>
            <span style={{ display: 'block', fontWeight: '700', color: '#0f172a' }}>CHỮ KÝ ĐIỆN TỬ</span>
            <span style={{ color: '#059669', fontWeight: '700' }}>✓ Verified by E-Learning AI</span>
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            className="btn-primary"
            onClick={() => window.print()}
            style={{ padding: '8px 20px' }}
          >
            <i className="fa-solid fa-print"></i>
            <span>In / Lưu PDF</span>
          </button>
          <button className="btn-outline" onClick={onClose} style={{ padding: '8px 20px' }}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

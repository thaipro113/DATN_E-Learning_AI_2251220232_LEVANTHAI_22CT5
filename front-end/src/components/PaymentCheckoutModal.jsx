import React, { useState } from 'react';

export default function PaymentCheckoutModal({ isOpen, onClose, course, onPaymentSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('QR_MOMO');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !course) return null;

  const priceNum = Number(course.price || 299000);
  const formattedPrice = priceNum.toLocaleString('vi-VN') + ' đ';

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (onPaymentSuccess) {
        onPaymentSuccess(course);
      }
      onClose();
    }, 900);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 130,
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
              <i className="fa-solid fa-credit-card"></i>
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                Thanh Toán Khóa Học Chuyên Sâu
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cổng thanh toán bảo mật E-Learning AI</span>
            </div>
          </div>
          <button onClick={onClose} style={{ fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Course Summary Card */}
        <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '56px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#0284c7', flexShrink: 0 }}>
            {course.thumbnail_url ? (
              <img src={course.thumbnail_url} alt="Thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase' }}>
              CEFR {course.level || 'B2'}
            </span>
            <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {course.title}
            </strong>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#ea580c' }}>
              {formattedPrice}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: '800', display: 'block', marginBottom: '8px', color: 'var(--text-main)' }}>
            Phương thức thanh toán:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { id: 'QR_MOMO', label: 'Quét mã QR (MoMo / ZaloPay / VietQR)', icon: 'fa-qrcode', color: '#ec4899' },
              { id: 'BANK_TRANSFER', label: 'Chuyển khoản Ngân hàng (Internet Banking)', icon: 'fa-building-columns', color: '#0284c7' },
              { id: 'ATM_CARD', label: 'Thẻ ATM Nội địa / Visa / Mastercard', icon: 'fa-credit-card', color: '#059669' },
            ].map((pm) => (
              <div
                key={pm.id}
                onClick={() => setPaymentMethod(pm.id)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '2px solid',
                  borderColor: paymentMethod === pm.id ? '#0284c7' : 'var(--border-color)',
                  backgroundColor: paymentMethod === pm.id ? '#e0f2fe' : 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className={`fa-solid ${pm.icon}`} style={{ color: pm.color, fontSize: '1.1rem' }}></i>
                  <span style={{ fontSize: '0.85rem', fontWeight: paymentMethod === pm.id ? '800' : '600', color: 'var(--text-main)' }}>
                    {pm.label}
                  </span>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === pm.id}
                  onChange={() => setPaymentMethod(pm.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* QR Code Demo for VietQR / MoMo */}
        {paymentMethod === 'QR_MOMO' && (
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            <div style={{ width: '120px', height: '120px', margin: '0 auto 8px', backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-qrcode" style={{ fontSize: '5rem', color: '#0f172a' }}></i>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử
            </span>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button type="button" className="btn-outline" onClick={onClose} disabled={isProcessing}>
            Hủy bỏ
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleConfirmPayment}
            disabled={isProcessing}
            style={{ backgroundColor: '#059669', padding: '10px 22px' }}
          >
            {isProcessing ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Đang kích hoạt khóa học...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-circle-check"></i>
                <span>Xác nhận Thanh toán ({formattedPrice})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

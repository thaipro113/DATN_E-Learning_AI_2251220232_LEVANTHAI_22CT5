import React, { useState } from 'react';

/**
 * PaymentCheckoutModal - Cổng Thanh Toán Khóa Học Chuẩn VietQR Động (Napas 247)
 * Tự động sinh mã VietQR theo số tiền và nội dung học phí ngắn gọn, thực tế.
 * Hỗ trợ chế độ Demo Sandbox chuẩn mực cho Đồ án tốt nghiệp.
 */
export default function PaymentCheckoutModal({ isOpen, onClose, course, user, onPaymentSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('QR_VIETQR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [qrError, setQrError] = useState(false);

  // Cấu hình tài khoản nhận thanh toán chuẩn VietQR
  const BANK_CONFIG = {
    bankId: 'MB', // MBBank - Ngân hàng Quân Đội
    bankName: 'MB Bank (Ngân hàng TMCP Quân Đội)',
    accountNo: '0898165109',
    accountName: 'LE VAN THAI',
  };

  if (!isOpen || !course) return null;

  const priceNum = Math.max(0, Number(course.price || 299000));
  const formattedPrice = priceNum.toLocaleString('vi-VN') + ' đ';

  // Trích xuất tên học viên không dấu ngắn gọn (ví dụ: 'Lê Văn Thái' -> 'THAI')
  const getShortStudentName = (name) => {
    if (!name) return '';
    const clean = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim();
    const parts = clean.split(/\s+/);
    return parts[parts.length - 1].toUpperCase();
  };

  const studentName = getShortStudentName(user?.full_name || user?.username);
  
  // Xác định mã trình độ hoặc mã khóa học ngắn gọn
  let courseCode = 'TIENGANH';
  if (course.level) {
    courseCode = course.level.toUpperCase(); // ví dụ: 'B2', 'A2', 'C1'
  } else if (course.title && course.title.toUpperCase().includes('TOEIC')) {
    courseCode = 'TOEIC';
  } else if (course.title && course.title.toUpperCase().includes('IELTS')) {
    courseCode = 'IELTS';
  } else {
    courseCode = `KH${course.id || 1}`;
  }

  // Nội dung chuyển khoản chuẩn thực tế: HOCPHI [KHOA] [TEN] (ví dụ: 'HOCPHI B2 THAI')
  // Ngắn gọn, dễ đọc, không mã random dài, đúng ngữ cảnh đóng học phí
  const transferContent = studentName
    ? `HOCPHI ${courseCode} ${studentName}`
    : `HOCPHI ${courseCode}`;

  // Link sinh mã VietQR động chuẩn Napas 247 (compact2: có logo ngân hàng MB và Napas)
  const vietQrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-compact2.png?amount=${priceNum}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

  // Sao chép thông tin vào Clipboard
  const handleCopy = (text, fieldName) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Xác nhận thanh toán (Mô phỏng kích hoạt khóa học trong Sandbox)
  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (onPaymentSuccess) {
        onPaymentSuccess(course);
      }
      onClose();
    }, 1000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 140,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface, #ffffff)',
          borderRadius: '16px',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                border: '1px solid #a7f3d0',
              }}
            >
              <i className="fa-solid fa-qrcode"></i>
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main, #0f172a)', margin: 0 }}>
                Thanh Toán Khóa Học
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                Cổng thanh toán tự động VietQR • Napas 247
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              fontSize: '1.1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Sandbox Badge */}
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.78rem',
            color: '#1e40af',
          }}
        >
          <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#3b82f6', color: 'white', fontWeight: '800', fontSize: '0.68rem' }}>
            SANDBOX DEMO
          </span>
          <span>Môi trường thử nghiệm ĐATN: Quét mã QR thật hoặc nhấn nút kích hoạt tức thì.</span>
        </div>

        {/* Course Summary Card */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '76px',
              height: '52px',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#0284c7',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {course.thumbnail_url ? (
              <img src={course.thumbnail_url} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <i className="fa-solid fa-graduation-cap" style={{ color: 'white', fontSize: '1.2rem' }}></i>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase' }}>
              CEFR {course.level || 'B2'}
            </span>
            <strong
              style={{
                display: 'block',
                fontSize: '0.88rem',
                color: '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {course.title}
            </strong>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#ea580c' }}>
                {formattedPrice}
              </span>
              {course.original_price && Number(course.original_price) > priceNum && (
                <>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                    {Number(course.original_price).toLocaleString('vi-VN')} đ
                  </span>
                  <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#dc2626', backgroundColor: '#fee2e2', padding: '1px 5px', borderRadius: '4px' }}>
                    -{Math.round(((course.original_price - priceNum) / course.original_price) * 100)}%
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Phương thức thanh toán selector (Chỉ gồm 2 phương thức: VietQR & Chuyển khoản thủ công) */}
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: '800', display: 'block', marginBottom: '8px', color: '#334155' }}>
            Phương thức thanh toán:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { id: 'QR_VIETQR', label: 'Quét mã VietQR', sub: 'Tự động điền số tiền & nội dung', icon: 'fa-qrcode', color: '#059669' },
              { id: 'BANK_TRANSFER', label: 'Chuyển khoản thủ công', sub: 'Xem số tài khoản & nội dung', icon: 'fa-building-columns', color: '#0284c7' },
            ].map((pm) => {
              const active = paymentMethod === pm.id;
              return (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '10px',
                    border: '2px solid',
                    borderColor: active ? '#059669' : '#e2e8f0',
                    backgroundColor: active ? '#ecfdf5' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <i className={`fa-solid ${pm.icon}`} style={{ color: pm.color, fontSize: '1.2rem' }}></i>
                  <span style={{ fontSize: '0.85rem', fontWeight: active ? '800' : '600', color: '#0f172a' }}>
                    {pm.label}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', textAlign: 'center' }}>{pm.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 1. VIEW QUÉT MÃ VIETQR ĐỘNG */}
        {paymentMethod === 'QR_VIETQR' && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {/* Khung ảnh QR */}
            <div
              style={{
                position: 'relative',
                width: '210px',
                height: '210px',
                backgroundColor: '#ffffff',
                padding: '8px',
                borderRadius: '12px',
                border: '2px solid #cbd5e1',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!qrError ? (
                <img
                  src={vietQrUrl}
                  alt="VietQR Payment Code"
                  onLoad={() => setQrLoaded(true)}
                  onError={() => setQrError(true)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: qrLoaded ? 'block' : 'none',
                  }}
                />
              ) : null}

              {/* Skeleton loading hoặc icon fallback nếu mạng offline */}
              {(!qrLoaded || qrError) && (
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                  <i className="fa-solid fa-qrcode fa-spin" style={{ fontSize: '3rem', color: '#059669', marginBottom: '8px' }}></i>
                  <div style={{ fontSize: '0.72rem' }}>{qrError ? 'Mã QR Demo Offline' : 'Đang tạo mã VietQR...'}</div>
                </div>
              )}
            </div>

            <div style={{ fontSize: '0.76rem', color: '#475569', textAlign: 'center' }}>
              <i className="fa-solid fa-camera" style={{ color: '#059669', marginRight: '4px' }}></i>
              Mở App Ngân hàng hoặc MoMo / ZaloPay quét mã QR để thanh toán nhanh 24/7.
            </div>

            {/* Bảng chi tiết thông tin chuyển khoản kèm nút Sao chép */}
            <div
              style={{
                width: '100%',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Ngân hàng:</span>
                <strong style={{ color: '#0f172a' }}>{BANK_CONFIG.bankName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Chủ tài khoản:</span>
                <strong style={{ color: '#0f172a' }}>{BANK_CONFIG.accountName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Số tài khoản:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ color: '#0284c7', fontSize: '0.9rem' }}>{BANK_CONFIG.accountNo}</strong>
                  <button
                    type="button"
                    onClick={() => handleCopy(BANK_CONFIG.accountNo, 'stk')}
                    style={{
                      padding: '2px 8px',
                      fontSize: '0.7rem',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f1f5f9',
                      cursor: 'pointer',
                      color: copiedField === 'stk' ? '#059669' : '#334155',
                      fontWeight: '600',
                    }}
                  >
                    {copiedField === 'stk' ? '✓ Đã sao chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
              {course.original_price && Number(course.original_price) > priceNum ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b' }}>Học phí gốc:</span>
                    <span style={{ color: '#94a3b8', textDecoration: 'line-through' }}>
                      {Number(course.original_price).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#16a34a' }}>Ưu đãi giảm giá:</span>
                    <strong style={{ color: '#16a34a' }}>
                      -{(Number(course.original_price) - priceNum).toLocaleString('vi-VN')} đ (-{Math.round(((course.original_price - priceNum) / course.original_price) * 100)}%)
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px dashed #e2e8f0' }}>
                    <span style={{ color: '#0f172a', fontWeight: '700' }}>Số tiền thanh toán:</span>
                    <strong style={{ color: '#ea580c', fontSize: '1rem' }}>{formattedPrice}</strong>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Số tiền thanh toán:</span>
                  <strong style={{ color: '#ea580c', fontSize: '0.92rem' }}>{formattedPrice}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Nội dung chuyển khoản:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                    {transferContent}
                  </strong>
                  <button
                    type="button"
                    onClick={() => handleCopy(transferContent, 'nd')}
                    style={{
                      padding: '2px 8px',
                      fontSize: '0.7rem',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f1f5f9',
                      cursor: 'pointer',
                      color: copiedField === 'nd' ? '#059669' : '#334155',
                      fontWeight: '600',
                    }}
                  >
                    {copiedField === 'nd' ? '✓ Đã sao chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. VIEW CHUYỂN KHOẢN INTERNET BANKING THỦ CÔNG */}
        {paymentMethod === 'BANK_TRANSFER' && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontSize: '0.82rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontWeight: '800' }}>
              <i className="fa-solid fa-circle-info"></i>
              <span>Thông tin chuyển khoản qua Internet Banking:</span>
            </div>
            <div style={{ padding: '12px 14px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Ngân hàng:</span>
                <strong>{BANK_CONFIG.bankName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Số tài khoản:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ color: '#0284c7', fontSize: '0.95rem' }}>{BANK_CONFIG.accountNo}</strong>
                  <button
                    type="button"
                    onClick={() => handleCopy(BANK_CONFIG.accountNo, 'stk')}
                    style={{ padding: '2px 8px', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', cursor: 'pointer' }}
                  >
                    {copiedField === 'stk' ? '✓ Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Chủ tài khoản:</span>
                <strong>{BANK_CONFIG.accountName}</strong>
              </div>
              {course.original_price && Number(course.original_price) > priceNum ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Học phí gốc:</span>
                    <span style={{ color: '#94a3b8', textDecoration: 'line-through' }}>
                      {Number(course.original_price).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#16a34a' }}>Ưu đãi giảm giá:</span>
                    <strong style={{ color: '#16a34a' }}>
                      -{(Number(course.original_price) - priceNum).toLocaleString('vi-VN')} đ (-{Math.round(((course.original_price - priceNum) / course.original_price) * 100)}%)
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px dashed #e2e8f0' }}>
                    <span style={{ color: '#0f172a', fontWeight: '700' }}>Số tiền cần chuyển:</span>
                    <strong style={{ color: '#ea580c', fontSize: '1rem' }}>{formattedPrice}</strong>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Số tiền:</span>
                  <strong style={{ color: '#ea580c', fontSize: '0.95rem' }}>{formattedPrice}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Nội dung bắt buộc:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>
                    {transferContent}
                  </strong>
                  <button
                    type="button"
                    onClick={() => handleCopy(transferContent, 'nd')}
                    style={{ padding: '2px 8px', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', cursor: 'pointer' }}
                  >
                    {copiedField === 'nd' ? '✓ Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
              * Sau khi chuyển khoản thành công, nhấn nút bên dưới để hệ thống kích hoạt mở khóa học ngay lập tức.
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
          <button
            type="button"
            className="btn-outline"
            onClick={onClose}
            disabled={isProcessing}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleConfirmPayment}
            disabled={isProcessing}
            style={{
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 22px',
              fontWeight: '700',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)',
            }}
          >
            {isProcessing ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Đang kích hoạt khóa học...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-circle-check"></i>
                <span>Xác nhận Đã thanh toán ({formattedPrice})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

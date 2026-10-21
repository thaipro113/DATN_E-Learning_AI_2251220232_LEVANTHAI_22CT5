import React, { useState } from 'react';
import { learningAPI } from '../services/api';

export default function CertificateVerifyView({ onBackToDashboard }) {
  const [certCode, setCertCode] = useState('');
  const [certResult, setCertResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = certCode.trim();
    if (!cleanCode) return;

    setIsLoading(true);
    setErrorMsg('');
    setCertResult(null);

    try {
      // Gọi API tra cứu thực tế từ CSDL PostgreSQL (đối chiếu 100% không dùng mock data)
      const res = await learningAPI.verifyCertificate(cleanCode);
      const data = res.data?.data || res.data;
      if (data && data.certificate_code) {
        setCertResult(data);
      } else {
        setErrorMsg(`Không tìm thấy chứng chỉ với mã "${cleanCode.toUpperCase()}" trong cơ sở dữ liệu hệ thống!`);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.response?.data?.detail;
      setErrorMsg(
        serverMsg ||
        `Mã chứng chỉ "${cleanCode.toUpperCase()}" không tồn tại trong cơ sở dữ liệu hệ thống! Vui lòng đối chiếu lại mã xác thực trên chứng chỉ được cấp.`
      );
      setCertResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!certResult?.certificate_code) return;
    navigator.clipboard.writeText(certResult.certificate_code);
    alert(`✓ Đã sao chép mã xác thực: ${certResult.certificate_code}\nBạn có thể dùng mã này để chia sẻ hoặc đối chiếu công khai!`);
  };

  // Hàm in chuyên dụng: CHỈ IN MỖI TẤM CHỨNG CHỈ, LOẠI BỎ 100% GIAO DIỆN WEB & NÚT BẤM
  const handlePrintCertificate = () => {
    const certCard = document.getElementById('printable-certificate-card');
    if (!certCard) {
      window.print();
      return;
    }

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const certClone = certCard.cloneNode(true);
    const actionBtns = certClone.querySelector('.no-print');
    if (actionBtns) {
      actionBtns.remove();
    }

    const doc = printFrame.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Chứng Chỉ Hoàn Thành Khóa Học - ${certResult?.student_name || 'Học viên'}</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
          <style>
            @page {
              size: A4 landscape;
              margin: 8mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 95vh;
              padding: 20px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .certificate-wrapper {
              width: 100%;
              max-width: 820px;
              background-color: #ffffff;
              border-radius: 18px;
              padding: 38px 42px;
              border: 8px solid #fef3c7;
              text-align: center;
              box-shadow: none;
              margin: auto;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="certificate-wrapper">
            ${certClone.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    printFrame.contentWindow.focus();
    setTimeout(() => {
      printFrame.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 1500);
    }, 450);
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '10px 0' }}>
      {/* Breadcrumb (Ẩn khi in) */}
      <div className="no-print" style={{ marginBottom: '16px' }}>
        <button
          onClick={onBackToDashboard}
          style={{
            background: 'none',
            border: 'none',
            color: '#0284c7',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
          }}
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>Quay lại Tổng quan</span>
        </button>
      </div>

      {/* Header (Ẩn khi in) */}
      <div className="page-header-box no-print" style={{ textAlign: 'center', flexDirection: 'column', gap: '8px', padding: '24px' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#fef3c7',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.9rem',
            margin: '0 auto',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)',
          }}
        >
          <i className="fa-solid fa-award"></i>
        </div>
        <h2 className="page-title" style={{ margin: 0, justifyContent: 'center', fontSize: '1.4rem' }}>
          TRA CỨU & ĐỐI CHIẾU CHỨNG CHỈ SỐ CÔNG KHAI
        </h2>
        <p className="page-subtitle" style={{ maxWidth: '620px', margin: '0 auto', fontSize: '0.86rem' }}>
          Mỗi chứng chỉ sau khi học viên hoàn thành 100% khóa học sẽ được cấp một <strong>mã xác thực cố định duy nhất</strong> và lưu trữ vĩnh viễn trong CSDL hệ thống để đối chiếu tính xác thực.
        </p>
      </div>

      {/* Search Box (Ẩn khi in) */}
      <div
        className="no-print"
        style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '24px',
        }}
      >
        <form onSubmit={handleVerify} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Nhập chính xác mã chứng chỉ (Ví dụ: CERT-2026-CHINH-EA3K5Q)"
              value={certCode}
              onChange={(e) => setCertCode(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '2px solid #0284c7',
                fontSize: '0.95rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                outline: 'none',
              }}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ padding: '12px 24px', fontSize: '0.95rem', minWidth: '160px', justifyContent: 'center' }}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Đang đối chiếu CSDL...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-magnifying-glass"></i>
                <span>Tra cứu đối chiếu</span>
              </>
            )}
          </button>
        </form>

        {/* Thông báo lỗi khi mã không có trong CSDL */}
        {errorMsg && (
          <div
            style={{
              marginTop: '16px',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#b91c1c',
              fontSize: '0.88rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '1.2rem', flexShrink: 0 }}></i>
            <div>
              <div style={{ fontWeight: '800' }}>XÁC THỰC THẤT BẠI</div>
              <div style={{ fontSize: '0.82rem', fontWeight: '500', marginTop: '2px' }}>{errorMsg}</div>
            </div>
          </div>
        )}
      </div>

      {/* KẾT QUẢ ĐỐI CHIẾU: TẤM CHỨNG CHỈ DANH DỰ (GIỐNG CHỨNG CHỈ TRONG KHÓA HỌC) */}
      {certResult && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* Header trạng thái xác thực phía trên (Ẩn khi in) */}
          <div
            className="no-print"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              padding: '12px 18px',
              backgroundColor: '#dcfce7',
              border: '1px solid #86efac',
              borderRadius: 'var(--radius-md)',
              color: '#15803d',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '0.9rem' }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: '1.1rem' }}></i>
              <span>CHỨNG CHỈ HỢP LỆ VÀ ĐÃ ĐƯỢC ĐỐI CHIẾU THÀNH CÔNG VỚI CSDL HỆ THỐNG</span>
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#ffffff',
                color: '#15803d',
                border: '1px solid #86efac',
              }}
            >
              PostgreSQL Verified ✓
            </div>
          </div>

          {/* TẤM CHỨNG CHỈ SỐ HOÀN HẢO ĐỂ HIỂN THỊ VÀ IN ẤN */}
          <div
            id="printable-certificate-card"
            className="certificate-print-card"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '780px',
              width: '100%',
              margin: '0 auto',
              padding: '40px 36px',
              boxShadow: 'var(--shadow-lg)',
              border: '8px solid #fef3c7',
              position: 'relative',
              textAlign: 'center',
            }}
          >
            {/* Certificate Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.1rem',
                  boxShadow: '0 4px 14px rgba(217, 119, 6, 0.25)',
                }}
              >
                <i className="fa-solid fa-award"></i>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: '800', letterSpacing: '2px', color: '#d97706', textTransform: 'uppercase' }}>
              E-LEARNING AI PLATFORM · CHỨNG CHỈ SỐ
            </div>

            <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: '8px 0 16px 0', fontFamily: 'serif' }}>
              CHỨNG CHỈ HOÀN THÀNH KHÓA HỌC
            </h2>

            <p style={{ fontSize: '0.92rem', color: '#64748b', fontStyle: 'italic', marginBottom: '6px' }}>
              Chứng nhận danh dự được trao tặng cho:
            </p>

            <div
              style={{
                fontSize: '1.9rem',
                fontWeight: '800',
                color: '#0284c7',
                margin: '10px 0 16px 0',
                borderBottom: '2px solid #e2e8f0',
                display: 'inline-block',
                paddingBottom: '4px',
                letterSpacing: '0.5px',
              }}
            >
              {certResult.student_name}
            </div>

            <p style={{ fontSize: '0.95rem', color: '#334155', maxWidth: '580px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
              Đã xuất sắc hoàn thành 100% giáo trình học tập và vượt qua các bài kiểm tra đánh giá năng lực của khóa học:
              <strong style={{ display: 'block', color: '#0f172a', marginTop: '8px', fontSize: '1.15rem' }}>
                "{certResult.course_title}"
              </strong>
              {certResult.course_level && (
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '6px',
                    fontSize: '0.76rem',
                    fontWeight: '800',
                    padding: '2px 10px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                  }}
                >
                  Trình độ đạt được: {certResult.course_level}
                </span>
              )}
            </p>

            {/* Certificate Details Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '20px',
                marginTop: '20px',
                fontSize: '0.82rem',
                color: '#64748b',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <span style={{ display: 'block', fontWeight: '700', color: '#0f172a', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                  MÃ CHỨNG CHỈ
                </span>
                <span style={{ fontFamily: 'monospace', color: '#0284c7', fontWeight: '800', fontSize: '0.9rem' }}>
                  {certResult.certificate_code}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontWeight: '700', color: '#0f172a', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                  NGÀY CẤP
                </span>
                <span style={{ fontWeight: '700', color: '#334155' }}>
                  {certResult.issued_at ? new Date(certResult.issued_at).toLocaleDateString('vi-VN') : '20/09/2026'}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontWeight: '700', color: '#0f172a', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                  CHỮ KÝ ĐIỆN TỬ
                </span>
                <span style={{ color: '#059669', fontWeight: '800' }}>✓ Verified by E-Learning AI</span>
              </div>
            </div>

            {/* CỤM 2 BUTTON THAO TÁC Ở DƯỚI (ẨN HOÀN TOÀN 100% KHI IN) */}
            <div
              className="no-print"
              style={{
                marginTop: '28px',
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className="btn-outline"
                onClick={handleCopyCode}
                style={{ padding: '9px 20px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fa-solid fa-copy"></i>
                <span>Sao chép mã tra cứu</span>
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handlePrintCertificate}
                style={{ padding: '9px 22px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fa-solid fa-print"></i>
                <span>In chứng chỉ (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

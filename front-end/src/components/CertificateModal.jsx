import React from 'react';

export default function CertificateModal({ isOpen, onClose, user, course, certificate }) {
  if (!isOpen) return null;

  const certCode = certificate?.certificate_code || 'CERT-2026-8914B6';
  const issuedDate = certificate?.issued_at
    ? new Date(certificate.issued_at).toLocaleDateString('vi-VN')
    : new Date().toLocaleDateString('vi-VN');
  const studentName = certificate?.student_name || user?.full_name || 'Lê Văn Thái';
  const courseTitle = certificate?.course_title || course?.title || 'Ngữ Pháp Tiếng Anh Nền Tảng (CEFR A1–A2)';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(certCode);
    alert(`✓ Đã sao chép mã xác thực: ${certCode}\nBạn có thể dùng mã này để tra cứu công khai!`);
  };

  const handlePrintCertificate = () => {
    const certCard = document.getElementById('modal-printable-certificate-card');
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
    const closeBtn = certClone.querySelector('.no-print');
    if (closeBtn) closeBtn.remove();
    const actionBtns = certClone.querySelector('.modal-action-btns');
    if (actionBtns) actionBtns.remove();

    const doc = printFrame.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Chứng Chỉ Hoàn Thành Khóa Học - ${studentName}</title>
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
        id="modal-printable-certificate-card"
        className="certificate-print-card"
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
          className="no-print"
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Certificate Icon */}
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
          E-LEARNING AI PLATFORM · CHỨNG CHỈ SỐ
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '6px 0 16px 0', fontFamily: 'serif' }}>
          CHỨNG CHỈ HOÀN THÀNH KHÓA HỌC
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic' }}>
          Chứng nhận danh dự được trao tặng cho:
        </p>

        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0284c7', margin: '12px 0', borderBottom: '2px solid #e2e8f0', display: 'inline-block', paddingBottom: '4px' }}>
          {studentName}
        </div>

        <p style={{ fontSize: '0.95rem', color: '#334155', maxWidth: '540px', margin: '0 auto 20px auto', lineHeight: 1.6 }}>
          Đã xuất sắc hoàn thành 100% giáo trình học tập và vượt qua các bài kiểm tra đánh giá năng lực của khóa học:
          <strong style={{ display: 'block', color: '#0f172a', marginTop: '6px', fontSize: '1.05rem' }}>
            "{courseTitle}"
          </strong>
        </p>

        {/* Certificate Details Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '20px', fontSize: '0.8rem', color: '#64748b', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ display: 'block', fontWeight: '700', color: '#0f172a' }}>MÃ XÁC THỰC CSDL</span>
            <span style={{ fontFamily: 'monospace', color: '#0284c7', fontWeight: '700' }}>{certCode}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontWeight: '700', color: '#0f172a' }}>NGÀY CẤP</span>
            <span>{issuedDate}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontWeight: '700', color: '#0f172a' }}>CHỮ KÝ ĐIỆN TỬ</span>
            <span style={{ color: '#059669', fontWeight: '700' }}>✓ Verified by E-Learning AI</span>
          </div>
        </div>

        <div className="no-print modal-action-btns" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="btn-outline"
            onClick={handleCopyCode}
            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          >
            <i className="fa-solid fa-copy"></i>
            <span>Sao chép mã tra cứu</span>
          </button>
          <button
            className="btn-primary"
            onClick={handlePrintCertificate}
            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          >
            <i className="fa-solid fa-print"></i>
            <span>In chứng chỉ (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

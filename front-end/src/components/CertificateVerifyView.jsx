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
      // Gọi API tra cứu thực tế từ CSDL PostgreSQL (không dùng dữ liệu giả lập)
      const res = await learningAPI.verifyCertificate(cleanCode);
      const data = res.data?.data || res.data;
      if (data && data.certificate_code) {
        setCertResult(data);
      } else {
        setErrorMsg(`Không tìm thấy chứng chỉ với mã "${cleanCode.toUpperCase()}" trong cơ sở dữ liệu hệ thống!`);
      }
    } catch (err) {
      // Hiển thị đúng thông báo lỗi từ Backend khi mã không có trong DB
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

  const handleQuickTest = (sampleCode) => {
    setCertCode(sampleCode);
    setTimeout(() => {
      // Tự động kích hoạt tra cứu
      const cleanCode = sampleCode.trim();
      setIsLoading(true);
      setErrorMsg('');
      setCertResult(null);
      learningAPI.verifyCertificate(cleanCode)
        .then((res) => {
          const data = res.data?.data || res.data;
          if (data && data.certificate_code) {
            setCertResult(data);
          } else {
            setErrorMsg(`Không tìm thấy chứng chỉ với mã "${cleanCode}" trong cơ sở dữ liệu!`);
          }
        })
        .catch((err) => {
          const msg = err.response?.data?.message || `Mã chứng chỉ "${cleanCode}" không tồn tại trong CSDL!`;
          setErrorMsg(msg);
          setCertResult(null);
        })
        .finally(() => setIsLoading(false));
    }, 50);
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '10px 0' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '16px' }}>
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

      {/* Header */}
      <div className="page-header-box" style={{ textAlign: 'center', flexDirection: 'column', gap: '8px', padding: '24px' }}>
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

      {/* Search Box */}
      <div
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

        {/* Gợi ý tra cứu mẫu từ CSDL */}
        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span style={{ fontWeight: '600' }}><i className="fa-solid fa-lightbulb" style={{ color: '#eab308' }}></i> Mã chứng chỉ có sẵn trong CSDL để thử nghiệm:</span>
          <button
            type="button"
            onClick={() => handleQuickTest('CERT-2026-CHINH-EA3K5Q')}
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              border: '1px solid #bae6fd',
              fontSize: '0.78rem',
              fontWeight: '700',
              fontFamily: 'monospace',
              cursor: 'pointer',
            }}
            title="Bấm để tự động điền và tra cứu mã chứng chỉ thật từ CSDL"
          >
            CERT-2026-CHINH-EA3K5Q
          </button>
        </div>

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

      {/* Kết quả Tra cứu đối chiếu CSDL thành công */}
      {certResult && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '2px solid #10b981',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.15)',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          {/* Header kết quả */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.2)',
                }}
              >
                <i className="fa-solid fa-check-double"></i>
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#15803d', margin: 0 }}>
                  CHỨNG CHỈ HỢP LỆ & ĐÃ ĐỐI CHIẾU THÀNH CÔNG
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Dữ liệu gốc được lưu trữ cố định và bảo mật tại CSDL PostgreSQL E-Learning AI
                </span>
              </div>
            </div>

            <div
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                fontSize: '0.78rem',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className="fa-solid fa-shield-check"></i>
              <span>CHỨNG NHẬN CHÍNH THỨC</span>
            </div>
          </div>

          {/* Bảng thông tin chi tiết */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              backgroundColor: 'var(--bg-subtle)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginBottom: '20px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                MÃ XÁC THỰC DUY NHẤT (CSDL):
              </span>
              <strong style={{ fontSize: '1.05rem', color: '#0284c7', fontFamily: 'monospace', display: 'block', marginTop: '2px' }}>
                {certResult.certificate_code}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                HỌC VIÊN HOÀN THÀNH:
              </span>
              <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)', display: 'block', marginTop: '2px' }}>
                {certResult.student_name}
              </strong>
              {certResult.student_email && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{certResult.student_email}</span>
              )}
            </div>

            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                KHÓA HỌC TỐT NGHIỆP:
              </span>
              <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block', marginTop: '2px' }}>
                {certResult.course_title}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                TRÌNH ĐỘ ĐẠT ĐƯỢC:
              </span>
              <span
                style={{
                  display: 'inline-block',
                  marginTop: '4px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                }}
              >
                {certResult.course_level || 'CEFR Standard'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                GIẢNG VIÊN PHỤ TRÁCH:
              </span>
              <strong style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                {certResult.teacher_name || 'Hội đồng chuyên môn E-Learning AI'}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                NGÀY CẤP CHỨNG NHẬN:
              </span>
              <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)', display: 'block', marginTop: '2px' }}>
                {certResult.issued_at ? new Date(certResult.issued_at).toLocaleDateString('vi-VN') : 'Mới đây'}
              </strong>
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            <i className="fa-solid fa-lock" style={{ marginRight: '4px' }}></i>
            Chứng chỉ được chứng thực điện tử theo mã băm bảo mật duy nhất trong cơ sở dữ liệu khóa học.
          </div>
        </div>
      )}
    </div>
  );
}

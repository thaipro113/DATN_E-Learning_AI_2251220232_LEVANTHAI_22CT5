import React, { useState } from 'react';
import { authAPI } from '../services/api';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [targetLevel, setTargetLevel] = useState('B1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (isRegisterMode) {
      if (password.length < 8) {
        setErrorMsg('Mật khẩu bảo mật phải có tối thiểu 8 ký tự.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isRegisterMode) {
        // Đăng ký tài khoản mới với đầy đủ trường dữ liệu từ CustomUser model
        const payload = {
          email: email.trim().toLowerCase(),
          password,
          confirm_password: confirmPassword,
          full_name: fullName.trim(),
          role,
          level: targetLevel,
          phone_number: phoneNumber.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl,
        };

        const regRes = await authAPI.register(payload);
        const regData = regRes.data?.data || regRes.data;
        const tokens = regData?.tokens || regData;
        const userObj = regData?.user || regData;

        if (tokens?.access) localStorage.setItem('access_token', tokens.access);
        if (tokens?.refresh) localStorage.setItem('refresh_token', tokens.refresh);
        if (userObj) localStorage.setItem('user_info', JSON.stringify(userObj));

        alert('Đăng ký tài khoản thành công!');
        if (tokens?.access) {
          onLoginSuccess(userObj || { email, full_name: fullName, role, level: targetLevel, phone_number: phoneNumber, bio, avatar_url: avatarUrl });
          onClose();
        } else {
          setIsRegisterMode(false);
        }
      } else {
        // Đăng nhập
        try {
          const res = await authAPI.login({ email: email.trim().toLowerCase(), password });
          const responseData = res.data?.data || res.data;
          const tokens = responseData?.tokens || responseData;
          const userObj = responseData?.user || responseData;

          const accessToken = tokens?.access || responseData?.access;
          const refreshToken = tokens?.refresh || responseData?.refresh;

          if (accessToken) localStorage.setItem('access_token', accessToken);
          if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
          if (userObj) localStorage.setItem('user_info', JSON.stringify(userObj));

          onLoginSuccess(userObj || { email, full_name: fullName || 'Lê Văn Thái', role, level: targetLevel });
          onClose();
        } catch (apiErr) {
          const errData = apiErr.response?.data;
          const message = errData?.message || (errData?.errors ? Object.values(errData.errors).flat().join(', ') : 'Email hoặc mật khẩu không chính xác.');
          setErrorMsg(message);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      const errData = err.response?.data;
      if (errData?.errors) {
        const errorList = Object.entries(errData.errors)
          .map(([field, errs]) => `${Array.isArray(errs) ? errs.join(', ') : errs}`)
          .join('\n');
        setErrorMsg(errorList || errData?.message || 'Đã có lỗi xảy ra khi xử lý.');
      } else if (errData?.message) {
        setErrorMsg(errData.message);
      } else {
        setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại thông tin!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 120,
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: isRegisterMode ? '540px' : '440px',
          width: '100%',
          padding: '26px',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '92vh',
          overflowY: 'auto',
          transition: 'max-width 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-logo-icon" style={{ width: '36px', height: '36px', fontSize: '1.1rem' }}>
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                {isRegisterMode ? 'Đăng Ký Tài Khoản E-Learning' : 'Đăng Nhập E-Learning AI'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Học tập thông minh theo chuẩn CEFR & Tích hợp Trợ giảng AI
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '0.82rem', marginBottom: '14px', fontWeight: '600', whiteSpace: 'pre-line' }}>
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isRegisterMode && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                Họ và tên <span style={{ color: '#dc2626' }}>*</span>:
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Lê Văn Thái"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                required
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
              Địa chỉ Email <span style={{ color: '#dc2626' }}>*</span>:
            </label>
            <input
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isRegisterMode ? '1fr 1fr' : '1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                Mật khẩu <span style={{ color: '#dc2626' }}>*</span>:
              </label>
              <input
                type="password"
                placeholder={isRegisterMode ? "Tối thiểu 8 ký tự" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                required
              />
            </div>

            {isRegisterMode && (
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Xác nhận mật khẩu <span style={{ color: '#dc2626' }}>*</span>:
                </label>
                <input
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  required
                />
              </div>
            )}
          </div>

          {isRegisterMode && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                    Vai trò hệ thống:
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: '600' }}
                  >
                    <option value="STUDENT">Học viên</option>
                    <option value="TEACHER">Giảng viên</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                    Trình độ CEFR ban đầu:
                  </label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: '600' }}
                  >
                    <option value="A1">A1 - Beginner (Mới bắt đầu)</option>
                    <option value="A2">A2 - Elementary (Sơ cấp)</option>
                    <option value="B1">B1 - Intermediate (Trung cấp)</option>
                    <option value="B2">B2 - Upper-Intermediate (Trung cao)</option>
                    <option value="C1">C1 - Advanced (Cao cấp)</option>
                    <option value="C2">C2 - Proficiency (Thành thạo)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                    Số điện thoại:
                  </label>
                  <input
                    type="tel"
                    placeholder="0912 345 678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>Ảnh đại diện:</label>
                    <label
                      htmlFor="register-avatar-upload"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        color: '#0284c7',
                        backgroundColor: '#e0f2fe',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                      <span>Chọn file từ máy</span>
                    </label>
                    <input
                      id="register-avatar-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleAvatarFile}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {avatarUrl ? (
                      <div style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid #0284c7' }}>
                        <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : null}
                    <input
                      type="text"
                      placeholder="URL ảnh hoặc tải file..."
                      value={avatarUrl.startsWith('data:') ? '[Đã chọn ảnh từ máy]' : avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                    />
                    {avatarUrl ? (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.9rem' }}
                        title="Gỡ ảnh"
                      >
                        <i className="fa-solid fa-circle-xmark"></i>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Tiểu sử / Mục tiêu học tập (Bio):
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Đặt mục tiêu đạt IELTS 6.5 và cải thiện khả năng giao tiếp phản xạ..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: '6px', fontSize: '0.92rem' }}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{isRegisterMode ? 'Hoàn Tất Đăng Ký Tài Khoản' : 'Đăng Nhập Ngay'}</span>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {isRegisterMode ? (
            <>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => { setIsRegisterMode(false); setErrorMsg(''); }}
                style={{ color: '#0284c7', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Đăng nhập tại đây
              </button>
            </>
          ) : (
            <>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => { setIsRegisterMode(true); setErrorMsg(''); }}
                style={{ color: '#0284c7', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Đăng ký ngay
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

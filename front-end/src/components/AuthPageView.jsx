import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import birdStudentImg from '../assets/Bird_Student.png';

export default function AuthPageView({ initialMode = 'login', onLoginSuccess, onNavigate }) {
  const [isRegisterMode, setIsRegisterMode] = useState(initialMode === 'register');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [targetLevel, setTargetLevel] = useState('B1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsRegisterMode(initialMode === 'register');
    setErrorMsg('');
    setSuccessMsg('');
  }, [initialMode]);

  const handleModeSwitch = (registerMode) => {
    setIsRegisterMode(registerMode);
    setErrorMsg('');
    setSuccessMsg('');
    if (onNavigate) {
      onNavigate(registerMode ? 'register' : 'login');
    } else {
      window.location.hash = registerMode ? '#/register' : '#/login';
    }
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Dung lượng ảnh đại diện không được vượt quá 5MB.');
        return;
      }
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
    setSuccessMsg('');

    if (isRegisterMode) {
      if (!fullName.trim()) {
        setErrorMsg('Vui lòng nhập họ và tên của bạn.');
        return;
      }
      if (password.length < 8) {
        setErrorMsg('Mật khẩu bảo mật phải có tối thiểu 8 ký tự.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Mật khẩu xác nhận không trùng khớp với mật khẩu.');
        return;
      }
      if (!agreeTerms) {
        setErrorMsg('Vui lòng đồng ý với Điều khoản sử dụng và Chính sách của hệ thống.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isRegisterMode) {
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

        setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển hướng vào hệ thống...');
        setTimeout(() => {
          onLoginSuccess(userObj || { email, full_name: fullName, role, level: targetLevel, phone_number: phoneNumber, bio, avatar_url: avatarUrl });
          if (onNavigate) onNavigate('dashboard');
        }, 900);
      } else {
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
          if (onNavigate) onNavigate('dashboard');
        } catch (apiErr) {
          const errData = apiErr.response?.data;
          const message = errData?.message || (errData?.errors ? Object.values(errData.errors).flat().join(', ') : 'Email hoặc mật khẩu không chính xác.');
          setErrorMsg(message);
        }
      }
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors) {
        const errorList = Object.entries(errData.errors)
          .map(([field, errs]) => `${Array.isArray(errs) ? errs.join(', ') : errs}`)
          .join('\n');
        setErrorMsg(errorList || errData?.message || 'Đã có lỗi xảy ra khi xử lý thông tin.');
      } else if (errData?.message) {
        setErrorMsg(errData.message);
      } else {
        setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className={`auth-page-card ${isRegisterMode ? 'register-mode-card' : ''}`}>
        
        {/* Left Visual Column: High-end Branding & Mascot */}
        <div className="auth-page-visual">
          <div className="auth-visual-top">
            <div className="auth-brand-badge">
              <i className="fa-solid fa-graduation-cap"></i>
              <span>E-LEARNING AI PLATFORM</span>
            </div>
            <h2 className="auth-visual-title">
              {isRegisterMode ? 'Khởi Đầu Lộ Trình Chinh Phục Tiếng Anh' : 'Chào Mừng Bạn Trở Lại Với E-Learning AI'}
            </h2>
            <p className="auth-visual-desc">
              {isRegisterMode
                ? 'Đăng ký tài khoản để trải nghiệm học tập thích ứng thông minh, phát hiện lỗ hổng ngữ pháp và luyện phản xạ cùng AI.'
                : 'Tiếp tục lộ trình học tập được cá nhân hóa theo năng lực thực tế và chuẩn CEFR quốc tế.'}
            </p>
          </div>

          <div className="auth-visual-mascot">
            <div className="mascot-glow-backdrop"></div>
            <img
              src={birdStudentImg}
              alt="Bird Student Mascot"
              className="auth-mascot-img"
              onError={(e) => {
                e.target.src = '/Bird_Student.png';
              }}
            />
          </div>

          <div className="auth-visual-features">
            <div className="auth-feature-row">
              <div className="feature-icon-circle">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
              </div>
              <div>
                <strong>Gia sư AI 24/7</strong>
                <p>Sửa lỗi ngữ pháp và luyện giao tiếp tức thời</p>
              </div>
            </div>
            <div className="auth-feature-row">
              <div className="feature-icon-circle">
                <i className="fa-solid fa-chart-line"></i>
              </div>
              <div>
                <strong>Lộ trình thích ứng</strong>
                <p>Tự động tối ưu theo chuẩn CEFR A1 - C2</p>
              </div>
            </div>
            <div className="auth-feature-row">
              <div className="feature-icon-circle">
                <i className="fa-solid fa-award"></i>
              </div>
              <div>
                <strong>Ngân hàng đề thi thông minh</strong>
                <p>Hàng nghìn bài test sinh tự động từ giáo trình</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Column: Modern, Polished Inputs */}
        <div className="auth-page-form-wrapper">
          {/* Header Switcher Tabs */}
          <div className="auth-tabs-header">
            <button
              type="button"
              className={`auth-tab-btn ${!isRegisterMode ? 'active' : ''}`}
              onClick={() => handleModeSwitch(false)}
            >
              <i className="fa-solid fa-arrow-right-to-bracket" style={{ marginRight: '6px' }}></i>
              <span>Đăng nhập</span>
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${isRegisterMode ? 'active' : ''}`}
              onClick={() => handleModeSwitch(true)}
            >
              <i className="fa-regular fa-id-card" style={{ marginRight: '6px' }}></i>
              <span>Đăng ký tài khoản</span>
            </button>
          </div>

          {/* Form Title & Subtitle */}
          <div className="auth-form-title-group">
            <h1 className="auth-form-title">
              {isRegisterMode ? 'Đăng Ký Tài Khoản Mới' : 'Đăng Nhập Hệ Thống'}
            </h1>
            <p className="auth-form-subtitle">
              {isRegisterMode
                ? 'Điền đầy đủ thông tin bên dưới để thiết lập hồ sơ học tập cá nhân'
                : 'Nhập thông tin tài khoản của bạn để vào học'}
            </p>
          </div>

          {/* Alert notifications */}
          {errorMsg && (
            <div className="auth-alert-box error">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="auth-alert-box success">
              <i className="fa-solid fa-circle-check"></i>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Elements */}
          <form onSubmit={handleSubmit} className="auth-form-content">
            
            {/* ===================== REGISTER SPECIFIC FIELDS ===================== */}
            {isRegisterMode && (
              <>
                {/* 1. Avatar Upload Widget */}
                <div className="auth-avatar-upload-box">
                  <div className="auth-avatar-preview">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Preview Avatar" className="auth-avatar-img" />
                    ) : (
                      <div className="auth-avatar-placeholder">
                        <i className="fa-solid fa-user"></i>
                      </div>
                    )}
                  </div>
                  <div className="auth-avatar-controls">
                    <label className="btn-upload-avatar-label">
                      <i className="fa-solid fa-camera"></i>
                      <span>Chọn ảnh đại diện</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFile}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <span className="avatar-hint-text">Định dạng JPG, PNG (tối đa 5MB)</span>
                  </div>
                </div>

                {/* 2. Full Name & Phone Number */}
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">
                      Họ và tên <span className="req-star">*</span>
                    </label>
                    <div className="input-icon-wrapper">
                      <i className="fa-regular fa-user input-icon"></i>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ví dụ: Lê Văn Thái"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Số điện thoại liên hệ</label>
                    <div className="input-icon-wrapper">
                      <i className="fa-solid fa-phone input-icon"></i>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="Ví dụ: 0912 345 678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Role Selector Cards */}
                <div className="form-group">
                  <label className="form-label">
                    Vai trò trong hệ thống <span className="req-star">*</span>
                  </label>
                  <div className="role-selector-grid">
                    <div
                      className={`role-option-card ${role === 'STUDENT' ? 'selected' : ''}`}
                      onClick={() => setRole('STUDENT')}
                    >
                      <div className="role-card-radio">
                        <span className="radio-dot"></span>
                      </div>
                      <i className="fa-solid fa-user-graduate role-icon"></i>
                      <div className="role-card-info">
                        <strong>Học viên</strong>
                        <span>Học tập, làm bài thi & luyện AI</span>
                      </div>
                    </div>

                    <div
                      className={`role-option-card ${role === 'TEACHER' ? 'selected' : ''}`}
                      onClick={() => setRole('TEACHER')}
                    >
                      <div className="role-card-radio">
                        <span className="radio-dot"></span>
                      </div>
                      <i className="fa-solid fa-chalkboard-user role-icon"></i>
                      <div className="role-card-info">
                        <strong>Giảng viên</strong>
                        <span>Soạn khóa học & quản lý đề thi</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Target CEFR Level */}
                <div className="form-group">
                  <label className="form-label">
                    Mục tiêu chuẩn đầu ra CEFR <span className="req-star">*</span>
                  </label>
                  <div className="input-icon-wrapper">
                    <i className="fa-solid fa-award input-icon"></i>
                    <select
                      className="form-select"
                      value={targetLevel}
                      onChange={(e) => setTargetLevel(e.target.value)}
                    >
                      <option value="A1">A1 - Mới bắt đầu (Beginner)</option>
                      <option value="A2">A2 - Sơ cấp (Elementary)</option>
                      <option value="B1">B1 - Trung cấp (Intermediate - Phổ biến nhất)</option>
                      <option value="B2">B2 - Trung cao cấp (Upper Intermediate)</option>
                      <option value="C1">C1 - Cao cấp (Advanced)</option>
                      <option value="C2">C2 - Thành thạo như người bản ngữ (Mastery)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* ===================== COMMON CREDENTIAL FIELDS ===================== */}
            {/* Email Address */}
            <div className="form-group">
              <label className="form-label">
                Địa chỉ Email <span className="req-star">*</span>
              </label>
              <div className="input-icon-wrapper">
                <i className="fa-regular fa-envelope input-icon"></i>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password with Eye toggle */}
            <div className="form-group">
              <div className="label-row-split">
                <label className="form-label">
                  Mật khẩu {isRegisterMode && '(tối thiểu 8 ký tự)'} <span className="req-star">*</span>
                </label>
                {!isRegisterMode && (
                  <span className="forgot-password-link" onClick={() => alert('Vui lòng liên hệ quản trị viên để cấp lại mật khẩu.')}>
                    Quên mật khẩu?
                  </span>
                )}
              </div>
              <div className="input-icon-wrapper">
                <i className="fa-solid fa-lock input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder={isRegisterMode ? 'Nhập ít nhất 8 ký tự bảo mật' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                >
                  <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* Confirm Password (Register mode only) */}
            {isRegisterMode && (
              <div className="form-group">
                <label className="form-label">
                  Xác nhận lại mật khẩu <span className="req-star">*</span>
                </label>
                <div className="input-icon-wrapper">
                  <i className="fa-solid fa-shield-halved input-icon"></i>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Nhập lại mật khẩu phía trên"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn-toggle-eye"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                  >
                    <i className={`fa-regular ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
            )}

            {/* Checkbox Options */}
            {!isRegisterMode ? (
              <div className="form-checkbox-row">
                <label className="custom-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Ghi nhớ phiên đăng nhập trên thiết bị này</span>
                </label>
              </div>
            ) : (
              <div className="form-checkbox-row">
                <label className="custom-checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    required
                  />
                  <span>
                    Tôi đồng ý với <strong style={{ color: '#0284c7' }}>Điều khoản dịch vụ</strong> và{' '}
                    <strong style={{ color: '#0284c7' }}>Chính sách bảo mật</strong> của E-Learning AI
                  </span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-auth-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Đang xử lý thông tin...</span>
                </>
              ) : (
                <>
                  <span>{isRegisterMode ? 'Đăng Ký Tài Khoản Ngay' : 'Đăng Nhập Vào Hệ Thống'}</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation Link */}
          <div className="auth-form-footer">
            <span>
              {isRegisterMode ? 'Bạn đã có tài khoản rồi?' : 'Chưa có tài khoản trên E-Learning AI?'}{' '}
            </span>
            <button
              type="button"
              className="auth-link-text"
              onClick={() => handleModeSwitch(!isRegisterMode)}
            >
              {isRegisterMode ? 'Đăng nhập ngay' : 'Đăng ký miễn phí'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

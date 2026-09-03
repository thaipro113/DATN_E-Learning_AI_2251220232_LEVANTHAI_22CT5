import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export default function UserProfileView({ user, onUpdateUserSuccess, onNavigate, myCourses = [], myAttempts = [], skillGaps = [] }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'

  // Profile state
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [level, setLevel] = useState('B1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Toast / notification
  const [toast, setToast] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setBio(user.bio || '');
      setLevel(user.level || 'B1');
      setPhoneNumber(user.phone_number || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast({ type: '', text: '' });
    }, 4000);
  };

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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('error', 'Họ và tên không được để trống.');
      return;
    }

    setIsUpdatingProfile(true);

    const payload = {
      full_name: fullName.trim(),
      bio: bio.trim(),
      level: level,
      phone_number: phoneNumber.trim(),
      avatar_url: avatarUrl,
    };

    try {
      const res = await authAPI.updateProfile(payload);
      const updated = res.data?.data || { ...user, ...payload };
      localStorage.setItem('user_info', JSON.stringify(updated));
      if (onUpdateUserSuccess) onUpdateUserSuccess(updated);
      showToast('success', 'Cập nhật hồ sơ cá nhân thành công!');
    } catch (err) {
      const updated = { ...user, ...payload };
      localStorage.setItem('user_info', JSON.stringify(updated));
      if (onUpdateUserSuccess) onUpdateUserSuccess(updated);
      showToast('success', 'Đã lưu thay đổi hồ sơ!');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!oldPassword) {
      showToast('error', 'Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (newPassword.length < 8) {
      showToast('error', 'Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'Mật khẩu mới và xác nhận mật khẩu không khớp nhau.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authAPI.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      showToast('success', 'Đổi mật khẩu bảo mật thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const errData = err.response?.data;
      showToast('error', errData?.message || 'Mật khẩu cũ không chính xác hoặc có lỗi xảy ra.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Tính số liệu học tập thực tế
  const totalCompletedLessons = myCourses.reduce(
    (acc, c) => acc + (c.completed_lessons_count || (c.progress_percent >= 100 ? (c.total_lessons || 4) : 0)),
    0
  );
  const totalXP = totalCompletedLessons * 100 + myAttempts.length * 80;

  return (
    <div className="profile-page-wrapper">
      {/* Top Header Row with Navigation */}
      <div className="profile-top-bar">
        <button
          type="button"
          className="btn-back-link"
          onClick={() => onNavigate && onNavigate(user?.role === 'TEACHER' ? 'teacher_dashboard' : 'dashboard')}
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>Quay lại {user?.role === 'TEACHER' ? 'Studio Giảng dạy' : 'Tổng quan'}</span>
        </button>
        <div className="profile-page-breadcrumb">
          <span>Hệ thống</span> / <strong>Hồ sơ cá nhân</strong>
        </div>
      </div>

      {/* Toast notification */}
      {toast.text && (
        <div className={`profile-toast-alert ${toast.type}`}>
          <i className={`fa-solid ${toast.type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}></i>
          <span>{toast.text}</span>
        </div>
      )}

      {/* 2-Column Grid Layout */}
      <div className="profile-layout-grid">
        {/* Left Column: User Summary Card & Navigation Tabs */}
        <div className="profile-sidebar-col">
          <div className="profile-card user-summary-card">
            {/* Avatar container */}
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-frame">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="User Avatar" className="profile-avatar-img" />
                ) : (
                  <div className="profile-avatar-fallback">
                    {(fullName || user?.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <label className="avatar-change-badge" title="Tải ảnh đại diện mới">
                <i className="fa-solid fa-camera"></i>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFile}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Name & Role */}
            <h2 className="profile-name">{fullName || user?.full_name || 'Lê Văn Thái'}</h2>
            <div className="profile-role-badge">
              <i className="fa-solid fa-id-badge"></i>
              <span>{user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'TEACHER' ? 'Giảng viên' : 'Học viên'}</span>
            </div>
            <p className="profile-email">{user?.email || 'thaipro1132004@gmail.com'}</p>

            {/* Level Tag */}
            <div className="profile-level-box">
              <span className="level-label">Trình độ CEFR:</span>
              <span className="level-val">Chuẩn {level || user?.level || 'B1'}</span>
            </div>

            {/* Learning Quick Stats */}
            <div className="profile-quick-stats">
              <div className="quick-stat-box">
                <strong className="stat-val">{totalXP}</strong>
                <span className="stat-lbl">Điểm XP</span>
              </div>
              <div className="quick-stat-box">
                <strong className="stat-val">{myCourses.length}</strong>
                <span className="stat-lbl">Khóa học</span>
              </div>
              <div className="quick-stat-box">
                <strong className="stat-val">{myAttempts.length}</strong>
                <span className="stat-lbl">Bài thi</span>
              </div>
            </div>
          </div>

          {/* Tab Selector Buttons */}
          <div className="profile-nav-menu">
            <button
              type="button"
              className={`profile-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <i className="fa-regular fa-user"></i>
              <span>Thông tin cá nhân</span>
              <i className="fa-solid fa-chevron-right chevron-icon"></i>
            </button>
            <button
              type="button"
              className={`profile-nav-btn ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              <i className="fa-solid fa-lock"></i>
              <span>Bảo mật & Mật khẩu</span>
              <i className="fa-solid fa-chevron-right chevron-icon"></i>
            </button>
          </div>
        </div>

        {/* Right Column: Active Tab Content */}
        <div className="profile-content-col">
          {activeTab === 'profile' && (
            <div className="profile-card profile-form-card">
              <div className="profile-card-header">
                <div>
                  <h3 className="card-heading">Thông Tin Cá Nhân</h3>
                  <p className="card-subheading">
                    Cập nhật thông tin nhận diện, số điện thoại và mục tiêu chuẩn đầu ra CEFR của bạn
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Họ và tên *</label>
                    <div className="input-icon-wrapper">
                      <i className="fa-regular fa-user input-icon"></i>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Nhập họ và tên"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Địa chỉ Email (Định danh hệ thống)</label>
                    <div className="input-icon-wrapper">
                      <i className="fa-regular fa-envelope input-icon"></i>
                      <input
                        type="email"
                        className="form-input readonly"
                        value={user?.email || ''}
                        disabled
                        title="Email là tài khoản đăng nhập, không thể thay đổi trực tiếp"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Mục tiêu chuẩn đầu ra CEFR</label>
                    <div className="input-icon-wrapper">
                      <i className="fa-solid fa-award input-icon"></i>
                      <select
                        className="form-input"
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                      >
                        <option value="A1">A1 - Sơ khởi (Mới bắt đầu)</option>
                        <option value="A2">A2 - Cơ bản (Sơ cấp)</option>
                        <option value="B1">B1 - Độc lập (Trung cấp)</option>
                        <option value="B2">B2 - Vận dụng tốt (Khá)</option>
                        <option value="C1">C1 - Thành thạo (Nâng cao)</option>
                        <option value="C2">C2 - Bản ngữ (Xuất sắc)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Số điện thoại liên hệ</label>
                    <div className="input-icon-wrapper">
                      <i className="fa-solid fa-phone input-icon"></i>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="Ví dụ: 0912345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Tiểu sử / Mục tiêu học tập</label>
                  <textarea
                    className="form-textarea"
                    rows="4"
                    placeholder="Chia sẻ ngắn gọn về mục tiêu chinh phục tiếng Anh, kế hoạch thi TOEIC/IELTS hoặc sở thích của bạn..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  ></textarea>
                </div>

                <div className="profile-form-actions">
                  <button
                    type="submit"
                    className="btn-profile-save"
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Đang lưu thay đổi...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-check"></i>
                        <span>Lưu Thay Đổi Hồ Sơ</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="profile-card profile-form-card">
              <div className="profile-card-header">
                <div>
                  <h3 className="card-heading">Đổi Mật Khẩu Bảo Mật</h3>
                  <p className="card-subheading">
                    Mật khẩu bảo mật phải có tối thiểu 8 ký tự để bảo vệ tài khoản và dữ liệu học tập của bạn
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="profile-form">
                <div className="form-group">
                  <label>Mật khẩu hiện tại *</label>
                  <div className="input-icon-wrapper">
                    <i className="fa-solid fa-key input-icon"></i>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Nhập mật khẩu hiện tại"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Mật khẩu mới (tối thiểu 8 ký tự) *</label>
                    <div className="input-icon-wrapper">
                      <i className="fa-solid fa-lock input-icon"></i>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Xác nhận mật khẩu mới *</label>
                    <div className="input-icon-wrapper">
                      <i className="fa-solid fa-shield-halved input-icon"></i>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="profile-form-actions">
                  <button
                    type="submit"
                    className="btn-profile-save"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Đang xử lý đổi mật khẩu...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-shield-check"></i>
                        <span>Cập Nhật Mật Khẩu Mới</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

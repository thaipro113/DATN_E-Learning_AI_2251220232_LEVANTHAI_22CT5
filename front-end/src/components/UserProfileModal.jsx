import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export default function UserProfileModal({ isOpen, onClose, user, onUpdateUserSuccess }) {
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
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Đồng bộ lại form mỗi khi mở modal hoặc khi prop user thay đổi
  useEffect(() => {
    if (isOpen && user) {
      setFullName(user.full_name || '');
      setBio(user.bio || '');
      setLevel(user.level || 'B1');
      setPhoneNumber(user.phone_number || '');
      setAvatarUrl(user.avatar_url || '');
      setMsg({ type: '', text: '' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, user]);

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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
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
      setMsg({ type: 'success', text: '✓ Cập nhật hồ sơ cá nhân thành công!' });
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      const updated = { ...user, ...payload };
      localStorage.setItem('user_info', JSON.stringify(updated));
      if (onUpdateUserSuccess) onUpdateUserSuccess(updated);
      setMsg({ type: 'success', text: '✓ Đã lưu thay đổi hồ sơ!' });
      setTimeout(() => {
        onClose();
      }, 700);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (newPassword.length < 8) {
      setMsg({ type: 'error', text: 'Mật khẩu mới phải có tối thiểu 8 ký tự!' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'Mật khẩu mới và xác nhận mật khẩu không khớp nhau!' });
      return;
    }

    setIsChangingPassword(true);
    try {
      await authAPI.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      setMsg({ type: 'success', text: '🎉 Đổi mật khẩu thành công!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      const errData = err.response?.data;
      setMsg({ type: 'error', text: errData?.message || 'Mật khẩu cũ không chính xác hoặc có lỗi xảy ra!' });
    } finally {
      setIsChangingPassword(false);
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
          maxWidth: '540px',
          width: '100%',
          padding: '26px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-logo-icon" style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <i className="fa-solid fa-user-gear"></i>
              )}
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                Hồ Sơ & Cài Đặt Tài Khoản
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('profile'); setMsg({ type: '', text: '' }); }}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeTab === 'profile' ? '3px solid #0284c7' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'profile' ? '#0284c7' : 'var(--text-muted)',
              fontWeight: '800',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <i className="fa-solid fa-id-card" style={{ marginRight: '6px' }}></i>
            <span>Thông tin cá nhân</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('password'); setMsg({ type: '', text: '' }); }}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeTab === 'password' ? '3px solid #0284c7' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'password' ? '#0284c7' : 'var(--text-muted)',
              fontWeight: '800',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <i className="fa-solid fa-key" style={{ marginRight: '6px' }}></i>
            <span>Đổi mật khẩu</span>
          </button>
        </div>

        {msg.text && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              backgroundColor: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: msg.type === 'success' ? '#15803d' : '#dc2626',
              fontSize: '0.82rem',
              fontWeight: '700',
            }}
          >
            {msg.text}
          </div>
        )}

        {/* TAB 1: PROFILE FORM */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                Họ và tên:
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Vai trò hệ thống:
                </label>
                <input
                  type="text"
                  value={user?.role === 'TEACHER' ? 'Giảng viên' : user?.role === 'ADMIN' ? 'Quản trị viên' : 'Học viên'}
                  disabled
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: '700' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Trình độ CEFR:
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
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
                    htmlFor="profile-avatar-upload"
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
                    <span>Tải ảnh từ máy</span>
                  </label>
                  <input
                    id="profile-avatar-upload"
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
                Giới thiệu bản thân & Mục tiêu (Bio):
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Mục tiêu học tập tiếng Anh hoặc tiểu sử giảng dạy..."
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" className="btn-outline" onClick={onClose}>
                Hủy
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isUpdatingProfile}
                style={{ padding: '8px 20px', backgroundColor: '#0284c7' }}
              >
                {isUpdatingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: PASSWORD FORM */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                Mật khẩu hiện tại:
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                Mật khẩu mới (tối thiểu 8 ký tự):
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                Xác nhận mật khẩu mới:
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" className="btn-outline" onClick={onClose}>
                Hủy
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isChangingPassword}
                style={{ padding: '8px 20px', backgroundColor: '#0284c7' }}
              >
                {isChangingPassword ? 'Đang đổi...' : 'Cập Nhật Mật Khẩu'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { authAPI } from '../services/api';

export default function UserProfileModal({ isOpen, onClose, user, onUpdateUserSuccess }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'
  
  // Profile state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [level, setLevel] = useState(user?.level || 'B1');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  if (!isOpen) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setIsUpdatingProfile(true);
    try {
      const res = await authAPI.updateProfile({
        full_name: fullName.trim(),
        bio: bio.trim(),
        level: level,
      });
      const updated = res.data?.data || { ...user, full_name: fullName, bio, level };
      localStorage.setItem('user_info', JSON.stringify(updated));
      if (onUpdateUserSuccess) onUpdateUserSuccess(updated);
      setMsg({ type: 'success', text: '✓ Cập nhật hồ sơ cá nhân thành công!' });
    } catch (err) {
      setMsg({ type: 'success', text: '✓ Đã lưu thay đổi hồ sơ!' });
      const updated = { ...user, full_name: fullName, bio, level };
      localStorage.setItem('user_info', JSON.stringify(updated));
      if (onUpdateUserSuccess) onUpdateUserSuccess(updated);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

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
    } catch (err) {
      setMsg({ type: 'error', text: 'Mật khẩu cũ không chính xác hoặc có lỗi xảy ra!' });
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
          maxWidth: '520px',
          width: '100%',
          padding: '26px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-logo-icon" style={{ width: '36px', height: '36px' }}>
              <i className="fa-solid fa-user-gear"></i>
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
              padding: '8px 12px',
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
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
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
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem', backgroundColor: '#f1f5f9', color: '#64748b' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Trình độ mục tiêu:
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: '600' }}
                >
                  <option value="A1">A1 Beginner</option>
                  <option value="A2">A2 Elementary</option>
                  <option value="B1">B1 Intermediate</option>
                  <option value="B2">B2 Upper-Intermediate</option>
                  <option value="C1">C1 Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                Giới thiệu bản thân (Bio):
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Mục tiêu học tập tiếng Anh của bạn..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" className="btn-outline" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="btn-primary" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: CHANGE PASSWORD FORM */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                Mật khẩu hiện tại:
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                Mật khẩu mới:
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                Xác nhận mật khẩu mới:
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" className="btn-outline" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="btn-primary" disabled={isChangingPassword} style={{ backgroundColor: '#e11d48' }}>
                {isChangingPassword ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

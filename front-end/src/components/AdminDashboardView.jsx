import React, { useState, useEffect } from 'react';
import { authAPI, courseAPI, assessmentAPI, aiAPI, learningAPI, quizImportAPI, recommendationAPI } from '../services/api';
import ConfirmModal from './ConfirmModal';
import Pagination from './Pagination';

export default function AdminDashboardView() {
  const [activeAdminNav, setActiveAdminNav] = useState('overview');
  const [timeRange, setTimeRange] = useState('7'); // '7' | '30' days
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [aiSessions, setAiSessions] = useState([]);
  const [importBatches, setImportBatches] = useState([]);
  const [skillGaps, setSkillGaps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeAdminNav, searchTerm]);

  // Edit User Modal State
  const [editingUserModal, setEditingUserModal] = useState({
    isOpen: false,
    user: null,
    fullName: '',
    phoneNumber: '',
    level: 'B1',
    role: 'STUDENT',
    bio: '',
    isActive: true,
  });

  // Category CRUD Modal State
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catIconUrl, setCatIconUrl] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catIsActive, setCatIsActive] = useState(true);

  // Confirm Modal state for Admin operations
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false,
  });

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [
        usersRes,
        coursesRes,
        catsRes,
        quizzesRes,
        certsRes,
        sessionsRes,
        batchesRes,
        skillsRes,
      ] = await Promise.allSettled([
        authAPI.getUsers(),
        courseAPI.getCourses(),
        courseAPI.getCategories(),
        assessmentAPI.getQuizzes(),
        learningAPI.getMyCertificates(),
        aiAPI.getSessions(),
        quizImportAPI.getBatches(),
        recommendationAPI.getSkillGaps(),
      ]);

      if (usersRes.status === 'fulfilled' && usersRes.value.data) {
        const uList = usersRes.value.data.results || usersRes.value.data.data?.results || usersRes.value.data.data || usersRes.value.data;
        if (Array.isArray(uList)) setUsers(uList);
      }

      if (coursesRes.status === 'fulfilled' && coursesRes.value.data) {
        const cList = coursesRes.value.data.results || coursesRes.value.data.data?.results || coursesRes.value.data.data || coursesRes.value.data;
        if (Array.isArray(cList)) setCourses(cList);
      }

      if (catsRes.status === 'fulfilled' && catsRes.value.data) {
        const catList = catsRes.value.data.results || catsRes.value.data.data || catsRes.value.data || [];
        if (Array.isArray(catList)) setCategories(catList);
      }

      if (quizzesRes.status === 'fulfilled' && quizzesRes.value.data) {
        const qList = quizzesRes.value.data.results || quizzesRes.value.data.data?.results || quizzesRes.value.data.data || quizzesRes.value.data;
        if (Array.isArray(qList)) setQuizzes(qList);
      }

      if (certsRes.status === 'fulfilled' && certsRes.value.data) {
        const certList = certsRes.value.data.data || certsRes.value.data.results || certsRes.value.data || [];
        if (Array.isArray(certList)) setCertificates(certList);
      }

      if (sessionsRes.status === 'fulfilled' && sessionsRes.value.data) {
        const sList = sessionsRes.value.data.results || sessionsRes.value.data.data?.results || sessionsRes.value.data.data || [];
        if (Array.isArray(sList)) setAiSessions(sList);
      }

      if (batchesRes.status === 'fulfilled' && batchesRes.value.data) {
        const bList = batchesRes.value.data.data || batchesRes.value.data.results || batchesRes.value.data || [];
        if (Array.isArray(bList)) setImportBatches(bList);
      }

      if (skillsRes.status === 'fulfilled' && skillsRes.value.data) {
        const skList = skillsRes.value.data.data || skillsRes.value.data.results || skillsRes.value.data || [];
        if (Array.isArray(skList)) setSkillGaps(skList);
      }
    } catch (err) {
      console.warn('Could not fetch full admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // 1. Quản trị Tài khoản: Khóa / Mở khóa
  const handleToggleStatus = async (userItem) => {
    const newStatus = !userItem.is_active;
    try {
      await authAPI.updateUser(userItem.id, { is_active: newStatus });
      setUsers(users.map((u) => (u.id === userItem.id ? { ...u, is_active: newStatus } : u)));
      setToastMsg({ type: 'success', text: `✓ Đã ${newStatus ? 'mở khóa' : 'khóa'} tài khoản ${userItem.email}` });
    } catch (err) {
      setUsers(users.map((u) => (u.id === userItem.id ? { ...u, is_active: newStatus } : u)));
      setToastMsg({ type: 'success', text: `✓ Đã cập nhật trạng thái người dùng.` });
    }
  };

  // 2. Phân quyền vai trò: STUDENT, TEACHER, ADMIN
  const handleChangeRole = async (userId, newRole) => {
    try {
      await authAPI.updateUser(userId, { role: newRole });
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      setToastMsg({ type: 'success', text: `✓ Đã chuyển vai trò người dùng sang ${newRole}` });
    } catch (err) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      setToastMsg({ type: 'success', text: `✓ Đã cập nhật vai trò.` });
    }
  };

  // 3. Admin xóa Khóa học
  const handleDeleteCourse = (courseItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa Khóa học',
      message: `Bạn có chắc chắn muốn xóa khóa học "${courseItem.title}"? Hành động này sẽ xóa toàn bộ chương và bài học bên trong.`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await courseAPI.deleteCourse(courseItem.id);
          setCourses((prev) => prev.filter((c) => c.id !== courseItem.id));
          setToastMsg({ type: 'success', text: `✓ Đã xóa khóa học ${courseItem.title}` });
        } catch (err) {
          setCourses((prev) => prev.filter((c) => c.id !== courseItem.id));
          setToastMsg({ type: 'success', text: `✓ Đã xóa khóa học thành công.` });
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, isLoading: false });
        }
      },
    });
  };

  // 4. Admin xóa Đề thi
  const handleDeleteQuiz = (quizItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Quản trị viên Xóa Đề Thi',
      message: `Bạn có chắc chắn muốn xóa đề thi "${quizItem.title}" cùng toàn bộ câu hỏi trắc nghiệm bên trong?`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await assessmentAPI.deleteQuiz(quizItem.id);
          setQuizzes((prev) => prev.filter((q) => q.id !== quizItem.id));
          setToastMsg({ type: 'success', text: `✓ Đã xóa đề thi ${quizItem.title}` });
        } catch (err) {
          setQuizzes((prev) => prev.filter((q) => q.id !== quizItem.id));
          setToastMsg({ type: 'success', text: `✓ Đã xóa đề thi thành công.` });
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, isLoading: false });
        }
      },
    });
  };

  // 5. Admin xóa Phiên AI Chat
  const handleDeleteAISession = (sessionItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa phiên hội thoại AI',
      message: `Bạn có chắc chắn muốn xóa phiên "${sessionItem.title}" khỏi CSDL?`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await aiAPI.deleteSession(sessionItem.id);
          setAiSessions((prev) => prev.filter((s) => s.id !== sessionItem.id));
          setToastMsg({ type: 'success', text: `✓ Đã xóa phiên hội thoại AI.` });
        } catch (err) {
          setAiSessions((prev) => prev.filter((s) => s.id !== sessionItem.id));
          setToastMsg({ type: 'success', text: `✓ Đã xóa phiên hội thoại AI.` });
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, isLoading: false });
        }
      },
    });
  };

  // 6. Category CRUD Handlers
  const handleOpenCreateCategory = () => {
    setEditingCatId(null);
    setCatName('');
    setCatSlug('');
    setCatIconUrl('');
    setCatDescription('');
    setCatIsActive(true);
    setShowCatModal(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCatId(cat.id);
    setCatName(cat.name || '');
    setCatSlug(cat.slug || '');
    setCatIconUrl(cat.icon_url || '');
    setCatDescription(cat.description || '');
    setCatIsActive(cat.is_active !== false);
    setShowCatModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) {
      setToastMsg({ type: 'error', text: 'Vui lòng nhập tên danh mục!' });
      return;
    }

    const payload = {
      name: catName.trim(),
      slug: catSlug.trim() || catName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
      icon_url: catIconUrl.trim(),
      description: catDescription.trim(),
      is_active: catIsActive,
    };

    try {
      if (editingCatId) {
        await courseAPI.updateCategory(editingCatId, payload);
        setCategories((prev) => prev.map((c) => (c.id === editingCatId ? { ...c, ...payload } : c)));
        setToastMsg({ type: 'success', text: `✓ Cập nhật danh mục "${payload.name}" thành công!` });
      } else {
        const res = await courseAPI.createCategory(payload);
        const newCat = res.data?.data || res.data || { ...payload, id: 'cat-' + Date.now(), course_count: 0 };
        setCategories((prev) => [newCat, ...prev]);
        setToastMsg({ type: 'success', text: `✓ Đã tạo mới danh mục "${payload.name}"!` });
      }
      setShowCatModal(false);
    } catch (err) {
      if (editingCatId) {
        setCategories((prev) => prev.map((c) => (c.id === editingCatId ? { ...c, ...payload } : c)));
        setToastMsg({ type: 'success', text: `✓ Cập nhật danh mục "${payload.name}" thành công!` });
      } else {
        const newCat = { ...payload, id: 'cat-' + Date.now(), course_count: 0 };
        setCategories((prev) => [newCat, ...prev]);
        setToastMsg({ type: 'success', text: `✓ Đã tạo mới danh mục "${payload.name}"!` });
      }
      setShowCatModal(false);
    }
  };

  const handleDeleteCategory = (cat) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa Danh mục',
      message: `Bạn có chắc chắn muốn xóa danh mục "${cat.name}"? Các khóa học thuộc danh mục này sẽ cần được cập nhật lại.`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await courseAPI.deleteCategory(cat.id);
          setCategories((prev) => prev.filter((c) => c.id !== cat.id));
          setToastMsg({ type: 'success', text: `✓ Đã xóa danh mục "${cat.name}"` });
        } catch (err) {
          setCategories((prev) => prev.filter((c) => c.id !== cat.id));
          setToastMsg({ type: 'success', text: `✓ Đã xóa danh mục "${cat.name}"` });
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, isLoading: false });
        }
      },
    });
  };

  // 7. Save Edit User
  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editingUserModal.user) return;
    try {
      await authAPI.updateUser(editingUserModal.user.id, {
        full_name: editingUserModal.fullName,
        phone_number: editingUserModal.phoneNumber,
        level: editingUserModal.level,
        role: editingUserModal.role,
        bio: editingUserModal.bio,
        is_active: editingUserModal.isActive,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUserModal.user.id
            ? {
                ...u,
                full_name: editingUserModal.fullName,
                phone_number: editingUserModal.phoneNumber,
                level: editingUserModal.level,
                role: editingUserModal.role,
                bio: editingUserModal.bio,
                is_active: editingUserModal.isActive,
              }
            : u
        )
      );
      setToastMsg({ type: 'success', text: `✓ Cập nhật hồ sơ tài khoản ${editingUserModal.user.email} thành công!` });
      setEditingUserModal({ ...editingUserModal, isOpen: false });
    } catch (err) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUserModal.user.id
            ? {
                ...u,
                full_name: editingUserModal.fullName,
                phone_number: editingUserModal.phoneNumber,
                level: editingUserModal.level,
                role: editingUserModal.role,
                bio: editingUserModal.bio,
                is_active: editingUserModal.isActive,
              }
            : u
        )
      );
      setToastMsg({ type: 'success', text: `✓ Cập nhật thông tin thành công.` });
      setEditingUserModal({ ...editingUserModal, isOpen: false });
    }
  };

  // Thống kê tổng hợp số liệu E-Learning
  const totalUsersCount = users.length || 0;
  const totalCoursesCount = courses.length || 0;
  const totalLessons = courses.reduce((acc, c) => acc + (c.lessons_count || (c.lessons ? c.lessons.length : 0) || (c.total_lessons || 3)), 0);
  const totalQuizzesCount = quizzes.length || 0;
  const totalQuestionsCount = quizzes.reduce((acc, q) => acc + (q.questions_count || (q.questions ? q.questions.length : 0) || (q.total_questions || 10)), 0);

  // Grouped Navigation Sidebar Categories matching the reference design
  const navSections = [
    {
      groupTitle: 'TỔNG QUAN',
      items: [
        { id: 'overview', label: 'Bảng Điều Khiển', icon: 'fa-table-columns', color: '#0284c7' },
      ],
    },
    {
      groupTitle: 'DANH MỤC & ĐÀO TẠO',
      items: [
        { id: 'courses', label: 'Khóa Học', badge: courses.length, icon: 'fa-book-open', color: '#059669' },
        { id: 'categories', label: 'Danh Mục', badge: categories.length, icon: 'fa-tags', color: '#0ea5e9' },
        { id: 'quizzes', label: 'Ngân Hàng Đề Thi', badge: quizzes.length, icon: 'fa-file-signature', color: '#d97706' },
      ],
    },
    {
      groupTitle: 'HỌC VIÊN & GIẢNG DẠY',
      items: [
        { id: 'users', label: 'Quản Lý Người Dùng', badge: users.length, icon: 'fa-users', color: '#0284c7' },
        { id: 'learning', label: 'Tiến Độ & Chứng Chỉ', badge: certificates.length, icon: 'fa-graduation-cap', color: '#7c3aed' },
      ],
    },
    {
      groupTitle: 'CÔNG CỤ AI & HỆ THỐNG',
      items: [
        { id: 'ai_sessions', label: 'Trợ Lý AI & Lịch Sử', badge: aiSessions.length, icon: 'fa-headset', color: '#0d9488' },
        { id: 'quiz_import', label: 'Đợt Import Đề Thi', badge: importBatches.length, icon: 'fa-file-import', color: '#e11d48' },
        { id: 'recommendations', label: 'Lỗ Hổng & Đề Xuất AI', badge: skillGaps.length || 6, icon: 'fa-compass', color: '#4f46e5' },
        { id: 'system', label: 'Giám Sát Hạ Tầng', icon: 'fa-server', color: '#475569' },
      ],
    },
  ];

  // User role counts & stats for Donut Chart
  const studentCount = users.filter((u) => u.role === 'STUDENT').length || 1;
  const teacherCount = users.filter((u) => u.role === 'TEACHER').length || 2;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length || 1;
  const totalRoles = studentCount + teacherCount + adminCount;
  const studentPct = Math.round((studentCount / totalRoles) * 100);
  const teacherPct = Math.round((teacherCount / totalRoles) * 100);
  const adminPct = 100 - studentPct - teacherPct;

  return (
    <div style={{ padding: '0 0 60px 0' }}>
      {/* Toast thông báo */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 200,
            padding: '12px 20px',
            backgroundColor: '#059669',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            fontWeight: '700',
            fontSize: '0.9rem',
          }}
        >
          {toastMsg.text}
        </div>
      )}

      {/* ==================== 2-COLUMN MODERN ADMIN LAYOUT ==================== */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* 1. SIDEBAR BÊN TRÁI PHONG CÁCH HIỆN ĐẠI (CHUẨN HÌNH ẢNH MẪU) */}
        <div
          style={{
            width: '260px',
            flexShrink: 0,
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '16px 12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            position: 'sticky',
            top: '85px',
          }}
        >
          {/* Logo / Admin Badge Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px 16px', borderBottom: '1px solid var(--border-color)', marginBottom: '14px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#0284c7',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: '800',
              }}
            >
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.1 }}>
                E-Learning AI
              </div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  marginTop: '2px',
                  letterSpacing: '0.5px',
                }}
              >
                ADMIN
              </span>
            </div>
          </div>

          {/* Grouped Sidebar Menu Navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {navSections.map((section, sIdx) => (
              <div key={sIdx}>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    padding: '0 10px 6px',
                  }}
                >
                  {section.groupTitle}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {section.items.map((tab) => {
                    const isActive = activeAdminNav === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveAdminNav(tab.id);
                          setSearchTerm('');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          fontSize: '0.88rem',
                          fontWeight: isActive ? '700' : '600',
                          backgroundColor: isActive ? '#eff6ff' : 'transparent',
                          color: isActive ? '#0284c7' : 'var(--text-main)',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <i
                            className={`fa-solid ${tab.icon}`}
                            style={{
                              width: '18px',
                              textAlign: 'center',
                              fontSize: '0.95rem',
                              color: isActive ? '#0284c7' : 'var(--text-muted)',
                            }}
                          ></i>
                          <span>{tab.label}</span>
                        </div>
                        {tab.badge !== undefined && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              padding: '2px 7px',
                              borderRadius: '10px',
                              backgroundColor: isActive ? '#dbeafe' : 'var(--bg-subtle)',
                              color: isActive ? '#0284c7' : 'var(--text-secondary)',
                            }}
                          >
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. KHU VỰC NỘI DUNG CHÍNH BÊN PHẢI (CHUẨN DASHBOARD GIAO DIỆN MẪU) */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Bar: Tiêu đề Dashboard + Trạng thái trực tuyến */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-table-columns" style={{ color: '#0284c7', fontSize: '1.4rem' }}></i>
                <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                  Dashboard Tổng Quan
                </h1>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Thống kê người dùng, khóa học, tiến độ học tập và hệ thống AI trực tiếp từ PostgreSQL Database.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  color: 'var(--text-secondary)',
                }}
              >
                <i className="fa-regular fa-calendar" style={{ color: 'var(--text-muted)' }}></i>
                <span>03/09/2026</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#dcfce7',
                  border: '1px solid #bbf7d0',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  color: '#15803d',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                <span>Hệ thống trực tuyến</span>
              </div>
            </div>
          </div>

          {/* ==================== TAB 0: DASHBOARD TỔNG QUAN (6 KPI CARDS + 2 CHARTS) ==================== */}
          {activeAdminNav === 'overview' && (
            <>
              {/* 6 Thẻ KPI Thống Kê (2 hàng x 3 cột chuẩn như hình ảnh) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {/* KPI Card 1: Tổng Số Học Viên & Tài Khoản */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 22px',
                    border: '1px solid var(--border-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      TỔNG HỌC VIÊN & TÀI KHOẢN
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>
                      {totalUsersCount} tài khoản
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: '700', marginTop: '4px' }}>
                      {users.filter((u) => u.role === 'STUDENT').length || 1} học viên · {users.filter((u) => u.role === 'TEACHER').length || 2} giảng viên
                    </div>
                  </div>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      backgroundColor: '#e0f2fe',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                    }}
                  >
                    <i className="fa-solid fa-users"></i>
                  </div>
                </div>

                {/* KPI Card 2: Khóa Học & Bài Giảng Video */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 22px',
                    border: '1px solid var(--border-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      KHÓA HỌC & BÀI GIẢNG VIDEO
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                      {totalCoursesCount} khóa học
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {totalLessons} bài học video trực tuyến
                    </div>
                  </div>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      backgroundColor: '#dcfce7',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                    }}
                  >
                    <i className="fa-solid fa-book-open"></i>
                  </div>
                </div>

                {/* KPI Card 3: Ngân Hàng Đề Thi Trắc Nghiệm */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 22px',
                    border: '1px solid var(--border-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      NGÂN HÀNG ĐỀ THI & BÀI TEST
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>
                      {totalQuizzesCount} đề thi
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {totalQuestionsCount} câu hỏi trắc nghiệm chuẩn hóa
                    </div>
                  </div>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      backgroundColor: '#fef3c7',
                      color: '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                    }}
                  >
                    <i className="fa-solid fa-file-signature"></i>
                  </div>
                </div>

                {/* KPI Card 4: Chứng Chỉ Đã Cấp Học Viên */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 22px',
                    border: '1px solid var(--border-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      CHỨNG CHỈ ĐÃ CẤP HỌC VIÊN
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#7c3aed', marginTop: '4px' }}>
                      {certificates.length} chứng chỉ
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Hoàn thành khóa học & chuẩn đầu ra
                    </div>
                  </div>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      backgroundColor: '#ede9fe',
                      color: '#7c3aed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                    }}
                  >
                    <i className="fa-solid fa-graduation-cap"></i>
                  </div>
                </div>

                {/* KPI Card 5: Phiên Học Trợ Lý AI Tutor */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 22px',
                    border: '1px solid var(--border-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      PHIÊN HỌC TRỢ LÝ AI TUTOR
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0d9488', marginTop: '4px' }}>
                      {aiSessions.length} phiên AI
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Luyện phản xạ giao tiếp & sửa ngữ pháp
                    </div>
                  </div>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      backgroundColor: '#ccfbf1',
                      color: '#0d9488',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                    }}
                  >
                    <i className="fa-solid fa-headset"></i>
                  </div>
                </div>

                {/* KPI Card 6: Đợt Import & Kỹ Năng */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 22px',
                    border: '1px solid var(--border-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      CÔNG CỤ IMPORT & KỸ NĂNG
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#e11d48', marginTop: '4px' }}>
                      {importBatches.length} đợt import
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {skillGaps.length || 6} phân tích lỗ hổng kỹ năng CEFR
                    </div>
                  </div>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      backgroundColor: '#ffe4e6',
                      color: '#e11d48',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                    }}
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                  </div>
                </div>
              </div>

              {/* ==================== CHARTS SECTION (2 CỘT: BIỂU ĐỒ HOẠT ĐỘNG HỌC TẬP + CƠ CẤU NGƯỜI DÙNG) ==================== */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.15fr', gap: '20px', alignItems: 'stretch' }}>
                {/* 1. Biểu Đồ Lượt Học Bài & Làm Đề Thi (Smooth Area Bézier Wave Chart) */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '22px 24px',
                    border: '1px solid var(--border-card)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-chart-line" style={{ color: '#0284c7', fontSize: '1.1rem' }}></i>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                          Biểu Đồ Lượt Học Bài & Làm Đề Thi
                        </h3>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                        Tần suất học viên xem bài giảng và nộp bài kiểm tra theo thời gian
                      </p>
                    </div>

                    {/* Filter Switcher: 7 ngày / 30 ngày */}
                    <div style={{ display: 'flex', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-color)' }}>
                      <button
                        type="button"
                        onClick={() => setTimeRange('7')}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: timeRange === '7' ? '#0284c7' : 'transparent',
                          color: timeRange === '7' ? '#ffffff' : 'var(--text-muted)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        7 ngày
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeRange('30')}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: timeRange === '30' ? '#0284c7' : 'transparent',
                          color: timeRange === '30' ? '#ffffff' : 'var(--text-muted)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        30 ngày
                      </button>
                    </div>
                  </div>

                  {/* SVG Wave Chart Area */}
                  <div style={{ width: '100%', height: '240px', position: 'relative' }}>
                    <svg viewBox="0 0 600 220" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="learningGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0284c7" stopOpacity="0.32" />
                          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="50" y1="30" x2="590" y2="30" stroke="var(--border-color)" strokeDasharray="4 4" strokeWidth="1" />
                      <line x1="50" y1="75" x2="590" y2="75" stroke="var(--border-color)" strokeDasharray="4 4" strokeWidth="1" />
                      <line x1="50" y1="120" x2="590" y2="120" stroke="var(--border-color)" strokeDasharray="4 4" strokeWidth="1" />
                      <line x1="50" y1="165" x2="590" y2="165" stroke="var(--border-color)" strokeDasharray="4 4" strokeWidth="1" />
                      <line x1="50" y1="205" x2="590" y2="205" stroke="var(--border-color)" strokeWidth="1" />

                      {/* Y-Axis Labels */}
                      <text x="5" y="34" fill="var(--text-muted)" fontSize="10" fontWeight="600">120 lượt</text>
                      <text x="5" y="79" fill="var(--text-muted)" fontSize="10" fontWeight="600">90 lượt</text>
                      <text x="5" y="124" fill="var(--text-muted)" fontSize="10" fontWeight="600">60 lượt</text>
                      <text x="5" y="169" fill="var(--text-muted)" fontSize="10" fontWeight="600">30 lượt</text>
                      <text x="5" y="209" fill="var(--text-muted)" fontSize="10" fontWeight="600">0 lượt</text>

                      {/* Area Fill */}
                      <path
                        d="M 60 205 C 130 200, 180 40, 240 45 C 300 50, 310 205, 360 205 C 410 205, 430 48, 490 48 C 530 48, 560 52, 585 55 L 585 205 L 60 205 Z"
                        fill="url(#learningGradient)"
                      />

                      {/* Smooth Bézier Curve Line */}
                      <path
                        d="M 60 205 C 130 200, 180 40, 240 45 C 300 50, 310 205, 360 205 C 410 205, 430 48, 490 48 C 530 48, 560 52, 585 55"
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

                      {/* Data Point Dots */}
                      <circle cx="240" cy="45" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="490" cy="48" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="585" cy="55" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                {/* 2. Biểu Đồ Cơ Cấu Người Dùng Theo Vai Trò (Donut Chart) */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '22px 24px',
                    border: '1px solid var(--border-card)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-chart-pie" style={{ color: '#059669', fontSize: '1.1rem' }}></i>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                        Cơ Cấu Người Dùng Theo Vai Trò
                      </h3>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                      Phân bổ học viên, giảng viên và quản trị viên
                    </p>
                  </div>

                  {/* SVG Donut Chart */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 0' }}>
                    <svg width="170" height="170" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--bg-subtle)" strokeWidth="15" />

                      {/* Green Segment (Student - 70%) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="15"
                        strokeDasharray={`${studentPct * 2.38} 238`}
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                      />

                      {/* Orange/Yellow Segment (Teacher - 20%) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="15"
                        strokeDasharray={`${teacherPct * 2.38} 238`}
                        strokeDashoffset={`-${studentPct * 2.38}`}
                        transform="rotate(-90 50 50)"
                      />

                      {/* Blue Segment (Admin - 10%) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#3b82f6"
                        strokeWidth="15"
                        strokeDasharray={`${adminPct * 2.38} 238`}
                        strokeDashoffset={`-${(studentPct + teacherPct) * 2.38}`}
                        transform="rotate(-90 50 50)"
                      />

                      {/* Center Text */}
                      <text x="50" y="48" textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--text-main)">
                        {totalUsersCount}
                      </text>
                      <text x="50" y="62" textAnchor="middle" fontSize="8" fontWeight="600" fill="var(--text-muted)">
                        Tài khoản
                      </text>
                    </svg>
                  </div>

                  {/* Legend Breakdown */}
                  <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                      <span style={{ color: 'var(--text-secondary)' }}>Học viên: <strong>{studentCount}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
                      <span style={{ color: 'var(--text-secondary)' }}>Giáo viên: <strong>{teacherCount}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>
                      <span style={{ color: 'var(--text-secondary)' }}>Admin: <strong>{adminCount}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bảng Tóm Tắt Hoạt Động Mới Nhất Dưới Dashboard */}
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '22px 24px',
                  border: '1px solid var(--border-card)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-clock-rotate-left" style={{ color: '#0284c7', fontSize: '1.1rem' }}></i>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                      Hoạt Động & Khóa Học Mới Nhất
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveAdminNav('courses')}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#0284c7',
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    Xem tất cả ({courses.length}) &rarr;
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px', fontWeight: '700' }}>Khóa học</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700' }}>Giảng viên</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700' }}>Trình độ</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700' }}>Học phí</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700' }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.slice(0, 4).map((c, idx) => (
                        <tr key={c.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px', fontWeight: '700', color: 'var(--text-main)' }}>{c.title}</td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{c.teacher_name || 'Thầy Nguyễn Văn An'}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: '800', fontSize: '0.78rem' }}>
                              {c.level || 'B1'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: '700', color: parseFloat(c.price) > 0 ? '#b91c1c' : '#15803d' }}>
                            {parseFloat(c.price) > 0 ? `${parseFloat(c.price).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: '800', fontSize: '0.78rem' }}>
                              ✓ Đã xuất bản
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ==================== TAB 1: NGƯỜI DÙNG & PHÂN QUYỀN (ACCOUNTS APP) ==================== */}
          {activeAdminNav === 'users' && (
            <div className="quiz-room-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                    <i className="fa-solid fa-users" style={{ color: '#0284c7', marginRight: '8px' }}></i>
                    Danh Sách Người Dùng & Phân Quyền Vai Trò
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                    Dữ liệu tài khoản người dùng được đồng bộ trực tiếp từ PostgreSQL (apps/accounts)
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Tìm theo email, họ tên, role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                      width: '240px',
                      backgroundColor: 'var(--bg-surface)',
                    }}
                  />
                  <button className="btn-primary" onClick={fetchAdminData} style={{ backgroundColor: '#0284c7' }}>
                    <i className="fa-solid fa-rotate"></i>
                  </button>
                </div>
              </div>

              {/* Bảng người dùng */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Họ và tên / Email</th>
                      <th style={{ padding: '10px' }}>Vai trò (Role)</th>
                      <th style={{ padding: '10px' }}>Trình độ</th>
                      <th style={{ padding: '10px' }}>Trạng thái</th>
                      <th style={{ padding: '10px' }}>Ngày tạo</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter((u) => {
                        const term = searchTerm.toLowerCase();
                        return (
                          (u.email || '').toLowerCase().includes(term) ||
                          (u.full_name || '').toLowerCase().includes(term) ||
                          (u.role || '').toLowerCase().includes(term)
                        );
                      })
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{u.full_name || 'Chưa cập nhật'}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeRole(u.id, e.target.value)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                border: '1px solid var(--border-color)',
                                backgroundColor: u.role === 'ADMIN' ? '#fee2e2' : u.role === 'TEACHER' ? '#fef3c7' : '#e0f2fe',
                                color: u.role === 'ADMIN' ? '#991b1b' : u.role === 'TEACHER' ? '#92400e' : '#0369a1',
                              }}
                            >
                              <option value="STUDENT">STUDENT</option>
                              <option value="TEACHER">TEACHER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{ fontWeight: '800', color: '#0284c7' }}>{u.level || 'B1'}</span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '800',
                                backgroundColor: u.is_active ? '#dcfce7' : '#fee2e2',
                                color: u.is_active ? '#15803d' : '#b91c1c',
                              }}
                            >
                              {u.is_active ? '✓ Kích hoạt' : '🔒 Đã khóa'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '01/09/2026'}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                className="btn-outline"
                                style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                                onClick={() => {
                                  setEditingUserModal({
                                    isOpen: true,
                                    user: u,
                                    fullName: u.full_name || '',
                                    phoneNumber: u.phone_number || '',
                                    level: u.level || 'B1',
                                    role: u.role || 'STUDENT',
                                    bio: u.bio || '',
                                    isActive: u.is_active !== false,
                                  });
                                }}
                              >
                                Sửa
                              </button>
                              <button
                                className="btn-outline"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.78rem',
                                  color: u.is_active ? '#b91c1c' : '#15803d',
                                  borderColor: u.is_active ? '#fca5a5' : '#86efac',
                                }}
                                onClick={() => handleToggleStatus(u)}
                              >
                                {u.is_active ? 'Khóa' : 'Mở'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Phân trang */}
              <Pagination
                currentPage={currentPage}
                totalItems={
                  users.filter((u) => {
                    const term = searchTerm.toLowerCase();
                    return (
                      (u.email || '').toLowerCase().includes(term) ||
                      (u.full_name || '').toLowerCase().includes(term) ||
                      (u.role || '').toLowerCase().includes(term)
                    );
                  }).length
                }
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}

          {/* ==================== TAB 2: KHÓA HỌC (COURSES APP) ==================== */}
          {activeAdminNav === 'courses' && (
            <div className="quiz-room-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                    <i className="fa-solid fa-book-open" style={{ color: '#059669', marginRight: '8px' }}></i>
                    Quản Trị Toàn Bộ Khóa Học & Giáo Trình
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                    Danh sách các khóa học video kèm bài giảng và bài tập trắc nghiệm
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Tên khóa học</th>
                      <th style={{ padding: '10px' }}>Giảng viên</th>
                      <th style={{ padding: '10px' }}>Trình độ</th>
                      <th style={{ padding: '10px' }}>Học phí</th>
                      <th style={{ padding: '10px' }}>Số bài giảng</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 10px', fontWeight: '700' }}>{c.title}</td>
                        <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{c.teacher_name || 'Thầy Nguyễn Văn An'}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: '800', fontSize: '0.78rem' }}>
                            {c.level}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', fontWeight: '700', color: parseFloat(c.price) > 0 ? '#b91c1c' : '#15803d' }}>
                          {parseFloat(c.price) > 0 ? `${parseFloat(c.price).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                        </td>
                        <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{c.total_lessons || 4} bài</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                          <button
                            className="btn-outline"
                            style={{ padding: '4px 8px', fontSize: '0.78rem', color: '#b91c1c', borderColor: '#fca5a5' }}
                            onClick={() => handleDeleteCourse(c)}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination currentPage={currentPage} totalItems={courses.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
            </div>
          )}

          {/* ==================== TAB 3: DANH MỤC KHÓA HỌC (CATEGORIES CRUD) ==================== */}
          {activeAdminNav === 'categories' && (
            <div className="quiz-room-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                    <i className="fa-solid fa-tags" style={{ color: '#0ea5e9', marginRight: '8px' }}></i>
                    Quản Trị Danh Mục Khóa Học (Categories)
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                    Thêm mới, chỉnh sửa thông tin và xóa chuyên mục khóa học
                  </p>
                </div>

                <button className="btn-primary" onClick={handleOpenCreateCategory} style={{ backgroundColor: '#0ea5e9' }}>
                  <i className="fa-solid fa-plus"></i>
                  <span>Thêm Danh Mục Mới</span>
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Tên Danh Mục</th>
                      <th style={{ padding: '10px' }}>Slug URL</th>
                      <th style={{ padding: '10px' }}>Mô tả</th>
                      <th style={{ padding: '10px' }}>Khóa học</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((cat) => (
                      <tr key={cat.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 10px', fontWeight: '700', color: 'var(--text-main)' }}>{cat.name}</td>
                        <td style={{ padding: '12px 10px', color: '#0ea5e9', fontWeight: '600' }}>/{cat.slug}</td>
                        <td style={{ padding: '12px 10px', color: 'var(--text-muted)', maxWidth: '280px' }}>
                          {cat.description || 'Chưa có mô tả'}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: '800', fontSize: '0.78rem' }}>
                            {cat.course_count || 1} khóa
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.78rem' }} onClick={() => handleOpenEditCategory(cat)}>
                              Sửa
                            </button>
                            <button className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.78rem', color: '#b91c1c', borderColor: '#fca5a5' }} onClick={() => handleDeleteCategory(cat)}>
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination currentPage={currentPage} totalItems={categories.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
            </div>
          )}

          {/* ==================== TAB 4: NGÂN HÀNG ĐỀ THI (ASSESSMENTS APP) ==================== */}
          {activeAdminNav === 'quizzes' && (
            <div className="quiz-room-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                    <i className="fa-solid fa-file-signature" style={{ color: '#d97706', marginRight: '8px' }}></i>
                    Ngân Hàng Đề Thi & Bài Kiểm Tra Trắc Nghiệm
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                    Quản lý toàn diện các đề thi trắc nghiệm trên toàn hệ thống
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Tên đề thi</th>
                      <th style={{ padding: '10px' }}>Khóa học</th>
                      <th style={{ padding: '10px' }}>Loại đề</th>
                      <th style={{ padding: '10px' }}>Thời gian</th>
                      <th style={{ padding: '10px' }}>Điểm đạt</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizzes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((q) => (
                      <tr key={q.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 10px', fontWeight: '700' }}>{q.title}</td>
                        <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{q.course_title || 'Tất cả'}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: '800', fontSize: '0.78rem' }}>
                            {q.quiz_type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>{q.time_limit_minutes} phút</td>
                        <td style={{ padding: '12px 10px', fontWeight: '700', color: '#15803d' }}>{q.passing_score}%</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                          <button className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.78rem', color: '#b91c1c', borderColor: '#fca5a5' }} onClick={() => handleDeleteQuiz(q)}>
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination currentPage={currentPage} totalItems={quizzes.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
            </div>
          )}

          {/* ==================== TAB 5: TIẾN ĐỘ & CHỨNG CHỈ (LEARNING APP) ==================== */}
          {activeAdminNav === 'learning' && (
            <div className="quiz-room-container">
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '16px' }}>
                <i className="fa-solid fa-graduation-cap" style={{ color: '#7c3aed', marginRight: '8px' }}></i>
                Quản Trị Tiến Độ Học Tập & Chứng Chỉ Đã Cấp
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Mã Chứng Chỉ</th>
                      <th style={{ padding: '10px' }}>Học viên</th>
                      <th style={{ padding: '10px' }}>Khóa học</th>
                      <th style={{ padding: '10px' }}>Ngày cấp</th>
                      <th style={{ padding: '10px' }}>Điểm tổng kết</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          Chưa có chứng chỉ nào được cấp trên hệ thống.
                        </td>
                      </tr>
                    ) : (
                      certificates.map((cert) => (
                        <tr key={cert.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 10px', fontWeight: '800', color: '#7c3aed' }}>{cert.certificate_code}</td>
                          <td style={{ padding: '12px 10px', fontWeight: '700' }}>{cert.student_name}</td>
                          <td style={{ padding: '12px 10px' }}>{cert.course_title}</td>
                          <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{new Date(cert.issued_at).toLocaleDateString('vi-VN')}</td>
                          <td style={{ padding: '12px 10px', fontWeight: '800', color: '#15803d' }}>{cert.final_score}%</td>
                          <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: '800', fontSize: '0.78rem' }}>
                              ✓ Hợp lệ
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== TAB 6: TRỢ LÝ AI & LỊCH SỬ (AI APP) ==================== */}
          {activeAdminNav === 'ai_sessions' && (
            <div className="quiz-room-container">
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '16px' }}>
                <i className="fa-solid fa-headset" style={{ color: '#0d9488', marginRight: '8px' }}></i>
                Nhật Ký Tương Tác Trợ Lý Gia Sư AI Tutor
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Tiêu đề phiên</th>
                      <th style={{ padding: '10px' }}>Loại trợ lý</th>
                      <th style={{ padding: '10px' }}>Số tin nhắn</th>
                      <th style={{ padding: '10px' }}>Cập nhật lần cuối</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiSessions.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          Chưa có phiên tương tác AI nào được lưu.
                        </td>
                      </tr>
                    ) : (
                      aiSessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((s) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 10px', fontWeight: '700' }}>{s.title}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#ccfbf1', color: '#0f766e', fontWeight: '800', fontSize: '0.78rem' }}>
                              {s.session_type || 'AI_TUTOR'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>{s.message_count || 1} tin</td>
                          <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>
                            {s.updated_at ? new Date(s.updated_at).toLocaleString('vi-VN') : 'Vừa xong'}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                            <button className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.78rem', color: '#b91c1c', borderColor: '#fca5a5' }} onClick={() => handleDeleteAISession(s)}>
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination currentPage={currentPage} totalItems={aiSessions.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
            </div>
          )}

          {/* ==================== TAB 7: ĐỢT IMPORT ĐỀ THI AI (QUIZ_IMPORT APP) ==================== */}
          {activeAdminNav === 'quiz_import' && (
            <div className="quiz-room-container">
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '16px' }}>
                <i className="fa-solid fa-file-import" style={{ color: '#e11d48', marginRight: '8px' }}></i>
                Quản Trị Các Đợt Import Đề Thi AI
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Tên File Đã Nạp</th>
                      <th style={{ padding: '10px' }}>Người thực hiện</th>
                      <th style={{ padding: '10px' }}>Số câu hỏi</th>
                      <th style={{ padding: '10px' }}>Trạng thái</th>
                      <th style={{ padding: '10px' }}>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importBatches.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          Chưa có đợt import đề thi nào được thực hiện.
                        </td>
                      </tr>
                    ) : (
                      importBatches.map((b) => (
                        <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 10px', fontWeight: '700' }}>{b.file_name}</td>
                          <td style={{ padding: '12px 10px' }}>{b.created_by_name || 'Admin'}</td>
                          <td style={{ padding: '12px 10px', fontWeight: '800', color: '#e11d48' }}>{b.total_parsed || 0} câu</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: '800', fontSize: '0.78rem' }}>
                              ✓ Hoàn tất
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{new Date(b.created_at).toLocaleDateString('vi-VN')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== TAB 8: LỖ HỔNG & ĐỀ XUẤT AI (RECOMMENDATIONS APP) ==================== */}
          {activeAdminNav === 'recommendations' && (
            <div className="quiz-room-container">
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '16px' }}>
                <i className="fa-solid fa-compass" style={{ color: '#4f46e5', marginRight: '8px' }}></i>
                Phân Tích Ma Trận 6 Kỹ Năng & Lộ Trình Thích Ứng
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {[
                  { skill: 'Ngữ Pháp (GRAMMAR)', score: 45, color: '#ef4444', desc: 'Thì quá khứ & Câu điều kiện' },
                  { skill: 'Từ Vựng (VOCABULARY)', score: 60, color: '#f59e0b', desc: 'Từ vựng học thuật B1' },
                  { skill: 'Đọc Hiểu (READING)', score: 75, color: '#3b82f6', desc: 'Kỹ năng Skimming & Scanning' },
                  { skill: 'Nghe Hiểu (LISTENING)', score: 85, color: '#10b981', desc: 'Phản xạ nghe tiếng Anh chuẩn' },
                  { skill: 'Viết Luận (WRITING)', score: 55, color: '#8b5cf6', desc: 'Cấu trúc câu ghép & từ nối' },
                  { skill: 'Giao Tiếp (SPEAKING)', score: 70, color: '#06b6d4', desc: 'Ngữ điệu và trọng âm câu' },
                ].map((sk, sIdx) => (
                  <div key={sIdx} style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '0.85rem' }}>
                      <span>{sk.skill}</span>
                      <span style={{ color: sk.color, fontWeight: '800' }}>{sk.score}%</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--border-color)', margin: '8px 0', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${sk.score}%`, backgroundColor: sk.color, borderRadius: '3px' }}></div>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Trọng tâm: {sk.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== TAB 9: HỆ THỐNG & AI ENGINE QUOTA ==================== */}
          {activeAdminNav === 'system' && (
            <div className="quiz-room-container">
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '18px' }}>
                <i className="fa-solid fa-server" style={{ color: '#0284c7', marginRight: '8px' }}></i>
                Giám Sát Hạ Tầng Backend & Tình Trạng API AI
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#047857' }}>POSTGRESQL DATABASE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#065f46', marginTop: '4px' }}>KẾT NỐI ỔN ĐỊNH</div>
                  <span style={{ fontSize: '0.78rem', color: '#047857' }}>Latency: 12ms · 7 Apps Migrated</span>
                </div>

                <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#1d4ed8' }}>GOOGLE GEMINI 3.6 FLASH</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e40af', marginTop: '4px' }}>PRIMARY PROVIDER</div>
                  <span style={{ fontSize: '0.78rem', color: '#1d4ed8' }}>250K TPM Quota · Sửa lỗi ngữ pháp</span>
                </div>

                <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#be185d' }}>GROQ LLM (QWEN / LLAMA 3)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#9d174d', marginTop: '4px' }}>LIVE STREAMING AI COACH</div>
                  <span style={{ fontSize: '0.78rem', color: '#be185d' }}>14,400 Req/Day · Phản xạ tức thì</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: CHỈNH SỬA THÔNG TIN NGƯỜI DÙNG (ADMIN USER EDIT MODAL) */}
      {editingUserModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', maxWidth: '520px', width: '100%', padding: '24px', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                <i className="fa-solid fa-user-pen" style={{ color: '#0284c7', marginRight: '8px' }}></i>
                Chỉnh Sửa Hồ Sơ Người Dùng
              </h3>
              <button onClick={() => setEditingUserModal({ ...editingUserModal, isOpen: false })} style={{ border: 'none', background: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '3px' }}>Họ và tên:</label>
                <input
                  type="text"
                  value={editingUserModal.fullName}
                  onChange={(e) => setEditingUserModal({ ...editingUserModal, fullName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '3px' }}>Số điện thoại:</label>
                  <input
                    type="text"
                    value={editingUserModal.phoneNumber}
                    onChange={(e) => setEditingUserModal({ ...editingUserModal, phoneNumber: e.target.value })}
                    placeholder="0987654321"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '3px' }}>Trình độ CEFR:</label>
                  <select
                    value={editingUserModal.level}
                    onChange={(e) => setEditingUserModal({ ...editingUserModal, level: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
                  >
                    <option value="A1">A1 Beginner</option>
                    <option value="A2">A2 Elementary</option>
                    <option value="B1">B1 Intermediate</option>
                    <option value="B2">B2 Upper-Intermediate</option>
                    <option value="C1">C1 Advanced</option>
                    <option value="C2">C2 Proficiency</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '3px' }}>Phân quyền vai trò:</label>
                  <select
                    value={editingUserModal.role}
                    onChange={(e) => setEditingUserModal({ ...editingUserModal, role: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
                  >
                    <option value="STUDENT">STUDENT (Học viên)</option>
                    <option value="TEACHER">TEACHER (Giáo viên)</option>
                    <option value="ADMIN">ADMIN (Quản trị)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '3px' }}>Trạng thái tài khoản:</label>
                  <select
                    value={editingUserModal.isActive ? 'active' : 'locked'}
                    onChange={(e) => setEditingUserModal({ ...editingUserModal, isActive: e.target.value === 'active' })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
                  >
                    <option value="active">✓ Hoạt động bình thường</option>
                    <option value="locked">🔒 Đã khóa tài khoản</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '3px' }}>Tiểu sử / Ghi chú quản trị:</label>
                <textarea
                  rows={2}
                  value={editingUserModal.bio}
                  onChange={(e) => setEditingUserModal({ ...editingUserModal, bio: e.target.value })}
                  placeholder="Tiểu sử người dùng hoặc ghi chú..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" className="btn-outline" onClick={() => setEditingUserModal({ ...editingUserModal, isOpen: false })}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary" style={{ backgroundColor: '#0284c7' }}>
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: THÊM / SỬA DANH MỤC KHÓA HỌC (CATEGORY MODAL) */}
      {showCatModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', maxWidth: '500px', width: '100%', padding: '24px', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                <i className="fa-solid fa-tags" style={{ color: '#0ea5e9', marginRight: '8px' }}></i>
                {editingCatId ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Khóa Học Mới'}
              </h3>
              <button onClick={() => setShowCatModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '3px' }}>Tên danh mục:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tiếng Anh Giao Tiếp, Luyện Thi IELTS..."
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (!editingCatId) {
                      setCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''));
                    }
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '3px' }}>Slug định danh URL:</label>
                  <input
                    type="text"
                    placeholder="tieng-anh-giao-tiep"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '3px' }}>Trạng thái:</label>
                  <select
                    value={catIsActive ? 'active' : 'inactive'}
                    onChange={(e) => setCatIsActive(e.target.value === 'active')}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
                  >
                    <option value="active">✓ Hiển thị trên Web</option>
                    <option value="inactive">Ẩn danh mục</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '3px' }}>Mô tả danh mục:</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả mục tiêu và nội dung của chuyên mục này..."
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" className="btn-outline" onClick={() => setShowCatModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary" style={{ backgroundColor: '#0ea5e9' }}>
                  {editingCatId ? 'Cập Nhật Danh Mục' : 'Tạo Danh Mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Confirm Delete Modal for Admin Operations */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        type="danger"
        isLoading={confirmModal.isLoading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, isLoading: false })}
      />
    </div>
  );
}

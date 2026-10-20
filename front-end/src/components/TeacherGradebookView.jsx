import React, { useState, useEffect, useMemo } from 'react';
import { courseAPI } from '../services/api';
import Pagination from './Pagination';

export default function TeacherGradebookView({ initialCourseId = 'ALL', onCourseChange }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId || 'ALL');
  const [courseFilterQuery, setCourseFilterQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, COMPLETED
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({
    total_students: 0,
    active_students: 0,
    completed_students: 0,
    avg_progress: 0,
    avg_quiz_score: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);
  const itemsPerPage = 8;

  // Đồng bộ prop initialCourseId nếu thay đổi từ component cha
  useEffect(() => {
    if (initialCourseId) {
      setSelectedCourseId(initialCourseId);
    }
  }, [initialCourseId]);

  // Lấy danh sách khóa học của giáo viên để hiển thị bộ lọc / pills
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await courseAPI.getTeachingCourses();
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list)) {
          setCourses(list);
        }
      } catch (err) {
        console.warn('Lỗi khi tải danh sách khóa học của giảng viên:', err);
      }
    };
    fetchCourses();
  }, []);

  // Lấy danh sách học viên theo khóa học và bộ lọc từ backend
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedCourseId && selectedCourseId !== 'ALL') {
        params.course_id = selectedCourseId;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (statusFilter && statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      const res = await courseAPI.getTeacherStudents(params);
      const payload = res.data?.data || {};
      setStudents(payload.students || []);
      if (payload.stats) {
        setStats(payload.stats);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách học viên khóa học:', err);
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchStudents();
  }, [selectedCourseId, statusFilter]);

  // Debounce tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => {
      fetchStudents();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCourse = (courseId) => {
    setSelectedCourseId(courseId);
    if (onCourseChange) {
      onCourseChange(courseId);
    }
  };

  // Xuất bảng điểm danh sách học viên ra file CSV UTF-8
  const handleExportCSV = () => {
    if (students.length === 0) {
      alert('Không có dữ liệu học viên để xuất file CSV!');
      return;
    }

    const header = 'Họ và tên,Email,Số điện thoại,Trình độ,Khóa học,Ngày ghi danh,Tiến độ (%),Số bài học đã xong,Điểm thi cao nhất (%),Điểm thi TB (%),Số lần thi,Trạng thái,Chứng chỉ\n';
    const rows = students
      .map((s) => {
        const enrolledDate = s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString('vi-VN') : 'N/A';
        const highestScore = s.quiz_stats?.highest_score != null ? `${s.quiz_stats.highest_score}%` : 'Chưa thi';
        const avgScore = s.quiz_stats?.avg_score != null ? `${s.quiz_stats.avg_score}%` : 'Chưa thi';
        const attempts = s.quiz_stats?.attempts_count || 0;
        const statusText = s.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang học';
        const certText = s.certificate_issued ? 'Đã cấp chứng chỉ' : 'Chưa cấp';

        return `"${s.name}","${s.email}","${s.phone_number || ''}","${s.level}","${s.course_title}","${enrolledDate}",${s.progress}%,${s.completed_lessons}/${s.total_lessons},"${highestScore}","${avgScore}",${attempts},"${statusText}","${certText}"`;
      })
      .join('\n');

    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const selectedCourseObj = courses.find((c) => String(c.id) === String(selectedCourseId));
    const courseSlug = selectedCourseObj ? selectedCourseObj.slug : 'tat-ca-khoa-hoc';
    link.href = url;
    link.setAttribute('download', `Bang_Diem_Hoc_Vien_${courseSlug}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tính tổng số học viên trong tất cả khóa học của giáo viên
  const totalEnrolledAcrossAllCourses = useMemo(() => {
    return courses.reduce((acc, c) => acc + (c.total_students || 0), 0);
  }, [courses]);

  // Lọc danh sách các pill khóa học khi giáo viên gõ tìm kiếm khóa học
  const filteredCoursesForPills = useMemo(() => {
    if (!courseFilterQuery.trim()) return courses;
    const query = courseFilterQuery.trim().toLowerCase();
    return courses.filter((c) =>
      c.title.toLowerCase().includes(query)
    );
  }, [courses, courseFilterQuery]);

  const selectedCourseTitle = useMemo(() => {
    if (selectedCourseId === 'ALL') return 'Tất cả các khóa học phụ trách';
    const found = courses.find((c) => String(c.id) === String(selectedCourseId));
    return found ? found.title : 'Khóa học đã chọn';
  }, [selectedCourseId, courses]);

  return (
    <div className="quiz-room-container" style={{ padding: '24px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-flex', padding: '6px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <i className="fa-solid fa-users-viewfinder"></i>
            </span>
            Quản Lý Học Viên & Sổ Điểm Theo Khóa Học
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Theo dõi chi tiết danh sách học viên, tiến độ hoàn thành bài giảng và kết quả kiểm tra trắc nghiệm thực tế từ CSDL.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-primary"
            onClick={handleExportCSV}
            style={{ fontSize: '0.82rem', padding: '8px 16px', backgroundColor: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="fa-solid fa-file-excel"></i>
            <span>Xuất Bảng Điểm (.csv)</span>
          </button>
        </div>
      </div>

      {/* Course Selector Pills (Danh sách khóa học của giảng viên có Badge số lượng học viên & Tìm kiếm) */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-layer-group" style={{ color: '#0284c7' }}></i>
            <span>CHỌN KHÓA HỌC ĐỂ XEM CHI TIẾT HỌC VIÊN:</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              ({filteredCoursesForPills.length}/{courses.length} khóa học)
            </span>
          </div>

          {/* Ô Tìm Kiếm Khóa Học Nhanh */}
          <div style={{ position: 'relative', width: '270px', maxWidth: '100%' }}>
            <i
              className="fa-solid fa-magnifying-glass"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.78rem' }}
            ></i>
            <input
              type="text"
              placeholder="Tìm nhanh khóa học..."
              value={courseFilterQuery}
              onChange={(e) => setCourseFilterQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 28px 6px 30px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-main)',
                outline: 'none',
              }}
            />
            {courseFilterQuery && (
              <button
                type="button"
                onClick={() => setCourseFilterQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
                title="Xóa tìm kiếm khóa học"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
        </div>

        {/* Khung cuộn danh sách các khóa học (Hỗ trợ khi có nhiều khóa học) */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            maxHeight: '140px',
            overflowY: 'auto',
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-subtle)',
          }}
        >
          {/* Nút Tất cả khóa học (chỉ ẩn khi đang lọc từ khóa mà không khớp) */}
          {(!courseFilterQuery.trim() || 'tất cả khóa học'.includes(courseFilterQuery.trim().toLowerCase())) && (
            <button
              type="button"
              onClick={() => handleSelectCourse('ALL')}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-full)',
                border: selectedCourseId === 'ALL' ? '2px solid #0284c7' : '1px solid var(--border-color)',
                backgroundColor: selectedCourseId === 'ALL' ? '#eff6ff' : 'var(--bg-surface)',
                color: selectedCourseId === 'ALL' ? '#0369a1' : 'var(--text-secondary)',
                fontWeight: selectedCourseId === 'ALL' ? '800' : '600',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <i className="fa-solid fa-globe"></i>
              <span>Tất cả khóa học</span>
              <span
                style={{
                  backgroundColor: selectedCourseId === 'ALL' ? '#0284c7' : 'var(--bg-muted)',
                  color: selectedCourseId === 'ALL' ? '#ffffff' : 'var(--text-muted)',
                  padding: '1px 8px',
                  borderRadius: '10px',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                }}
              >
                {totalEnrolledAcrossAllCourses}
              </span>
            </button>
          )}

          {filteredCoursesForPills.map((c) => {
            const isSelected = String(selectedCourseId) === String(c.id);
            const studentCount = c.total_students || 0;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectCourse(c.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: isSelected ? '2px solid #0284c7' : '1px solid var(--border-color)',
                  backgroundColor: isSelected ? '#eff6ff' : 'var(--bg-surface)',
                  color: isSelected ? '#0369a1' : 'var(--text-secondary)',
                  fontWeight: isSelected ? '800' : '600',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                title={c.title}
              >
                <i className="fa-solid fa-book-bookmark" style={{ color: isSelected ? '#0284c7' : '#94a3b8' }}></i>
                <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.title}
                </span>
                <span
                  style={{
                    backgroundColor: studentCount > 0 ? (isSelected ? '#0284c7' : '#e0f2fe') : 'var(--bg-muted)',
                    color: studentCount > 0 ? (isSelected ? '#ffffff' : '#0369a1') : 'var(--text-muted)',
                    padding: '1px 8px',
                    borderRadius: '10px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                  }}
                >
                  {studentCount} học viên
                </span>
              </button>
            );
          })}

          {filteredCoursesForPills.length === 0 && (
            <div style={{ padding: '8px 12px', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-circle-info" style={{ color: '#0284c7' }}></i>
              <span>Không tìm thấy khóa học nào khớp với từ khóa <strong>"{courseFilterQuery}"</strong>.</span>
              <button
                type="button"
                onClick={() => setCourseFilterQuery('')}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#0284c7',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '0.82rem',
                }}
              >
                Xem tất cả
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Counter Bar cho Khóa học đang chọn */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
          backgroundColor: 'var(--bg-subtle)',
          padding: '14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            <i className="fa-solid fa-users"></i>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>TỔNG HỌC VIÊN</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>{stats.total_students}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>ĐANG HỌC TẬP</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#16a34a' }}>{stats.active_students}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            <i className="fa-solid fa-certificate"></i>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>ĐÃ HOÀN THÀNH</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#d97706' }}>{stats.completed_students}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            <i className="fa-solid fa-chart-line"></i>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>TIẾN ĐỘ TRUNG BÌNH</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#9333ea' }}>{stats.avg_progress}%</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            <i className="fa-solid fa-star"></i>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>ĐIỂM THI TRẮC NGHIỆM TB</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#e11d48' }}>
              {stats.avg_quiz_score > 0 ? `${stats.avg_quiz_score}%` : 'Chưa có'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Row: Search & Status Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}
          ></i>
          <input
            type="text"
            placeholder={`Tìm học viên trong "${selectedCourseTitle}" theo họ tên, email...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-main)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        <div style={{ minWidth: '170px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              fontWeight: '600',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-main)',
            }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang học tập</option>
            <option value="COMPLETED">Đã hoàn thành</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '1.8rem', color: '#0284c7' }}></i>
          <p style={{ marginTop: '12px', fontSize: '0.9rem', fontWeight: '600' }}>
            Đang tải dữ liệu học viên từ CSDL...
          </p>
        </div>
      ) : students.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-color)',
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#94a3b8', fontSize: '1.5rem' }}>
            <i className="fa-solid fa-user-slash"></i>
          </div>
          <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
            Không tìm thấy học viên nào phù hợp
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
            {selectedCourseId !== 'ALL'
              ? `Khóa học này hiện chưa có học viên đăng ký hoặc không có học viên nào khớp với từ khóa tìm kiếm "${searchQuery}".`
              : 'Chưa có học viên nào đăng ký các khóa học do bạn phụ trách.'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-subtle)', textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 14px', fontWeight: '700' }}>Học Viên</th>
                <th style={{ padding: '12px 14px', fontWeight: '700' }}>Khóa Học Đăng Ký</th>
                <th style={{ padding: '12px 14px', fontWeight: '700' }}>Ngày Tham Gia</th>
                <th style={{ padding: '12px 14px', fontWeight: '700' }}>Tiến Độ Bài Học</th>
                <th style={{ padding: '12px 14px', fontWeight: '700' }}>Điểm Trắc Nghiệm</th>
                <th style={{ padding: '12px 14px', fontWeight: '700' }}>Trạng Thái</th>
                <th style={{ padding: '12px 14px', fontWeight: '700', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {students
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((s) => {
                  const enrolledDate = s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString('vi-VN') : 'Mới đây';
                  const attemptsCount = s.quiz_stats?.attempts_count || 0;
                  const highestScore = s.quiz_stats?.highest_score;
                  const avgScore = s.quiz_stats?.avg_score;

                  return (
                    <tr
                      key={s.enrollment_id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Học viên */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '800',
                              fontSize: '0.85rem',
                              flexShrink: 0,
                            }}
                          >
                            {s.name ? s.name.charAt(0).toUpperCase() : 'H'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ color: 'var(--text-main)', fontSize: '0.86rem' }}>{s.name}</strong>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: '#dbeafe',
                                  color: '#1d4ed8',
                                  fontWeight: '800',
                                }}
                              >
                                {s.level}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>{s.email}</span>
                            {s.phone_number && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', display: 'block' }}>
                                <i className="fa-solid fa-phone" style={{ fontSize: '0.65rem', marginRight: '4px' }}></i>
                                {s.phone_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Khóa học */}
                      <td style={{ padding: '12px 14px', maxWidth: '220px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={s.course_title}>
                          {s.course_title}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                          Tổng {s.total_lessons} bài giảng
                        </span>
                      </td>

                      {/* Ngày ghi danh */}
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {enrolledDate}
                      </td>

                      {/* Tiến độ bài học */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '85px', height: '7px', backgroundColor: 'var(--bg-muted)', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min(100, s.progress)}%`,
                                height: '100%',
                                background: s.progress === 100
                                  ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                                  : 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                              }}
                            ></div>
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: '800', color: s.progress === 100 ? '#16a34a' : 'var(--text-main)' }}>
                            {s.progress}%
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {s.completed_lessons}/{s.total_lessons} bài học
                        </div>
                      </td>

                      {/* Điểm trắc nghiệm */}
                      <td style={{ padding: '12px 14px' }}>
                        {attemptsCount > 0 ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontWeight: '800',
                                  fontSize: '0.88rem',
                                  color: highestScore >= 70 ? '#16a34a' : (highestScore >= 50 ? '#d97706' : '#dc2626'),
                                }}
                              >
                                {highestScore}%
                              </span>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  backgroundColor: s.quiz_stats?.has_passed ? '#dcfce7' : '#fee2e2',
                                  color: s.quiz_stats?.has_passed ? '#15803d' : '#b91c1c',
                                  fontWeight: '700',
                                }}
                              >
                                {s.quiz_stats?.has_passed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              ĐTB: {avgScore}% ({attemptsCount} lần làm)
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                            Chưa làm bài thi
                          </span>
                        )}
                      </td>

                      {/* Trạng thái & Chứng chỉ */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              backgroundColor: s.status === 'COMPLETED' ? '#dcfce7' : '#e0f2fe',
                              color: s.status === 'COMPLETED' ? '#15803d' : '#0284c7',
                            }}
                          >
                            {s.status === 'COMPLETED' ? 'HOÀN THÀNH' : 'ĐANG HỌC'}
                          </span>
                          {s.certificate_issued && (
                            <span style={{ color: '#d97706', fontWeight: '700', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <i className="fa-solid fa-award"></i> Đã cấp chứng chỉ
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Thao tác chi tiết */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() => setSelectedStudentForDetail(s)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.74rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid #bfdbfe',
                            color: '#0284c7',
                            backgroundColor: '#eff6ff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <i className="fa-solid fa-eye"></i>
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {/* Phân trang */}
          <div style={{ padding: '12px 16px' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(students.length / itemsPerPage)}
              totalItems={students.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* Modal Chi tiết Học Viên */}
      {selectedStudentForDetail && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setSelectedStudentForDetail(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '540px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-id-card" style={{ color: '#0284c7' }}></i>
                Hồ Sơ Học Tập Học Viên
              </h4>
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Thông tin học viên */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '18px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '1.3rem',
                }}
              >
                {selectedStudentForDetail.name ? selectedStudentForDetail.name.charAt(0).toUpperCase() : 'H'}
              </div>
              <div>
                <h5 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {selectedStudentForDetail.name}
                </h5>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0' }}>
                  {selectedStudentForDetail.email}
                </p>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#dbeafe',
                    color: '#1d4ed8',
                    fontWeight: '800',
                  }}
                >
                  Trình độ CEFR: {selectedStudentForDetail.level}
                </span>
              </div>
            </div>

            {/* Chi tiết tiến độ trong khóa */}
            <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>
                KHÓA HỌC ĐANG HỌC:
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '10px' }}>
                {selectedStudentForDetail.course_title}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Ngày ghi danh: </span>
                  <strong>{selectedStudentForDetail.enrolled_at ? new Date(selectedStudentForDetail.enrolled_at).toLocaleDateString('vi-VN') : 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Trạng thái: </span>
                  <strong style={{ color: selectedStudentForDetail.status === 'COMPLETED' ? '#16a34a' : '#0284c7' }}>
                    {selectedStudentForDetail.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang học'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Tiến độ bài học: </span>
                  <strong>{selectedStudentForDetail.progress}% ({selectedStudentForDetail.completed_lessons}/{selectedStudentForDetail.total_lessons} bài)</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Chứng chỉ: </span>
                  <strong style={{ color: selectedStudentForDetail.certificate_issued ? '#d97706' : 'var(--text-muted)' }}>
                    {selectedStudentForDetail.certificate_issued ? 'Đã cấp' : 'Chưa cấp'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Kết quả thi trắc nghiệm */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '18px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-list-check" style={{ color: '#7c3aed' }}></i>
                Kết Quả Bài Kiểm Tra Trắc Nghiệm
              </div>

              {selectedStudentForDetail.quiz_stats?.attempts_count > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                  <div style={{ padding: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Số lần thi</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {selectedStudentForDetail.quiz_stats.attempts_count}
                    </div>
                  </div>
                  <div style={{ padding: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Điểm cao nhất</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#16a34a' }}>
                      {selectedStudentForDetail.quiz_stats.highest_score}%
                    </div>
                  </div>
                  <div style={{ padding: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Điểm trung bình</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0284c7' }}>
                      {selectedStudentForDetail.quiz_stats.avg_score}%
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                  Học viên này chưa nộp bài kiểm tra trắc nghiệm nào trong khóa học.
                </p>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                className="btn-primary"
                onClick={() => setSelectedStudentForDetail(null)}
                style={{ padding: '8px 18px', fontSize: '0.84rem' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

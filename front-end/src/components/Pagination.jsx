import React from 'react';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || currentPage * itemsPerPage);

  // Tính toán dãy số trang hiển thị thông minh (VD: 1, 2, 3, 4, 5 hoặc 1 ... 4, 5, 6 ... 10)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages, currentPage + 1);

      if (currentPage <= 2) {
        start = 1;
        end = 3;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 2;
        end = totalPages;
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-color)',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      {/* Thông tin số lượng hiển thị */}
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        {totalItems > 0 ? (
          <span>
            Hiển thị <strong>{startItem}</strong> - <strong>{endItem}</strong> trong tổng số{' '}
            <strong>{totalItems}</strong> mục
          </span>
        ) : (
          <span>
            Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
          </span>
        )}
      </div>

      {/* Dãy nút chuyển trang */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Nút Trang Trước */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            backgroundColor: currentPage <= 1 ? 'var(--bg-subtle)' : 'var(--bg-surface)',
            color: currentPage <= 1 ? '#94a3b8' : 'var(--text-main)',
            fontSize: '0.82rem',
            fontWeight: '600',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <i className="fa-solid fa-chevron-left" style={{ fontSize: '0.72rem' }}></i>
          <span>Trước</span>
        </button>

        {/* Các nút số trang */}
        {getPageNumbers().map((page, idx) => {
          if (page === '...') {
            return (
              <span
                key={`dots-${idx}`}
                style={{
                  padding: '6px 8px',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  userSelect: 'none',
                }}
              >
                ...
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              style={{
                minWidth: '32px',
                height: '32px',
                padding: '0 8px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: isActive ? 'var(--primary-color, #0284c7)' : 'var(--border-color)',
                backgroundColor: isActive ? 'var(--primary-color, #0284c7)' : 'var(--bg-surface)',
                color: isActive ? '#ffffff' : 'var(--text-main)',
                fontSize: '0.82rem',
                fontWeight: isActive ? '700' : '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              {page}
            </button>
          );
        })}

        {/* Nút Trang Sau */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            backgroundColor: currentPage >= totalPages ? 'var(--bg-subtle)' : 'var(--bg-surface)',
            color: currentPage >= totalPages ? '#94a3b8' : 'var(--text-main)',
            fontSize: '0.82rem',
            fontWeight: '600',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <span>Sau</span>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.72rem' }}></i>
        </button>
      </div>
    </div>
  );
}

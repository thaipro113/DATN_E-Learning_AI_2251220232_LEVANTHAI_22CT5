import React, { useState } from 'react';
import { quizImportAPI } from '../services/api';

export default function QuizImportModal({ isOpen, onClose, onImportSuccess }) {
  const [sourceType, setSourceType] = useState('RAW_TEXT');
  const [rawText, setRawText] = useState(
    `1. What is the antonym of 'difficult'?\nA. Easy\nB. Hard\nC. Complex\nD. Complicated\nAnswer: A\nExplanation: Easy is the direct antonym of difficult.\nSkill: VOCABULARY\n\n2. She ___ to school every day.\nA. go\nB. goes\nC. gone\nD. going\nAnswer: B\nSkill: GRAMMAR`
  );
  const [useAI, setUseAI] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [targetQuizId, setTargetQuizId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleParse = async () => {
    setIsLoading(true);
    setStatusMessage('');
    try {
      const formData = new FormData();
      formData.append('title', 'Phiên nhập đề thi nhanh');
      formData.append('source_type', sourceType);
      formData.append('raw_text', rawText);
      formData.append('use_ai', useAI);

      const res = await quizImportAPI.uploadBatch(formData);
      const batch = res.data?.data;
      setPreviewData(batch?.parsed_data || []);
      setStatusMessage(`Đã bóc tách thành công ${batch?.total_parsed || 0} câu hỏi!`);
    } catch (err) {
      console.error('Parse error:', err);
      setStatusMessage('Đã xảy ra lỗi khi bóc tách đề thi.');
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
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '750px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-file-import" style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }}></i>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Công cụ Import Đề thi Tự động (Word / CSV / AI)
            </h3>
          </div>
          <button onClick={onClose} style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Định dạng nguồn */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              Định dạng nguồn:
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['RAW_TEXT', 'CSV', 'DOCX'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSourceType(type)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    border: '1px solid',
                    borderColor: sourceType === type ? 'var(--color-primary)' : 'var(--border-color)',
                    backgroundColor: sourceType === type ? 'var(--color-primary-light)' : 'var(--bg-surface)',
                    color: sourceType === type ? 'var(--color-primary)' : 'var(--text-muted)',
                  }}
                >
                  {type === 'RAW_TEXT' && 'Dán Văn bản Thô'}
                  {type === 'CSV' && 'Tệp Bảng tính (.csv)'}
                  {type === 'DOCX' && 'Tệp Microsoft Word (.docx)'}
                </button>
              ))}
            </div>
          </div>

          {/* Dán văn bản */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              Nội dung văn bản đề thi:
            </label>
            <textarea
              rows={7}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                outline: 'none',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                backgroundColor: 'var(--bg-page)',
              }}
            />
          </div>

          {/* Bật AI Smart Extraction */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="useAICheck"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="useAICheck" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', cursor: 'pointer' }}>
              Sử dụng Google Gemini AI & Groq để bóc tách đề thi tự do, không theo khuôn mẫu
            </label>
          </div>

          {/* Nút Bóc tách */}
          <div>
            <button
              className="btn-primary"
              onClick={handleParse}
              disabled={isLoading}
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>Đang bóc tách đề thi...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  <span>Bóc tách & Xem trước (Preview)</span>
                </>
              )}
            </button>
          </div>

          {statusMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-success-light)',
                color: 'var(--color-success)',
                fontSize: '0.85rem',
                fontWeight: '600',
              }}
            >
              <i className="fa-solid fa-circle-check" style={{ marginRight: '6px' }}></i>
              {statusMessage}
            </div>
          )}

          {/* Danh sách xem trước (Preview Data) */}
          {previewData && previewData.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '10px' }}>
                Danh sách câu hỏi trích xuất ({previewData.length} câu):
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                {previewData.map((q, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-surface)',
                    }}
                  >
                    <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '4px' }}>
                      Câu {idx + 1}: {q.content}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.8rem' }}>
                      {q.options?.map((opt, oIdx) => (
                        <span
                          key={oIdx}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: opt.is_correct ? 'var(--color-success-light)' : 'var(--bg-subtle)',
                            color: opt.is_correct ? 'var(--color-success)' : 'var(--text-muted)',
                            fontWeight: opt.is_correct ? '700' : '500',
                          }}
                        >
                          {opt.content} {opt.is_correct && '✓'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button className="btn-outline" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

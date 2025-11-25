import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { boardService, CreateBoardData } from '../services/board.service';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

const BoardForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isEdit = !!id;

  const [formData, setFormData] = useState<CreateBoardData>({
    title: '',
    content: '',
    category: 'anonymous',
    isAnonymous: false,
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      loadBoard();
    }
  }, [id]);

  const loadBoard = async () => {
    try {
      const board = await boardService.getBoard(id!);
      setFormData({
        title: board.title,
        content: board.content,
        category: board.category,
        isAnonymous: board.isAnonymous,
        images: board.images || [],
      });
    } catch (error) {
      console.error('Failed to load board:', error);
      alert('게시글을 불러오는데 실패했습니다.');
      navigate('/boards');
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if ((formData.images?.length || 0) + files.length > 5) {
      alert('이미지는 최대 5개까지 업로드할 수 있습니다.');
      return;
    }

    try {
      setUploading(true);
      const formDataObj = new FormData();
      Array.from(files).forEach((file) => {
        formDataObj.append('images', file);
      });

      const response = await api.post('/upload', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setFormData({
        ...formData,
        images: [...(formData.images || []), ...response.data.images],
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.response?.data?.error || '이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = formData.images?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('제목과 내용을 입력해주세요.');
      return;
    }

    if (formData.category === 'notice' && user?.role !== 'admin') {
      setError('공지사항은 관리자만 작성할 수 있습니다.');
      return;
    }

    try {
      setLoading(true);
      if (isEdit) {
        await boardService.updateBoard(id!, formData);
        alert('게시글이 수정되었습니다.');
      } else {
        const board = await boardService.createBoard(formData);
        alert('게시글이 작성되었습니다.');
        navigate(`/boards/${board._id}`);
        return;
      }
      navigate(`/boards/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || '게시글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-night">
      <div className="mb-4">
        <Link
          to={isEdit ? `/boards/${id}` : '/boards'}
          className="text-night-muted hover:text-night"
        >
          ← 뒤로가기
        </Link>
      </div>

      <div className="card bg-surface-2 border border-night p-8 shadow-card">
        <h1 className="text-3xl font-semibold text-night-heading mb-6">
          {isEdit ? '게시글 수정' : '게시글 작성'}
        </h1>

        {error && (
          <div className="alert alert-error mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-night mb-2">
              카테고리
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as any,
                })
              }
              className="input bg-[#0f1626]"
              disabled={isEdit}
            >
              {user?.role === 'admin' && (
                <option value="notice">공지사항</option>
              )}
              <option value="anonymous">익명 게시판</option>
              <option value="wargame-ctf">워게임 & CTF</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-night mb-2">
              제목
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="제목을 입력하세요"
              className="input"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-night mb-2">
              내용 (마크다운 지원)
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder={
                '내용을 입력하세요\n\n💡 마크다운 문법 사용 가능:\n# 제목\n**굵게** *기울임*\n- 목록\n```코드```\n[링크](URL)'
              }
              className="input min-h-[320px] font-mono text-sm"
              rows={15}
            />
            <p className="mt-1 text-xs text-night-muted">
              💡 마크다운 문법을 사용할 수 있습니다: # 제목, **굵게**, *기울임*, - 목록, [링크](URL), ```코드블록```
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-night mb-2">
              이미지 (최대 5개, 각 5MB 이하)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading || (formData.images?.length || 0) >= 5}
              className="block w-full text-sm text-night-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#1f2843] file:text-night hover:file:bg-[#2a3352] disabled:opacity-50"
            />
            {uploading && (
              <p className="text-sm text-night-muted mt-2">업로드 중...</p>
            )}

            {formData.images && formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`preview-${index}`}
                      className="w-full h-32 object-cover rounded-md border border-night"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-[#ff5f7e] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formData.category !== 'notice' && (
            <div>
              <label className="flex items-center text-night-muted">
                <input
                  type="checkbox"
                  checked={formData.isAnonymous}
                  onChange={(e) =>
                    setFormData({ ...formData, isAnonymous: e.target.checked })
                  }
                  className="mr-2 accent-[#7c5dfa]"
                />
                <span className="text-sm">익명으로 작성</span>
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Link
              to={isEdit ? `/boards/${id}` : '/boards'}
              className="btn btn-secondary"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? '처리 중...' : isEdit ? '수정하기' : '작성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BoardForm;


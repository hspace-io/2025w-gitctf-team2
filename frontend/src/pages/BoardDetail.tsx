import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { boardService, Board } from '../services/board.service';
import { useAuthStore } from '../store/authStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const BoardDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (id) {
      loadBoard();
    }
  }, [id]);

  const loadBoard = async () => {
    try {
      setLoading(true);
      const data = await boardService.getBoard(id!);
      setBoard(data);
    } catch (error) {
      console.error('Failed to load board:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      await boardService.likeBoard(id!);
      loadBoard();
    } catch (error) {
      console.error('Failed to like board:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      await boardService.deleteBoard(id!);
      alert('삭제되었습니다.');
      navigate('/boards');
    } catch (error) {
      console.error('Failed to delete board:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      await boardService.addComment(id!, comment, isAnonymous);
      setComment('');
      setIsAnonymous(false);
      loadBoard();
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await boardService.deleteComment(id!, commentId);
      loadBoard();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getCategoryName = (cat: string) => {
    const names: Record<string, string> = {
      notice: '공지사항',
      anonymous: '익명 게시판',
      'wargame-ctf': '워게임 & CTF',
    };
    return names[cat] || cat;
  };

  const isAuthor = board && user && board.author._id === user.id;
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-500">게시글을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-night">
      <div className="mb-5">
        <Link
          to="/boards"
          className="text-night-muted hover:text-night-heading transition-colors"
        >
          ← 목록으로
        </Link>
      </div>

      <div className="card bg-surface-2 border border-night shadow-card overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-5 border-b border-night bg-surface">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-night-muted">
              {getCategoryName(board.category)}
            </span>
            {(isAuthor || isAdmin) && (
              <div className="flex space-x-3 text-sm">
                <Link
                  to={`/boards/${id}/edit`}
                  className="text-night-muted hover:text-night-heading"
                >
                  수정
                </Link>
                <button
                  onClick={handleDelete}
                  className="text-[#ff8ca0] hover:text-[#ffb3c3]"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-semibold text-night-heading mb-4">
            {board.title}
          </h1>
          <div className="flex flex-wrap items-center justify-between text-sm text-night-muted gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-medium text-night">{board.author.username}</span>
              <span>{formatDate(board.createdAt)}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>조회 {board.views}</span>
              <span>좋아요 {board.likes.length}</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-10 bg-surface">
          <div className="prose prose-invert max-w-none text-night leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {board.content}
            </ReactMarkdown>
          </div>

          {board.images && board.images.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {board.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`image-${index}`}
                  className="w-full rounded-md border border-night cursor-pointer hover:opacity-90"
                  onClick={() => window.open(image, '_blank')}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-6 border-t border-night bg-surface">
          <button
            onClick={handleLike}
            disabled={!isAuthenticated}
            className="btn btn-secondary w-full sm:w-auto mx-auto flex items-center justify-center gap-2"
          >
            <span>👍</span>
            <span>좋아요 {board.likes.length}</span>
          </button>
        </div>

        <div className="px-6 py-6 border-t border-night bg-surface">
          <h3 className="text-xl font-semibold mb-6 text-night-heading">
            댓글 {board.comments.length}
          </h3>

          {isAuthenticated && (
            <form onSubmit={handleCommentSubmit} className="mb-8 space-y-3">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="댓글을 입력하세요"
                className="input min-h-[130px] resize-none"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                {board.category !== 'notice' && (
                  <label className="flex items-center text-sm text-night-muted">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="mr-2 accent-[#7c5dfa]"
                    />
                    익명으로 작성
                  </label>
                )}
                <button
                  type="submit"
                  disabled={submitting || !comment.trim()}
                  className="btn btn-primary text-sm px-5"
                >
                  {submitting ? '작성 중...' : '댓글 작성'}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {board.comments.map((comment) => (
              <div
                key={comment._id}
                className="rounded-2xl border border-night bg-[#151f33] p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-semibold text-night">
                      {comment.author.username}
                    </span>
                    <span className="text-sm text-night-muted ml-3">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  {isAuthenticated &&
                    (user?.id === comment.author._id || isAdmin) && (
                      <button
                        onClick={() => handleCommentDelete(comment._id)}
                        className="text-sm text-[#ff8ca0] hover:text-[#ffb3c3]"
                      >
                        삭제
                      </button>
                    )}
                </div>
                <div className="prose prose-sm max-w-none text-night-muted">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {comment.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardDetail;


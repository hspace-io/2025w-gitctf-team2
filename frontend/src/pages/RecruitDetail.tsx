import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { recruitService, Recruit } from '../services/recruit.service';
import { useAuthStore } from '../store/authStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const RecruitDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recruit, setRecruit] = useState<Recruit | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingMembers, setEditingMembers] = useState(false);
  const [currentMembers, setCurrentMembers] = useState(0);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (id) {
      loadRecruit();
    }
  }, [id]);

  const loadRecruit = async () => {
    try {
      setLoading(true);
      const data = await recruitService.getRecruit(id!);
      setRecruit(data);
      setCurrentMembers(data.currentMembers);
    } catch (error) {
      console.error('Failed to load recruit:', error);
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
      await recruitService.likeRecruit(id!);
      loadRecruit();
    } catch (error) {
      console.error('Failed to like recruit:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      await recruitService.deleteRecruit(id!);
      alert('삭제되었습니다.');
      navigate('/recruits');
    } catch (error) {
      console.error('Failed to delete recruit:', error);
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
      await recruitService.addComment(id!, comment);
      setComment('');
      loadRecruit();
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
      await recruitService.deleteComment(id!, commentId);
      loadRecruit();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  const handleMembersUpdate = async () => {
    if (!recruit) return;

    if (currentMembers < 1) {
      alert('현재 인원은 최소 1명 이상이어야 합니다.');
      return;
    }

    if (currentMembers > recruit.maxMembers) {
      alert('현재 인원은 최대 인원을 초과할 수 없습니다.');
      return;
    }

    try {
      await recruitService.updateRecruit(id!, { currentMembers });
      setEditingMembers(false);
      loadRecruit();
      alert('현재 인원이 업데이트되었습니다.');
    } catch (error) {
      console.error('Failed to update members:', error);
      alert('인원 업데이트에 실패했습니다.');
    }
  };

  const cancelMembersEdit = () => {
    setCurrentMembers(recruit?.currentMembers || 0);
    setEditingMembers(false);
  };

  const handleJoinTeam = async () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      await recruitService.joinTeam(id!);
      alert('참가 신청이 완료되었습니다.');
      loadRecruit();
    } catch (error: any) {
      alert(error.response?.data?.error || '참가 신청에 실패했습니다.');
    }
  };

  const handleCancelJoin = async () => {
    try {
      await recruitService.cancelJoin(id!);
      alert('참가 신청이 취소되었습니다.');
      loadRecruit();
    } catch (error) {
      console.error('Failed to cancel join:', error);
      alert('참가 취소에 실패했습니다.');
    }
  };

  const handleApproveMember = async (userId: string, approve: boolean) => {
    try {
      await recruitService.approveMember(id!, userId, approve);
      if (approve) {
        alert('팀원이 승인되었습니다. 이제 채팅방에 참여할 수 있습니다.');
      } else {
        alert('참가가 거부되었습니다.');
      }
      loadRecruit();
    } catch (error: any) {
      alert(error.response?.data?.error || '처리에 실패했습니다.');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('정말 퇴출하시겠습니까?')) {
      return;
    }

    try {
      await recruitService.removeMember(id!, userId);
      alert('팀원이 퇴출되었습니다.');
      loadRecruit();
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('퇴출에 실패했습니다.');
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getCategoryName = (cat: string) => {
    const names: Record<string, string> = {
      ctf: 'CTF',
      project: '프로젝트',
      study: '스터디',
    };
    return names[cat] || cat;
  };

  const isAuthor = recruit && user && recruit.author._id === user.id;
  const isAdmin = user?.role === 'admin';
  const isTeamMember = recruit && user && (
    recruit.members?.some(m => m._id === user.id) || 
    recruit.author._id === user.id
  );
  const isPendingMember = recruit && user && 
    recruit.pendingMembers?.some(m => m._id === user.id);
  const hasJoined = isTeamMember || isPendingMember;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-night">
        <div className="text-center text-night-muted">로딩 중...</div>
      </div>
    );
  }

  if (!recruit) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-night">
        <div className="text-center text-night-muted">모집글을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-night">
      <div className="mb-4">
        <Link
          to="/recruits"
          className="text-night-muted hover:text-night-heading"
        >
          ← 목록으로
        </Link>
      </div>

      <div className="card bg-surface-2 border border-night overflow-hidden">
        <div className="px-6 py-5 border-b border-night bg-surface">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-night-muted">
                {getCategoryName(recruit.category)}
              </span>
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  recruit.status === 'recruiting'
                    ? 'bg-[#1f4634] text-[#4dd4ac]'
                    : 'bg-[#2a2f43] text-night-muted'
                }`}
              >
                {recruit.status === 'recruiting' ? '모집중' : '마감'}
              </span>
            </div>
            {(isAuthor || isAdmin) && (
              <div className="flex space-x-2">
                <Link
                  to={`/recruits/${id}/edit`}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  수정
                </Link>
                <button
                  onClick={handleDelete}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-semibold text-night-heading mb-4">
            {recruit.title}
          </h1>
          <div className="flex items-center justify-between text-sm text-night-muted">
            <div className="flex items-center space-x-4">
              <span>{recruit.author.username}</span>
              <span>{formatDate(recruit.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>조회 {recruit.views}</span>
              <span>좋아요 {recruit.likes.length}</span>
            </div>
          </div>

          <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {editingMembers && isAuthor ? (
                  <>
                    <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-night">현재 인원:</span>
                      <input
                        type="number"
                        min="1"
                        max={recruit.maxMembers}
                        value={currentMembers}
                        onChange={(e) => setCurrentMembers(parseInt(e.target.value) || 1)}
                        className="w-20 px-2 py-1 border border-night rounded-md text-sm bg-[#101727] text-night text-center"
                      />
                      <span className="text-sm text-night-muted">/ {recruit.maxMembers}명</span>
                    </div>
                    <button
                      onClick={handleMembersUpdate}
                      className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700"
                    >
                      저장
                    </button>
                    <button
                      onClick={cancelMembersEdit}
                      className="text-sm bg-[#273152] text-night px-3 py-1 rounded-md hover:bg-[#2f3a63] transition-colors"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-lg font-semibold text-indigo-900">
                      현재 {recruit.currentMembers}명 / 최대 {recruit.maxMembers}명
                    </span>
                    {isAuthor && (
                      <button
                        onClick={() => setEditingMembers(true)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                      >
                        인원 수정
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="text-sm text-night-muted">
                {recruit.currentMembers >= recruit.maxMembers ? (
                  <span className="text-red-600 font-medium">✓ 모집 완료</span>
                ) : (
                  <span className="text-green-600 font-medium">
                    ✓ {recruit.maxMembers - recruit.currentMembers}명 더 모집 중
                  </span>
                )}
              </div>
            </div>
          </div>
          {recruit.deadline && (
            <div className="mt-2 text-sm text-red-600">
              마감일: {formatDate(recruit.deadline)}
            </div>
          )}
        </div>

        {recruit.tags.length > 0 && (
          <div className="px-6 py-4 bg-surface border-b border-night">
            <div className="flex flex-wrap gap-2">
              {recruit.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="px-6 py-8">
          <div className="prose prose-sm md:prose-base max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {recruit.content}
            </ReactMarkdown>
          </div>

          {recruit.images && recruit.images.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {recruit.images.map((image, index) => (
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

        {recruit.status === 'recruiting' && (
          <div className="px-6 py-4 border-t border-night bg-surface">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-night-heading">팀원</h3>
              {isTeamMember && (
                <button
                  onClick={() => {
                    navigate(`/chats/${id}`);
                  }}
                  className="btn btn-primary text-sm px-4 py-2"
                >
                  채팅하기
                </button>
              )}
            </div>

            {recruit.members && recruit.members.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-night-muted mb-2">승인된 팀원:</p>
                <div className="flex flex-wrap gap-2">
                  {recruit.members.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center space-x-2 px-3 py-1 bg-surface-2 rounded-lg border border-night"
                    >
                      <span className="text-sm text-night-heading">{member.username}</span>
                      {isAuthor && member._id !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          퇴출
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {isAuthor && recruit.pendingMembers && recruit.pendingMembers.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-night-muted mb-2">참가 신청 대기:</p>
                <div className="space-y-2">
                  {recruit.pendingMembers.map((pending) => (
                    <div
                      key={pending._id}
                      className="flex items-center justify-between px-3 py-2 bg-surface-2 rounded-lg border border-night"
                    >
                      <span className="text-sm text-night-heading">{pending.username}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveMember(pending._id, true)}
                          className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleApproveMember(pending._id, false)}
                          className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        >
                          거부
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isAuthenticated && !hasJoined && (
              <button
                onClick={handleJoinTeam}
                className="btn btn-primary w-full"
              >
                팀 참가하기
              </button>
            )}
            
            {isAuthenticated && isPendingMember && (
              <button
                onClick={handleCancelJoin}
                className="btn btn-secondary w-full"
              >
                참가 신청 취소
              </button>
            )}
          </div>
        )}


        <div className="px-6 py-4 border-t border-night bg-surface">
          <button
            onClick={handleLike}
            disabled={!isAuthenticated}
            className="btn btn-secondary flex items-center space-x-2 mx-auto"
          >
            <span>👍</span>
            <span>좋아요 {recruit.likes.length}</span>
          </button>
        </div>

        <div className="px-6 py-4 border-t border-night bg-surface">
          <h3 className="text-lg font-semibold mb-4">
            댓글 {recruit.comments.length}
          </h3>

          {isAuthenticated && (
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="댓글을 입력하세요"
                className="input min-h-[120px] resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
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
            {recruit.comments.map((comment) => (
              <div
                key={comment._id}
                className="rounded-2xl border border-night bg-[#151f33] p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-semibold text-night">
                      {comment.author.username}
                    </span>
                    <span className="text-sm text-night-muted ml-2">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  {isAuthenticated &&
                    (user?.id === comment.author._id || isAdmin) && (
                      <button
                        onClick={() => handleCommentDelete(comment._id)}
                        className="text-sm text-red-600 hover:text-red-800"
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

export default RecruitDetail;


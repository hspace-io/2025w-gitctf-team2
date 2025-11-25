import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recruitService, ChatRoom } from '../services/recruit.service';
import { useAuthStore } from '../store/authStore';

const ChatList = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadChatRooms();
  }, [isAuthenticated, navigate]);

  const loadChatRooms = async () => {
    try {
      setLoading(true);
      const data = await recruitService.getMyChatRooms();
      console.log('📋 Chat rooms data:', data);
      console.log('📋 Chat rooms count:', data.chatRooms?.length || 0);
      setChatRooms(data.chatRooms || []);
    } catch (error: any) {
      console.error('❌ Failed to load chat rooms:', error);
      console.error('❌ Error response:', error.response?.data);
      alert('채팅방 목록을 불러오는데 실패했습니다: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      ctf: 'CTF',
      project: '프로젝트',
      study: '스터디',
    };
    return labels[category] || category;
  };

  const handleChatRoomClick = (recruitId: string) => {
    navigate(`/chats/${recruitId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-night-muted">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-night-heading mb-2">내 채팅방</h1>
          <p className="text-night-muted">참가한 팀의 채팅방 목록입니다.</p>
        </div>

        {chatRooms.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-night-muted mb-4">
              참가한 채팅방이 없습니다.
            </div>
            <button
              onClick={() => navigate('/recruits')}
              className="btn btn-primary"
            >
              모집글 보기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {chatRooms.map((room) => (
              <div
                key={room._id}
                onClick={() => handleChatRoomClick(room._id)}
                className="card p-6 cursor-pointer hover:bg-surface-2 transition-colors border border-night"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-night-heading">
                        {room.title}
                      </h3>
                      <span className="px-2 py-1 text-xs rounded bg-indigo-600/20 text-indigo-400 border border-indigo-600/30">
                        {getCategoryLabel(room.category)}
                      </span>
                      {room.status === 'closed' && (
                        <span className="px-2 py-1 text-xs rounded bg-gray-600/20 text-gray-400 border border-gray-600/30">
                          모집 완료
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-night-muted mb-3">
                      <span>작성자: {room.author.username}</span>
                      <span>•</span>
                      <span>멤버: {room.members.length}명</span>
                    </div>

                    {room.lastMessage ? (
                      <div className="bg-surface-2 rounded-lg p-3 border border-night">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-night-heading">
                            {room.lastMessage.author.username}
                          </span>
                          <span className="text-xs text-night-muted">
                            {formatDate(room.lastMessage.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-night line-clamp-2">
                          {room.lastMessage.content}
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm text-night-muted italic">
                        아직 메시지가 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;


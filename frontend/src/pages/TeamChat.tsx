import { useState, useEffect, FormEvent, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recruitService, TeamChatMessage } from '../services/recruit.service';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../services/socket.service';

const TeamChat = () => {
  const { recruitId } = useParams<{ recruitId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [chatMessages, setChatMessages] = useState<TeamChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recruitTitle, setRecruitTitle] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (recruitId) {
      loadChatData();
      setupSocketConnection();
    }

    return () => {
      if (recruitId) {
        socketService.leaveTeamChat(recruitId);
      }
    };
  }, [recruitId, isAuthenticated, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const loadChatData = async () => {
    try {
      setLoading(true);
      const recruit = await recruitService.getRecruit(recruitId!);
      setRecruitTitle(recruit.title);
      
      const data = await recruitService.getTeamChat(recruitId!);
      setChatMessages(data.messages || []);
    } catch (error: any) {
      console.error('Failed to load chat data:', error);
      if (error.response?.status === 403) {
        alert('팀원만 채팅을 볼 수 있습니다.');
        navigate('/chats');
      }
    } finally {
      setLoading(false);
    }
  };

  const setupSocketConnection = () => {
    if (!recruitId) return;

    if (socketService.isConnected()) {
      socketService.joinTeamChat(recruitId);
      console.log('✅ Joined team chat:', recruitId);
    } else {
      console.warn('⚠️ Socket.io not connected, attempting to reconnect...');
      const token = localStorage.getItem('token');
      if (token) {
        socketService.connect(token);
        setTimeout(() => {
          if (socketService.isConnected()) {
            socketService.joinTeamChat(recruitId);
          }
        }, 1000);
      }
    }

    const handleNewMessage = (message: TeamChatMessage) => {
      console.log('📨 Received team message:', message);
      setChatMessages(prev => {
        if (prev.some(m => m._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    socketService.onTeamMessage(handleNewMessage);

    return () => {
      socketService.offTeamMessage(handleNewMessage);
    };
  };

  const handleChatSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !recruitId) return;

    const messageContent = chatInput.trim();
    setChatInput(''); 
    try {
      setSendingChat(true);
      const newMessage = await recruitService.sendChatMessage(recruitId, messageContent);
      
      if (newMessage) {
        setChatMessages(prev => {
          if (prev.some(m => m._id === newMessage._id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      }
    } catch (error: any) {
      setChatInput(messageContent);
      alert(error.response?.data?.error || '메시지 전송에 실패했습니다.');
    } finally {
      setSendingChat(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-night">
        <div className="text-night-muted">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night flex flex-col">
      <div className="sticky top-0 z-10 bg-[#05070f]/95 backdrop-blur-xl border-b border-[#1b1f2f]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/chats')}
            className="text-night-muted hover:text-night-heading transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-night-heading">{recruitTitle}</h1>
            <p className="text-xs text-night-muted">팀 채팅</p>
          </div>
        </div>
      </div>

      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-night"
      >
        {chatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-night-muted">
              <p className="text-lg mb-2">아직 메시지가 없습니다.</p>
              <p className="text-sm">첫 메시지를 보내보세요!</p>
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((msg, index) => {
              const isMyMessage = msg.author._id === user?.id;
              const prevMessage = index > 0 ? chatMessages[index - 1] : null;
              const showAvatar = !prevMessage || prevMessage.author._id !== msg.author._id;
              const showTime = !prevMessage || 
                new Date(msg.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 300000;

              return (
                <div key={msg._id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} gap-2`}>
                  {!isMyMessage && (
                    <div className="flex flex-col items-end">
                      {showAvatar ? (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                          {msg.author.username.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <div className="w-8 h-8" />
                      )}
                    </div>
                  )}
                  
                  <div className={`flex flex-col max-w-[70%] ${isMyMessage ? 'items-end' : 'items-start'}`}>
                    {!isMyMessage && showAvatar && (
                      <span className="text-xs text-night-muted mb-1 px-1">
                        {msg.author.username}
                      </span>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isMyMessage
                          ? 'bg-indigo-600 text-white rounded-br-md'
                          : 'bg-surface-2 text-night-heading border border-night rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    {showTime && (
                      <span className="text-xs text-night-muted mt-1 px-1">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    )}
                  </div>

                  {isMyMessage && (
                    <div className="flex flex-col items-end">
                      {showAvatar ? (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                          {msg.author.username.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <div className="w-8 h-8" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      <div className="sticky bottom-0 bg-[#05070f]/95 backdrop-blur-xl border-t border-[#1b1f2f]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="flex-1 input bg-surface-2 border-night focus:border-indigo-600"
              disabled={sendingChat}
            />
            <button
              type="submit"
              disabled={sendingChat || !chatInput.trim()}
              className="btn btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingChat ? '전송 중...' : '전송'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeamChat;


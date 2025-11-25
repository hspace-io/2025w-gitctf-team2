import { useState, useRef, useEffect } from 'react';
import { chatbotService, ChatMessage } from '../services/chatbot.service';
import { useAuthStore } from '../store/authStore';

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '안녕하세요! 👋 HSPACE 안내 챗봇입니다.\n\nHSPACE의 위치, 시설, 좌석 예약, 활동 등 무엇이든 물어보세요!',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuthStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    if (!isAuthenticated) {
      alert('로그인이 필요한 서비스입니다.');
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatbotService.sendMessage(input);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.reply,
        timestamp: response.timestamp,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: error.response?.data?.reply || '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const quickQuestions = [
    'HSPACE 위치가 어디인가요?',
    '좌석은 몇 개인가요?',
    '예약 방법은?',
  ];

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* 플로팅 챗봇 버튼 */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 w-16 h-16 night-gradient text-[#05070f] rounded-full shadow-neon flex items-center justify-center text-2xl transition-all duration-300 hover:scale-110 active:scale-95 z-50"
        aria-label="챗봇 열기"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* 챗봇 팝업 */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] card flex flex-col z-50 animate-fade-up bg-surface-2 border border-night shadow-card">
          {/* 헤더 */}
          <div className="night-gradient px-5 py-4 rounded-t-2xl flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                <span>🤖</span>
                <span>HSPACE 챗봇</span>
              </h3>
              <p className="text-white/80 text-xs mt-1">
                무엇이든 물어보세요!
              </p>
            </div>
            <button
              onClick={toggleChat}
              className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-5 bg-surface scrollbar-night">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'night-gradient text-[#05070f]'
                        : 'bg-[#1b2033] border border-night text-night shadow-card'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                    <p
                      className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-[#05070f]/70' : 'text-night-muted'
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#1b2033] border border-night rounded-2xl px-4 py-3 shadow-card">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-night-muted rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-night-muted rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-night-muted rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 빠른 질문 */}
          {messages.length <= 1 && (
            <div className="px-5 py-3 bg-surface border-t border-night">
              <p className="text-xs text-night-muted mb-2 font-medium">💡 빠른 질문:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-xs bg-[#1b2033] hover:bg-[#222842] border border-night hover:border-[#7c5dfa]/40 text-night-muted hover:text-night px-3 py-1.5 rounded-full transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 입력 영역 */}
          <div className="p-4 bg-surface border-t border-night rounded-b-2xl">
            {!isAuthenticated ? (
              <div className="text-center text-sm text-night-muted">
                로그인이 필요합니다
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="메시지 입력..."
                  className="flex-1 input text-sm"
                  disabled={loading}
                  maxLength={500}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="btn btn-primary text-sm px-4 py-2.5"
                >
                  {loading ? '...' : '전송'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </>
  );
};

export default FloatingChatbot;




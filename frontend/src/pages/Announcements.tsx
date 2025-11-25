import { useState, useEffect } from 'react';
import { discordService, DiscordMessage } from '../services/discord.service';
import { useAuthStore } from '../store/authStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Announcements = () => {
  const [missions, setMissions] = useState<DiscordMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [discordConnected, setDiscordConnected] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
    checkDiscordStatus();
  }, []);

  const checkDiscordStatus = async () => {
    try {
      const status = await discordService.getStatus();
      setDiscordConnected(status.connected);
    } catch (error) {
      console.error('Failed to check Discord status:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const missionsData = await discordService.getMissions(50);
      setMissions(missionsData.messages);
    } catch (error) {
      console.error('Failed to load Discord messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!user || user.role !== 'admin') {
      alert('관리자만 동기화할 수 있습니다.');
      return;
    }

    try {
      setSyncing(true);
      await discordService.syncMessages();
      alert('디스코드 메시지 동기화 완료!');
      await loadData();
    } catch (error) {
      console.error('Failed to sync:', error);
      alert('동기화에 실패했습니다.');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const renderMessage = (message: DiscordMessage) => (
    <div
      key={message._id}
      className="card bg-surface-2 border border-night p-6 hover:shadow-neon/30 transition-shadow"
    >
     
      {message.threadName && (
        <h2 className="text-2xl font-bold text-night-heading mb-4 pb-3 border-b border-night">
          {message.threadName}
        </h2>
      )}

      
      <div className="flex items-center mb-4">
        {message.author.avatar && (
          <img
            src={message.author.avatar}
            alt={message.author.username}
            className="w-10 h-10 rounded-full mr-3 border border-night"
          />
        )}
        <div>
          <p className="font-semibold text-night-heading">{message.author.username}</p>
          <p className="text-sm text-night-muted">{formatDate(message.timestamp)}</p>
        </div>
      </div>

      {message.content && (
        <div className="max-w-none mb-4 leading-relaxed text-night prose prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      )}

      {message.embeds && message.embeds.length > 0 && (
        <div className="space-y-4">
          {message.embeds.map((embed, idx) => (
            <div
              key={idx}
              className="border-l-4 border-[#7c5dfa] bg-[#1b233a] p-4 rounded-xl"
            >
              {embed.title && (
                <h3 className="font-bold text-lg mb-2 text-night-heading">{embed.title}</h3>
              )}
              {embed.description && (
                <div className="prose prose-sm max-w-none mb-2 text-night-muted">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {embed.description}
                  </ReactMarkdown>
                </div>
              )}
              {embed.fields && embed.fields.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {embed.fields.map((field: any, fieldIdx: number) => (
                    <div key={fieldIdx}>
                      <p className="font-semibold text-sm text-night">{field.name}</p>
                      <div className="prose prose-sm max-w-none text-sm text-night-muted">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {field.value}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {embed.image && (
                <img
                  src={embed.image.url}
                  alt="Embed"
                  className="mt-2 rounded max-w-full"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {message.attachments && message.attachments.length > 0 && (
        <div className="mt-4 space-y-2">
          {message.attachments.map((attachment, idx) => (
            <a
              key={idx}
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-night hover:text-night-heading"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              {attachment.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-night">
        <div className="text-center text-night-muted">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-night">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-night-heading">
            Frontier 미션
          </h1>
          {user?.role === 'admin' && (
            <button
              onClick={handleSync}
              disabled={syncing || !discordConnected}
              className="btn btn-primary font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {syncing ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  동기화 중...
                </>
              ) : (
                <>동기화</>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center text-sm">
          <span
            className={`inline-block w-2 h-2 rounded-full mr-2 ${
              discordConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          ></span>
          <span className="text-night-muted">
            {discordConnected
              ? 'Discord 연결됨'
              : 'Discord 연결 안 됨 (캐시된 데이터 표시)'}
          </span>
        </div>
      </div>

      {missions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-night-muted text-lg">아직 미션이 없습니다.</p>
          <p className="text-sm text-night-muted/70 mt-2">
            관리자가 동기화 버튼을 눌러 미션을 가져오세요.
          </p>
          {!discordConnected && (
            <p className="text-sm text-[#ff8ca0] mt-2">
              Discord Bot이 연결되지 않았습니다.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {missions.map((message) => renderMessage(message))}
        </div>
      )}
    </div>
  );
};

export default Announcements;


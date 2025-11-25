import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import hspaceLogo from '../assets/hspace-logo.svg';

const Home = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="relative overflow-hidden bg-night text-night">
      <div className="absolute inset-0 opacity-60 pointer-events-none">
        <div className="absolute -top-64 -left-32 w-[40rem] h-[40rem] rounded-full blur-[160px] bg-[#6c5ce7]/40" />
        <div className="absolute top-0 right-0 w-[32rem] h-[32rem] rounded-full blur-[140px] bg-[#5dd9f5]/30" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative">
        <div className="text-center space-y-6 animate-fade-in">
          <img src={hspaceLogo} alt="HSPACE" className="h-12 w-auto mx-auto opacity-90" />
          <p className="uppercase tracking-[0.4em] text-night-muted text-sm">
            Hspace X Frontier Team 2
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-night-heading leading-tight night-gradient-text">
            Hspace에 오신 것을 환영합니다
          </h1>
          <p className="text-lg md:text-xl text-night-muted max-w-3xl mx-auto">
            화이트해커 미션, 프로젝트 팀빌딩, 익명 질문, 좌석 예약까지.
            <br />
            하이브리드 해킹 스페이스를 한 곳에서 경험 해보세요.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <>
                <Link to="/boards" className="btn btn-primary px-8 py-3 text-base">
                  게시판 탐색
                </Link>
                <Link to="/recruits" className="btn btn-secondary px-8 py-3 text-base">
                  팀원 찾기
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary px-8 py-3 text-base">
                  지금 시작하기
                </Link>
                <Link to="/login" className="btn btn-secondary px-8 py-3 text-base">
                  로그인
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
          {[
            {
              label: '게시판',
              description: '공지, 익명, 워게임/CTF 소식까지 한 번에 확인',
              icon: '📡',
            },
            {
              label: '모집',
              description: 'CTF/프로젝트 팀원 찾기, 협업 파트너 연결',
              icon: '🤝',
            },
            {
              label: '익명성',
              description: '보안 커뮤니티답게 철저한 익명성 보장',
              icon: '🛰️',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="card card-hover p-8 space-y-4 animate-fade-up"
            >
              <div className="text-4xl">{item.icon}</div>
              <h3 className="text-white text-2xl font-semibold">{item.label}</h3>
              <p className="text-night-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;


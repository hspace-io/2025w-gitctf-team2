import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import NotificationBell from './NotificationBell';
import hspaceLogo from '../assets/hspace-logo.svg';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 bg-[#05070f]/80 backdrop-blur-2xl border-b border-[#1b1f2f]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src={hspaceLogo} alt="HSPACE" className="h-9 w-auto" />
              <span className="sr-only">HSPACE</span>
            </Link>
            <div className="ml-10 flex items-center space-x-1">
              <Link
                to="/announcements"
                className="nav-link"
              >
                미션
              </Link>
              <Link
                to="/boards"
                className="nav-link"
              >
                게시판
              </Link>
              <Link
                to="/recruits"
                className="nav-link"
              >
                모집
              </Link>
              <Link
                to="/seats"
                className="nav-link"
              >
                좌석 예약
              </Link>
              {isAuthenticated && (
                <Link
                  to="/chats"
                  className="nav-link"
                >
                  채팅
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="btn btn-secondary text-sm px-4 py-2"
                  >
                    관리자
                  </Link>
                )}
                <span className="text-sm text-night-muted px-3">
                  안녕하세요, <span className="font-semibold text-night">{user?.username}</span>님
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary text-sm"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="nav-link"
                >
                  로그인
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary text-sm"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;


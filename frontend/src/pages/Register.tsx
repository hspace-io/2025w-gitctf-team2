import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { isValidEmail, validatePasswordStrength } from '../utils/sanitize';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setError('사용자명은 3-20자 사이여야 합니다.');
      return;
    }

    if (!/^[a-zA-Z0-9가-힣_-]+$/.test(username)) {
      setError('사용자명은 영문, 한글, 숫자, 언더스코어, 하이픈만 사용할 수 있습니다.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }

    try {
      await register(username, email, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || '회원가입에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-night py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        <div className="card p-10 glass-panel">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-semibold text-night-heading mb-2">
              회원가입
            </h2>
            <p className="text-night-muted text-sm">
              이미 계정이 있으신가요?{' '}
              <Link
                to="/login"
                className="text-[#7c5dfa] hover:text-[#5dd9f5] transition-colors"
              >
                로그인하기
              </Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                회원가입이 완료되었습니다! 로그인 페이지로 이동합니다...
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="sr-only">
                  사용자명
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input"
                  placeholder="사용자명 (3-20자)"
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">
                  이메일
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="이메일"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="비밀번호 (최소 6자)"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  placeholder="비밀번호 확인"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || success}
                className="btn btn-primary w-full"
              >
                {isLoading ? '처리 중...' : '회원가입'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;


import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isGoogleLoginConfigured, startGoogleLogin } from '../lib/keycloakOidc';

export function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('아이디와 비밀번호를 입력해 주세요.');
      return;
    }
    setLoading(true);
    try {
      await signIn(username.trim(), password, remember);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">로그인</h1>
        <p className="auth-lead">
          에브리카트 베이커리 회원으로 로그인하세요.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <label className="auth-label" htmlFor="login-id">
            아이디
          </label>
          <input
            id="login-id"
            name="username"
            type="text"
            autoComplete="username"
            className="auth-input"
            placeholder="아이디를 입력해 주세요"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />

          <label className="auth-label" htmlFor="login-pw">
            비밀번호
          </label>
          <input
            id="login-pw"
            name="password"
            type="password"
            autoComplete="current-password"
            className="auth-input"
            placeholder="비밀번호를 입력해 주세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          <label className="auth-check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={loading}
            />
            로그인 상태 유지
          </label>

          <button
            type="submit"
            className="btn btn-primary btn-block auth-submit"
            disabled={loading}
          >
            {loading ? '로그인 중…' : '로그인'}
          </button>
        </form>

        <div className="auth-divider" role="separator">
          <span>또는</span>
        </div>

        <button
          type="button"
          className="btn btn-google btn-block"
          disabled={loading || !isGoogleLoginConfigured()}
          title={
            isGoogleLoginConfigured()
              ? 'Google 계정으로 로그인'
              : 'VITE_OIDC_AUTHORITY, VITE_OIDC_CLIENT_ID 를 .env에 설정하세요'
          }
          onClick={async () => {
            setError(null);
            try {
              await startGoogleLogin(remember);
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : 'Google 로그인을 시작하지 못했습니다.',
              );
            }
          }}
        >
          <span className="btn-google-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </span>
          Google로 계속하기
        </button>

        {!isGoogleLoginConfigured() && (
          <p className="auth-oidc-hint">
            Google 로그인은 Keycloak에 public 클라이언트와 Google IdP 설정 후,{' '}
            <code>.env</code>에 <code>VITE_OIDC_AUTHORITY</code>,{' '}
            <code>VITE_OIDC_CLIENT_ID</code>를 지정하세요. Redirect URI:{' '}
            <code>{typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback'}</code>
          </p>
        )}

        <ul className="auth-links">
          <li>
            <a href="#find-id">아이디 찾기</a>
          </li>
          <li>
            <a href="#find-pw">비밀번호 찾기</a>
          </li>
          <li>
            <Link to="/">비회원 주문조회</Link>
          </li>
        </ul>

        <p className="auth-note">
          아직 회원이 아니신가요?{' '}
          <a href="#join">회원가입</a>
        </p>
      </div>
    </div>
  );
}

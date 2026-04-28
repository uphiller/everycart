import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { exchangeCodeForTokens } from '../lib/keycloakOidc';

/**
 * Keycloak redirect_uri 콜백 — ?code= 또는 ?error=
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const { completeOidcSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      const desc = params.get('error_description');
      if (err) {
        setError(desc || err);
        return;
      }
      const code = params.get('code');
      if (!code) {
        setError('인가 코드가 없습니다.');
        return;
      }
      try {
        const tokens = await exchangeCodeForTokens(code);
        await completeOidcSession(tokens);
        navigate('/', { replace: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : '로그인 처리에 실패했습니다.');
      }
    })();
  }, [completeOidcSession, navigate]);

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">로그인 오류</h1>
          <p className="auth-error" role="alert">
            {error}
          </p>
          <p className="auth-note">
            <Link to="/login">로그인 화면으로 돌아가기</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page auth-callback-pending">
      <div className="auth-card">
        <p className="auth-callback-msg">로그인 처리 중…</p>
      </div>
    </div>
  );
}

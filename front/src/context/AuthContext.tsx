import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchCurrentUser,
  loginWithPassword,
  type AuthUserResponse,
} from '../api/auth';
import { clearAuth, getAccessToken, saveAuth, type StoredAuth } from '../lib/authStorage';
import type { OidcTokenPayload } from '../lib/keycloakOidc';

type AuthContextValue = {
  user: AuthUserResponse | null;
  /** 초기 토큰·/me 복원 여부 */
  ready: boolean;
  /** user !== null */
  isAuthenticated: boolean;
  signIn: (username: string, password: string, remember: boolean) => Promise<void>;
  /** Keycloak + Google (OIDC code + PKCE) 콜백 후 */
  completeOidcSession: (payload: OidcTokenPayload) => Promise<void>;
  signOut: () => void;
  displayName: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function buildDisplayName(user: AuthUserResponse | null): string {
  if (!user) return '';
  return (
    user.preferredUsername?.trim() ||
    user.email?.trim() ||
    user.subject ||
    '회원'
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserResponse | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          return;
        }
        const me = await fetchCurrentUser(token);
        if (cancelled) return;
        if (me === null) {
          setUser(null);
        } else {
          setUser(me);
        }
      } catch {
        if (!cancelled) {
          clearAuth();
          setUser(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(
    async (username: string, password: string, remember: boolean) => {
      try {
        await loginWithPassword(username, password, remember);
        const token = getAccessToken();
        if (!token) {
          throw new Error('토큰을 저장하지 못했습니다.');
        }
        const me = await fetchCurrentUser(token);
        if (me === null) {
          throw new Error('사용자 정보를 가져오지 못했습니다. 다시 로그인해 주세요.');
        }
        setUser(me);
      } catch (err) {
        clearAuth();
        setUser(null);
        throw err;
      }
    },
    [],
  );

  const completeOidcSession = useCallback(
    async (payload: OidcTokenPayload) => {
      try {
        const stored: StoredAuth = {
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          tokenType: payload.tokenType,
          expiresIn: payload.expiresIn,
        };
        saveAuth(stored, payload.remember);
        const me = await fetchCurrentUser(payload.accessToken);
        if (me === null) {
          throw new Error('사용자 정보를 가져오지 못했습니다.');
        }
        setUser(me);
      } catch (err) {
        clearAuth();
        setUser(null);
        throw err;
      }
    },
    [],
  );

  const signOut = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const displayName = useMemo(() => buildDisplayName(user), [user]);

  const value = useMemo(
    () => ({
      user,
      ready,
      isAuthenticated: user !== null,
      signIn,
      completeOidcSession,
      signOut,
      displayName,
    }),
    [user, ready, signIn, completeOidcSession, signOut, displayName],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

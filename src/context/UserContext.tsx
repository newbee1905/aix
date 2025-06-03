'use client';

import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
	useRef,
} from 'react';
import { useRouter, usePathname } from 'next/navigation'

interface AuthContextType {
	userId: number | null;
	resetAuthFetch: () => void;
}

const AuthContext = createContext<AuthContextType>({ userId: null, resetAuthFetch: () => {} });
export const useAuth = () => useContext(AuthContext);

export function UserProvider({ children }: { children: ReactNode }) {
	const [userId, setUserId] = useState<number | null>(null);
	const router = useRouter();
	const path = usePathname()
	const hasFetched = useRef(false);

  const resetAuthFetch = () => {
    hasFetched.current = false;
    setUserId(null);
  };

	useEffect(() => {
		if (hasFetched.current) {
			return;
		}
		hasFetched.current = true;

		if (path?.startsWith('/login') || path?.startsWith('/register')) {
			return;
		}

		(async () => {
			const res = await fetch('/api/user/auth', { credentials: 'include' });

			if (!res.ok) {
				return router.push('/login');
			}

			const { userId: id } = await res.json();

			setUserId(Number(id));
		})();
	}, [router, path]);

	return (
		<AuthContext.Provider value={{ userId, resetAuthFetch }}>
			{children}
		</AuthContext.Provider>
	);
}


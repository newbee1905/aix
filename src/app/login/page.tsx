'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

// const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	// const [emailError, setEmailError] = useState(false);
	const router = useRouter();

	// useEffect(() => {
	// 	setEmailError(email !== '' && !emailRegex.test(email));
	// }, [email]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const res = await fetch('/api/user/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password }),
			credentials: 'include',
		});

		if (res.ok) {
			router.push('/');
		  toast.success('Logged in successfully');
		} else {
			toast.error('Login failed – check your credentials');
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center">
			<Card className="w-full max-w-md p-6 bg-white/10 backdrop-blur shadow-lg rounded-xl">
				<h1 className="text-2xl font-bold mb-4">Login</h1>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						type="email"
						placeholder="Email"
						value={email}
						onChange={e => setEmail(e.target.value)}
						required
					/>
					<Input
						type="password"
						placeholder="Password"
						value={password}
						onChange={e => setPassword(e.target.value)}
						required
					/>
					<Button type="submit" className="w-full">Login</Button>
				</form>
				<p className="mt-4 text-center">
					No account? <a href="/register" className="text-blue-400 underline">Register</a>
				</p>
			</Card>
		</div>
	);
}

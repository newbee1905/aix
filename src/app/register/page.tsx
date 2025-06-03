'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';

import { CircleAlert  } from "lucide-react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [error, setError] = useState('');
	const [emailError, setEmailError] = useState(false);
	const [passwordError, setPasswordError] = useState(false);
	const router = useRouter();

	useEffect(() => {
		setEmailError(email !== '' && !emailRegex.test(email));
	}, [email]);

	useEffect(() => {
		setPasswordError(confirm !== '' && confirm !== password);
	}, [confirm, password]);


	const canSubmit = Boolean(email && password && confirm && !emailError && !passwordError);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (password !== confirm) {
			setError('Passwords do not match');
			return;
		}

		const res = await fetch('/api/user/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		});

		if (res.ok) {
			router.push('/login');
		} else {
			setError('Registration failed');
		}					
	}

	return (
		<div className="min-h-screen flex items-center justify-center">
			<Card className="w-full max-w-md p-6 bg-white/10 backdrop-blur shadow-lg rounded-xl">
				<h1 className="text-2xl font-bold mb-4">Register</h1>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						type="email"
						placeholder="Email"
						value={email}
						onChange={e => setEmail(e.target.value)}
						className={emailError ? 'border-red-500 focus:border-red-500' : ''}
						required
					/>
					<Input
						type="password"
						placeholder="Password"
						value={password}
						onChange={e => setPassword(e.target.value)}
						className={passwordError ? 'border-red-500 focus:border-red-500' : ''}
						required
					/>
					<Input
						type="password"
						placeholder="Re-type Password"
						value={confirm}
						onChange={e => setConfirm(e.target.value)}
						className={passwordError ? 'border-red-500 focus:border-red-500' : ''}
						required
					/>
					<Button type="submit" className="w-full" disabled={!canSubmit}>Register</Button>
				</form>
				<p className="mt-4 text-center">
					Have an account? <a href="/login" className="text-blue-400 underline">Login</a>
				</p>
				{error && (
					<Alert variant="destructive">
						<CircleAlert />
						<AlertTitle>Error</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
			</Card>
		</div>
	);
}

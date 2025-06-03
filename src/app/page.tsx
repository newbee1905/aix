'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { PostSkeleton } from '@/components/Loading';
import { Post, PostCard } from "@/components/PostCard";

import {
	Card,
	CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

import { fetcher } from '@/lib/utils';
import { useAuth } from '@/context/UserContext';

export default function HomePage() {
	const { data: posts, error, isLoading } = useSWR<Post[]>('/api/post', fetcher);
	const { userId, resetAuthFetch } = useAuth();
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const router = useRouter();

	const handleLogout = useCallback(async () => {
		await fetch('/api/user/logout', { method: 'POST', credentials: 'include' });
		resetAuthFetch();
		router.push('/login');
	}, [router, resetAuthFetch]);

	const handleCreate = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!title.trim() || !content.trim()) return;

			// Create new post on server
			const res = await fetch('/api/post', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title, content, authorId: userId }),
			});
			if (!res.ok) return;

			// Grab the newly created post object
			const newPost = (await res.json()) as Post;
			setTitle('');
			setContent('');

			// Optimistically prepend to SWR cache
			mutate<Post[]>('/api/post', (current = []) => [newPost, ...current], false);
		},
		[title, content, userId]
	);

	if (error) {
		return <div className="p-4">Failed to load posts.</div>;
	}

	return (
		<div className="max-w-xl mx-auto p-4 space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-xl font-bold">Home</h1>
				<Button variant="ghost" onClick={handleLogout}>
					Logout
				</Button>
			</div>

			<Card className="p-4">
				<CardContent className="flex space-x-3">
					<Avatar>
						<AvatarFallback className="bg-gray-400 text-white">U</AvatarFallback>
					</Avatar>
					<form onSubmit={handleCreate} className="flex-1 space-y-2">
						<Input
							placeholder="Title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							required
						/>
						<Textarea
							placeholder="What's happening?"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							rows={3}
							className="w-full resize-none"
						/>
						<div className="flex justify-end">
							<Button type="submit" disabled={!content.trim()}>
								Post
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{isLoading
				? Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
				: posts?.map((post) => <PostCard key={post.id} post={post} />)}
		</div>
	);
}

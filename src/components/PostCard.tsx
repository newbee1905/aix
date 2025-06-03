'use client';

import { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';

import {
	Card,
	CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';

import { fetcher } from '@/lib/utils';

import { useAuth } from '@/context/UserContext';

const avatarColors = [
	'bg-red-500',
	'bg-green-500',
	'bg-blue-500',
	'bg-yellow-500',
	'bg-purple-500',
	'bg-pink-500',
	'bg-indigo-500',
];

const getToxicityBadgeClass = (tox: number) => {
	if (tox > 0.7) {
		return 'bg-red-100 text-red-800';
	}
	if (tox > 0.3) {
		return 'bg-yellow-100 text-yellow-800';
	}
	return 'bg-green-100 text-green-800';
};

export type Post = {
	id: number;
	content: string;
	title: string;
	toxicity: number;
	author: {
		id: number;
		email: string;
	};
	createdAt: string;
};

export type Comment = {
	id: number;
	post: Post;
	author: {
		id: number;
		email: string;
	};
	content: string;
	title: string;
	toxicity: number;
	createdAt: string;
};

export function PostCard({ post }: { post: Post }) {
	const initials = post.author.email.charAt(0).toUpperCase();
	const colorClass = avatarColors[post.author.id % avatarColors.length];

	const { userId } = useAuth();

	// SWR key for comments on this post
	const commentsKey = `/api/post/${post.id}/comment`;
	const { data: comments, error, isLoading } = useSWR<Comment[]>(commentsKey, fetcher);
	const [commentText, setCommentText] = useState('');

	const handleComment = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!commentText.trim()) {
				return;
			}

			// Post new comment to server
			const res = await fetch(`/api/post/${post.id}/comment`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					postId: post.id,
					content: commentText,
					authorId: userId,
				}),
			});
			if (!res.ok) {
				return;
			}

			// Get the newly created comment object
			const newComment = (await res.json()) as Comment;

			// Clear input
			setCommentText('');

			// Prepend the new comment into the SWR cache for this key
			mutate<Comment[]>(
				commentsKey,
				(current = []) => [newComment, ...current],
				false
			);
		},
		[commentText, commentsKey, post.id, userId]
	);

	return (
		<Card className="p-4 space-y-4">
			<CardHeader className="flex space-x-3">
				<Avatar>
					<AvatarFallback className={`${colorClass} text-white`}>{initials}</AvatarFallback>
				</Avatar>
				<div>
					<div className="flex items-center space-x-2">
						<span className="font-semibold">{post.author.email}</span>
						<span className="text-sm text-muted-foreground">
							· {formatDistanceToNow(new Date(post.createdAt))} ago
						</span>
					</div>
					<h2 className="mt-1 font-bold">{post.title}</h2>
					<p className="mt-1">{post.content}</p>
					<div className="flex space-x-1 mt-2">
						<Badge className={`mt-1 inline-block ${getToxicityBadgeClass(post.toxicity)}`}>
							{post.toxicity.toFixed(2)}
						</Badge>
					</div>
				</div>
			</CardHeader>

			<div className="pl-12 space-y-2">
				{isLoading && <p className="text-sm">Loading comments...</p>}
				{error && <p className="text-sm text-red-500">Failed to load comments.</p>}

				{comments?.map((c) => {
					const ci = c.author.email.charAt(0).toUpperCase();
					const cColor = avatarColors[c.author.id % avatarColors.length];
					return (
						<div key={c.id} className="flex space-x-2">
							<Avatar>
								<AvatarFallback className={`${cColor} text-white`}>{ci}</AvatarFallback>
							</Avatar>
							<div>
								<div className="flex items-center space-x-1">
									<span className="font-semibold text-sm">{c.author.email}</span>
									<span className="text-xs text-muted-foreground">
										· {formatDistanceToNow(new Date(c.createdAt))} ago
									</span>
								</div>
								<p className="text-sm">{c.content}</p>
								<Badge className={`mt-1 inline-block ${getToxicityBadgeClass(c.toxicity)}`}>
									{c.toxicity.toFixed(2)}
								</Badge>
							</div>
						</div>
					);
				})}

				<form onSubmit={handleComment} className="flex space-x-2 mt-2">
					<Input
						placeholder="Add a comment"
						value={commentText}
						onChange={(e) => setCommentText(e.target.value)}
						className="flex-1"
					/>
					<Button type="submit" size="sm" disabled={!commentText.trim()}>
						Comment
					</Button>
				</form>
			</div>
		</Card>
	);
}

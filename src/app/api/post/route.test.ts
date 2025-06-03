/**
 * @jest-environment node
 */

import { GET, POST } from './route'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { inferToxicity } from '@/lib/onnx'

jest.mock('@/lib/prisma')
jest.mock('@/lib/onnx')

beforeEach(() => jest.resetAllMocks())

describe('GET /api/post', () => {
	it('200 returns list of posts with author and comments', async () => {
		const fakePosts = [
			{
				id: 1,
				title: 'First',
				content: '...',
				author: { id: 10, email: 'x@x.com' },
				comments: [{ id: 11, content: 'hello', authorId: 10, postId: 1, toxicity: 0 }],
			},
			{
				id: 2,
				title: 'Second',
				content: '...',
				author: { id: 20, email: 'y@y.com' },
				comments: [],
			},
		];
		(prisma.post.findMany as jest.Mock).mockResolvedValue(fakePosts);

		const req = new NextRequest('http://localhost/api/post', { method: 'GET' });
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(Array.isArray(json)).toBe(true);
		expect(json).toHaveLength(2);
		expect(prisma.post.findMany).toHaveBeenCalledWith({
			include: { author: true, comments: true },
		});
		expect(json).toEqual(fakePosts);
	})
})

describe('POST /api/post', () => {
	it('201 on successful creation', async () => {
		const newPost = {
			id: 3,
			title: 'New',
			content: '...',
			authorId: 5,
			toxicity: 0.1,
		};
		(inferToxicity as jest.Mock).mockResolvedValue(0.1);
		(prisma.post.create as jest.Mock).mockResolvedValue(newPost);

		const req = new NextRequest('http://localhost/api/post', {
			method: 'POST',
			body: JSON.stringify({
				title: 'New',
				content: '...',
				authorId: 5,
			}),
		});

		const res = await POST(req);
		const json = await res.json();

		expect(res.status).toBe(201);
		expect(json.id).toBe(3);
		expect(json.title).toBe('New');
		expect(inferToxicity).toHaveBeenCalledWith('...');
		expect(prisma.post.create).toHaveBeenCalledWith({
			data: { 
				title: 'New', content: '...', authorId: 5, toxicity: 0.1,
			},
			include: {
				author: true,
				comments: true,
			},
		});
	})

	it('400 on create error', async () => {
		(inferToxicity as jest.Mock).mockResolvedValue(0.5);
		(prisma.post.create as jest.Mock).mockRejectedValue(new Error('Bad data'));

		const req = new NextRequest('http://localhost/api/post', {
			method: 'POST',
			body: JSON.stringify({
				title: '',
				content: '',
				authorId: 8,
			}),
		});

		const res = await POST(req);
		const json = await res.json();

		expect(res.status).toBe(400);
		expect(json.error).toBe('Could not create post');
	})
})

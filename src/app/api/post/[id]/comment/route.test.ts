/**
 * @jest-environment node
 */

import { GET, POST } from './route'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { inferToxicity } from '@/lib/onnx'

jest.mock('@/lib/prisma');
jest.mock('@/lib/onnx');

beforeEach(() => {
	jest.resetAllMocks()
})

describe('GET /post/:id/comment', () => {
	it('200 returns list of comments when postId is valid', async () => {
		const fakeComments = [
			{
				id: 1,
				postId: 1,
				authorId: 2,
				content: 'First comment',
				toxicity: 0.1,
				author: { id: 2, email: 'user@example.com' },
			},
			{
				id: 2,
				postId: 1,
				authorId: 3,
				content: 'Second comment',
				toxicity: 0.0,
				author: { id: 3, email: 'other@example.com' },
			},
		];
		(prisma.comment.findMany as jest.Mock).mockResolvedValue(fakeComments);

		const req = new NextRequest('http://localhost/post/1/comment', {
			method: 'GET',
		});
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);

		expect(json).toEqual(fakeComments);
		expect(prisma.comment.findMany).toHaveBeenCalledWith({
			where: { postId: 1 },
			orderBy: { createdAt: 'asc' },
			include: {
				author: {
					select: { id: true, email: true },
				},
			},
		});
	})

	it('400 if postId is invalid (zero)', async () => {
		const req = new NextRequest('http://localhost/post/0/comment', {
			method: 'GET',
		});
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(400)
		expect(json.error).toBe('Invalid post ID')
	})

	it('400 if postId is invalid (non-numeric)', async () => {
		const req = new NextRequest('http://localhost/post/abc/comment', {
			method: 'GET',
		});
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(400);
		expect(json.error).toBe('Invalid post ID');
	})
})

describe('POST /post/:id/comment', () => {
	it('400 if postId is invalid (zero)', async () => {
		const req = new NextRequest('http://localhost/post/0/comment', {
			method: 'POST',
			body: JSON.stringify({ authorId: 2, content: 'Hello' }),
		});
		const res = await POST(req);
		const json = await res.json();

		expect(res.status).toBe(400);
		expect(json.error).toBe('Invalid post ID');
	})

	it('400 if authorId or content is missing', async () => {
		// Missing both
		let req = new NextRequest('http://localhost/post/1/comment', {
			method: 'POST',
			body: JSON.stringify({}),
		});
		let res = await POST(req);
		let json = await res.json();

		expect(res.status).toBe(400);
		expect(json.error).toBe('authorId and content are required');

		// Missing content only
		req = new NextRequest('http://localhost/post/1/comment', {
			method: 'POST',
			body: JSON.stringify({ authorId: 2 }),
		});
		res = await POST(req);
		json = await res.json();

		expect(res.status).toBe(400);
		expect(json.error).toBe('authorId and content are required');

		// Missing authorId only
		req = new NextRequest('http://localhost/post/1/comment', {
			method: 'POST',
			body: JSON.stringify({ content: 'Some text' }),
		});
		res = await POST(req);
		json = await res.json();

		expect(res.status).toBe(400);
		expect(json.error).toBe('authorId and content are required');
	})

	it('201 on successful creation', async () => {
		(inferToxicity as jest.Mock).mockResolvedValue(0.25);
		const returnedComment = {
			id: 5,
			postId: 1,
			authorId: 2,
			content: 'New comment',
			toxicity: 0.25,
			include: {
				author: {
					select: { id: true, email: true }
				}
			}
		};
		(prisma.comment.create as jest.Mock).mockResolvedValue(returnedComment);

		const req = new NextRequest('http://localhost/post/1/comment', {
			method: 'POST',
			body: JSON.stringify({ authorId: 2, content: 'New comment' }),
		});
		const res = await POST(req);
		const json = await res.json();

		expect(res.status).toBe(201);
		expect(json).toEqual(returnedComment);
		expect(inferToxicity).toHaveBeenCalledWith('New comment');
		expect(prisma.comment.create).toHaveBeenCalledWith({
			data: {
				postId: 1,
				authorId: 2,
				content: 'New comment',
				toxicity: 0.25,
			},
			include: {
				author: {
					select: { id: true, email: true }
				}
			}
		});
	})
})

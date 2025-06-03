/**
 * @jest-environment node
 */

import { GET, PUT, DELETE } from './route'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

jest.mock('@/lib/prisma')

beforeEach(() => {
	jest.resetAllMocks()
})

describe('GET /post/:id', () => {
	it('200 returns the post with comments', async () => {
		const fakePost = { id: 1, title: 'Test', content: 'Body', comments: [] };
		(prisma.post.findUnique as jest.Mock).mockResolvedValue(fakePost);

		const req = new NextRequest('http://localhost/post/1', { method: 'GET' });
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json).toEqual(fakePost);
		expect(prisma.post.findUnique).toHaveBeenCalledWith({
			where: { id: 1 },
			include: { comments: true },
		});
	})
})

describe('PUT /post/:id', () => {
	it('200 returns updated post', async () => {
		const fakeUpdated = { id: 2, title: 'New title', content: 'New body' };
		(prisma.post.update as jest.Mock).mockResolvedValue(fakeUpdated);

		const req = new NextRequest('http://localhost/post/2', {
			method: 'PUT',
			body: JSON.stringify({ title: 'New title', content: 'New body' }),
		});
		const res = await PUT(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json).toEqual(fakeUpdated);
		expect(prisma.post.update).toHaveBeenCalledWith({
			where: { id: 2 },
			data: { title: 'New title', content: 'New body' },
		});
	})
})

describe('DELETE /post/:id', () => {
	it('204 on successful delete', async () => {
		(prisma.post.delete as jest.Mock).mockResolvedValue(undefined);

		const req = new NextRequest('http://localhost/post/3', { method: 'DELETE' });
		const res = await DELETE(req);

		expect(res.status).toBe(204);
		expect(await res.text()).toBe('');
		expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: 3 } });
	})
})

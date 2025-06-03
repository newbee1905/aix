/**
 * @jest-environment node
 */

import { POST } from './route'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

jest.mock('@/lib/prisma')
jest.mock('cookie')

beforeEach(() => jest.resetAllMocks())

describe('POST /api/logout', () => {
	it('200 on logout (no JWT cookie)', async () => {
		const req = new NextRequest('http://localhost/api/logout', {
			method: 'POST',
		});
		const res = await POST(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json.success).toBe(true);
	})

	it('200 on logout (with JWT cookie)', async () => {
		// simulate cookie in request
		const headers = new Headers();
		headers.append('cookie', 'jwt=some-token;');
		const req = new NextRequest('http://localhost/api/logout', {
			method: 'POST',
			headers,
		});

		(prisma.blacklist.create as jest.Mock).mockResolvedValue({});

		const res = await POST(req);
		const json = await res.json();

		expect(prisma.blacklist.create).toHaveBeenCalledWith({
			data: { token: 'some-token', expiresAt: expect.any(Date) },
		});
		expect(res.status).toBe(200);
		expect(json.success).toBe(true);
	})
})

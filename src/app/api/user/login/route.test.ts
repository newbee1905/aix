/**
 * @jest-environment node
 */

import { POST } from './route'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import argon2 from 'argon2'

jest.mock('@/lib/prisma')
jest.mock('argon2')
jest.mock('@/lib/jwt');
jest.mock('@/lib/refresh');
jest.mock('cookie')

beforeEach(() => jest.resetAllMocks())

describe('POST /api/login', () => {
	it('200 on valid credentials', async () => {
		(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			id: 1,
			email: 'a@b.com',
			passwordHash: 'hashed-pw',
		});
		(argon2.verify as jest.Mock).mockResolvedValue(true);

		const req = new NextRequest('http://localhost/api/login', {
			method: 'POST',
			body: JSON.stringify({ email: 'a@b.com', password: 'pass123' }),
		});

		const res = await POST(req);

		expect(res.status).toBe(200);
	})

	it('401 on invalid credentials (user not found)', async () => {
		(prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

		const req = new NextRequest('http://localhost/api/login', {
			method: 'POST',
			body: JSON.stringify({ email: 'x@y.com', password: 'wrong' }),
		});

		const res = await POST(req);
		const json = await res.json();

		expect(res.status).toBe(401);
		expect(json.error).toBe('Invalid credentials');
	})

	it('401 on invalid credentials (wrong password)', async () => {
		(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			id: 2,
			email: 'c@d.com',
			passwordHash: 'hashed-pw',
		});
		(argon2.verify as jest.Mock).mockResolvedValue(false);

		const req = new NextRequest('http://localhost/api/login', {
			method: 'POST',
			body: JSON.stringify({ email: 'c@d.com', password: 'badpass' }),
		});

		const res = await POST(req);
		const json = await res.json();

		expect(res.status).toBe(401);
		expect(json.error).toBe('Invalid credentials');
	})
})

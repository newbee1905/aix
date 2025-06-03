/**
 * @jest-environment node
 */

import { POST } from './route'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import argon2 from 'argon2'

jest.mock('@/lib/prisma')
jest.mock('argon2')

beforeEach(() => jest.resetAllMocks())

describe('POST /api/register', () => {
	it('201 on successful registration', async () => {
		(argon2.hash as jest.Mock).mockResolvedValue('hashed-pw');
		(prisma.user.create as jest.Mock).mockResolvedValue({ id: 1, email: 'a@b.com' });

		const req = new NextRequest('http://localhost/api/register', {
			method: 'POST',
			body: JSON.stringify({
				email: 'a@b.com',
				password: 'pass123',
			}),
		});

		const res = await POST(req);
		const json = await res.json();

		expect(res.status).toBe(201);
		expect(json.success).toBe(true);
	})

	it('400 if email already in use', async () => {
		(argon2.hash as jest.Mock).mockResolvedValue('hashed-pw');
		(prisma.user.create as jest.Mock).mockRejectedValue(new Error('Unique constraint failed'));

		const req = new NextRequest('http://localhost/api/register', {
			method: 'POST',
			body: JSON.stringify({
				email: 'a@b.com',
				password: 'pass123',
			}),
		});

		const res = await POST(req);
		const json = await res.json();

		expect(res.status).toBe(400);
		expect(json.error).toBe('Email already in use');
	})
})

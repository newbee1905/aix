import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import argon2 from 'argon2';

import { signToken } from '@/lib/jwt';
import { rotateRefreshToken } from '@/lib/refresh';
import { serialize } from 'cookie';

export async function POST(req: NextRequest) {
	const { email, password } = await req.json() as { email: string; password: string };
	const user = await prisma.user.findUnique({ where: { email } });

	if (!user || !(await argon2.verify(user.passwordHash, password))) {
		return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
	}

	const jwt = signToken({ sub: `${user.id}` });
	const refreshToken = await rotateRefreshToken(user.id);

	const res = NextResponse.json({ token: jwt, refreshToken });

	res.headers.append(
		'Set-Cookie',
		serialize('jwt', jwt, {
			httpOnly: true,
			path: '/',
			maxAge: Number(process.env.JWT_EXPIRES_IN!)
		})
	)

	res.headers.append(
		'Set-Cookie',
		serialize('refreshToken', refreshToken, {
			httpOnly: true,
			path: '/',
			maxAge: Number(process.env.REFRESH_EXPIRES_IN!)
		})
	);

	return res;
}

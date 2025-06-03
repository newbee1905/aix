import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { serialize } from 'cookie';

export async function POST(req: NextRequest) {
	const token = req.cookies.get('jwt')?.value;
	if (token) {
		await prisma.blacklist.create({ data: { token, expiresAt: new Date() } });
	}
	const res = NextResponse.json({ success: true });

	res.headers.set('Set-Cookie', serialize('jwt', '', {
		httpOnly: true,
		path: '/',
		maxAge: 0
	}));

	res.headers.set('Set-Cookie', serialize('refreshToken', '', {
		httpOnly: true,
		path: '/',
		maxAge: 0
	}));

	return res;
}

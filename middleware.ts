import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';

export async function middleware(req: NextRequest) {
	const token = req.cookies.get('jwt')?.value;
	if (!token) {
		return NextResponse.redirect(new URL('/api/user/login', req.url));
	}

	const blk = await prisma.blacklist.findUnique({ where: { token } });
	if (blk) {
		return NextResponse.redirect(new URL('/api/user/login', req.url));
	}

	try {
		verifyToken(token);
		return NextResponse.next();
	} catch {
		return NextResponse.redirect(new URL('/api/user/login', req.url));
	}
}

export const config = { matcher: ['/post/:path*', '/api/post/:path*'] };

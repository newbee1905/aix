import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

import { Payload, signToken, verifyToken } from '@/lib/jwt';
import { validateRefreshToken, rotateRefreshToken } from '@/lib/refresh';
import { serialize } from 'cookie';

export async function GET(req: NextRequest) {
	// if jwt is blacklisted revoke both tokens
	// if jwt expired, refresh jwt
	// if refresh token pass half its date - refresh refresh token
	const oldJwt = req.cookies.get('jwt')?.value
	const oldRefresh = req.cookies.get('refreshToken')?.value

	// if JWT is blacklisted, revoke both tokens
	if (oldJwt) {
		const black = await prisma.blacklist.findUnique({
			where: { token: oldJwt }
		})
		if (black) {
			const res = NextResponse.json(
				{ error: 'Token revoked' },
				{ status: 401 }
			)
			if (oldRefresh) {
				await prisma.refreshToken.deleteMany({
					where: { token: oldRefresh }
				})
			}

			res.headers.append(
				'Set-Cookie',
				serialize('jwt', '', { httpOnly: true, path: '/', maxAge: 0 })
			)
			res.headers.append(
				'Set-Cookie',
				serialize('refreshToken', '', { httpOnly: true, path: '/', maxAge: 0 })
			)

			return res
		}
	}

	// try verify existing JWT (might be expired)
	let payload: Payload | null = null
	if (oldJwt) {
		try {
			payload = verifyToken(oldJwt) as Payload
		} catch {
			// expired or invalid — proceed to refresh
		}
	}

	// fallback: find userId from refresh-token record
	let userId = payload?.sub ? Number(payload.sub) : null
	if (!userId) {
		if (!oldRefresh) {
			return NextResponse.json(
				{ error: 'Missing refresh token' },
				{ status: 400 }
			)
		}
		const rec = await prisma.refreshToken.findUnique({
			where: { token: oldRefresh }
		})
		if (!rec) {
			return NextResponse.json(
				{ error: 'Invalid refresh token' },
				{ status: 401 }
			)
		}
		userId = rec.userId
		payload = { sub: `${userId}`, iat: Math.floor(rec.createdAt.getTime() / 1000) }
	}

	// validate refresh token record
	const valid = await validateRefreshToken(userId, oldRefresh!)
	if (!valid) {
		return NextResponse.json(
			{ error: 'Invalid or expired refresh token' },
			{ status: 401 }
		)
	}

	// blacklist old JWT if present
	if (oldJwt && payload?.iat) {
		const issuedAtMs = payload?.iat * 1000
		await prisma.blacklist.create({
			data: {
				token: oldJwt,
				expiresAt: new Date(
					issuedAtMs + Number(process.env.JWT_EXPIRES_IN!) * 1000
				)
			}
		})
	}

	// issue new tokens
	const newJwt = signToken({ sub: `${userId}` })
	const newRefresh = await rotateRefreshToken(userId)

	const res = NextResponse.json(
		{ userId },
		{ status: 200 }
	)

	// set HTTP-only JWT cookie
	res.headers.append(
		'Set-Cookie',
		serialize('jwt', newJwt, {
			httpOnly: true,
			path: '/',
			maxAge: Number(process.env.JWT_EXPIRES_IN!)
		})
	)

	// set HTTP-only refresh token cookie
	res.headers.append(
		'Set-Cookie',
		serialize('refreshToken', newRefresh, {
			httpOnly: true,
			path: '/',
			maxAge: Number(process.env.REFRESH_EXPIRES_IN!)
		})
	)

	return res
}


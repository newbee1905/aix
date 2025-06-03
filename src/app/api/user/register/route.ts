import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import argon2 from 'argon2';

export async function POST(req: NextRequest) {
	let body: { email?: string; password?: string }

	try {
		body = (await req.json()) as { email?: string; password?: string }
	} catch {
		return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
	}

	const { email, password } = body
	if (!email || !password) {
		return NextResponse.json(
			{ error: 'Email and password are required' },
			{ status: 400 }
		)
	}

	const passwordHash = await argon2.hash(password)

	try {
		await prisma.user.create({
			data: { email, passwordHash },
		})
		return NextResponse.json({ success: true }, { status: 201 })
	} catch {
		// Unique‐constraint or other database error
		return NextResponse.json(
			{ error: 'Email already in use' },
			{ status: 400 }
		)
	}
}

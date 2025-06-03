import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

import { inferToxicity } from '@/lib/onnx';

function extractPostId(pathname: string): number | null {
	const match = pathname.match(/post\/(\d+)(?:\/|$)/)
	if (!match) {
		return null
	}

	const id = Number(match[1])
	return Number.isNaN(id) || id <= 0 ? null : id
}

export async function GET(req: NextRequest) {
	const postId = extractPostId(req.nextUrl.pathname)

	if (!postId) {
		return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })
	}

	const comments = await prisma.comment.findMany({
		where: { postId },
		orderBy: { createdAt: 'asc' },
		include: {
			author: {
				select: { id: true, email: true }
			}
		}
	})

	return NextResponse.json(comments)
}

export async function POST(req: NextRequest) {
	const postId = extractPostId(req.nextUrl.pathname)

	if (!postId) {
		return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })
	}

	const body = await req.json() as { authorId: number; content: string }
	const { authorId, content } = body

	if (!authorId || !content) {
		return NextResponse.json(
			{ error: 'authorId and content are required' },
			{ status: 400 }
		)
	}

	const toxicity = await inferToxicity(content)

	const newComment = await prisma.comment.create({
		data: {
			postId,
			authorId,
			content,
			toxicity,
		},
		include: {
			author: {
				select: { id: true, email: true }
			}
		}
	})

	return NextResponse.json(newComment, { status: 201 })
}


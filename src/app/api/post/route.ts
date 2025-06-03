import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

import { inferToxicity } from '@/lib/onnx';

export async function GET() {
	const posts = await prisma.post.findMany({
		include: { author: true, comments: true }
	});

	const data = posts.map(post => ({
		...post,
		comments: post.comments.map(c => ({
			...c,
		}))
	}));

	return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
	const { title, content, authorId } = await req.json() as {
		title: string;
		content: string;
		authorId: number;
	};

	try {
		const toxicity = await inferToxicity(content)

		const newPost = await prisma.post.create({
			data: { title, content, authorId, toxicity },
			include: { author: true, comments: true }
		});

		return NextResponse.json(newPost, { status: 201 });
	} catch (error) {
		console.log(error)
		return NextResponse.json(
			{ error: 'Could not create post' },
			{ status: 400 }
		);
	}
} 


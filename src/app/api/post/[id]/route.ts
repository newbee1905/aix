import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
	const id = req.nextUrl.pathname.match(/post\/(\d+)/)!.slice(1);
	const post = await prisma.post.findUnique({
		where: { id: Number(id) },
		include: { comments: true }
	});

	return NextResponse.json(post);
}

export async function PUT(req: NextRequest) {
	const id = req.nextUrl.pathname.match(/post\/(\d+)/)!.slice(1);
	const { title, content } = await req.json() as { title: string; content: string };
	const updated = await prisma.post.update({
		where: { id: Number(id) },
		data: { title, content }
	});

	return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
	const id	= req.nextUrl.pathname.match(/post\/(\d+)/)!.slice(1);
	await prisma.post.delete({ where: { id: Number(id) } });

	return new NextResponse(null, { status: 204 });
}

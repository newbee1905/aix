import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2';

const prisma = new PrismaClient()

function rateToxicity(): number {
	return parseFloat(Math.random().toFixed(2));
}

function shuffle<T>(arr: T[]): T[] {
	const a = arr.slice()
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));

		[a[i], a[j]] = [a[j], a[i]];
	}
	return a
}

async function main() {
	await prisma.comment.deleteMany()
	await prisma.post.deleteMany()
	await prisma.user.deleteMany()

	const rawUsers = [
		{ email: 'alice@example.com', password: 'password1' },
		{ email: 'bob@example.com', password: 'password2' },
		{ email: 'charlie@example.com', password: 'password3' },
		{ email: 'leminh@example.com', password: 'password4' },
	];

	const users = await Promise.all(
		rawUsers.map(async ({ email, password }) => {
			const passwordHash = await argon2.hash(password);
			return prisma.user.create({ data: { email, passwordHash } });
		}),
	)

	for (let i = 1; i <= 10; i++) {
		const author = users[Math.floor(Math.random() * users.length)]
		const toxicity = rateToxicity()
		const commenters = shuffle(users.filter(u => u.id !== author.id)).slice(0, 2)

		await prisma.post.create({
			data: {
				title: `Post ${i}`,
				content: `This is the content for post #${i}.`,
				authorId: author.id,
				toxicity,
				comments: {
					create: commenters.map(c => ({
						content: `Comment on post ${i}`,
						authorId: c.id,
						toxicity: rateToxicity(),
					})),
				},
			},
		})
	}

	console.log('Seed complete')
}

main()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(() => prisma.$disconnect())

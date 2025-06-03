import prisma from './prisma';
import { v4 as uuidv4 } from 'uuid';

const refreshExpires = Number(process.env.REFRESH_EXPIRES_IN!);
const rotateBefore	 = Number(process.env.REFRESH_ROTATE_BEFORE!);

export async function rotateRefreshToken(userId: number) {
	await prisma.refreshToken.deleteMany({ where: { userId } });
	const token = uuidv4();

	const expiresAt = new Date(Date.now() + refreshExpires * 1000);
	await prisma.refreshToken.create({ data: { userId, token, expiresAt } });

	return token;
}

export async function validateRefreshToken(userId: number, token: string) {
	const rec = await prisma.refreshToken.findUnique({ where: { userId_token: { userId, token } } });
	if (!rec || rec.expiresAt < new Date()) return false;

	// auto-rotate if older than rotateBefore
	if (Date.now() - rec.createdAt.getTime() > rotateBefore * 1000) {
		return await rotateRefreshToken(userId);
	}

	return token;
}

import jwt from 'jsonwebtoken';

export type Payload = jwt.JwtPayload;

const secret = process.env.JWT_SECRET!;
const expiresIn = Number(process.env.JWT_EXPIRES_IN!);

export function signToken(payload: Payload) {
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token: string) {
  return jwt.verify(token, secret) as Payload;
}

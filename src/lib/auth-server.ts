import { createHash, randomInt, randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

import dbConnect from '@/lib/db';
import { 
    OTP_EXPIRY_MINUTES,
    OTP_LENGTH,
    OTP_SEND_WINDOW_MINUTES,
    VERIFICATION_TOKEN_EXPIRY_MINUTES,
    type AuthUser 
} from '@/lib/auth-shared';
import User from '@/models/User';

const AUTH_COOKIE_NAME = 'auth_token';
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const JWT_ALGORITHM = 'HS256';

interface SessionPayload extends JWTPayload {
    sub: string;
    email: string;
}

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is not configured.');
    }

    return new TextEncoder().encode(secret);
}

export function getPublicUserData(user: {
    _id: { toString(): string } | string;
    email: string;
    name: string;
    avatar_url?: string | null;
    created_at?: Date;
}): AuthUser {
    return {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url || null,
        created_at: user.created_at ? user.created_at.toISOString() : undefined,
    };
}

export async function hashPassword(password: string) {
    return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, passwordHash: string) {
    return bcrypt.compare(password, passwordHash);
}

export async function createAuthToken(userId: string, email: string) {
    return new SignJWT({ email })
        .setProtectedHeader({ alg: JWT_ALGORITHM })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime(`${AUTH_COOKIE_MAX_AGE_SECONDS}s`)
        .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string) {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as SessionPayload;
}

export function setAuthCookie(response: NextResponse, token: string) {
    response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    });
}

export function clearAuthCookie(response: NextResponse) {
    response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: '',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
    });
}

export function getAuthTokenFromRequest(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');

    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice('Bearer '.length);
    }

    return req.cookies.get(AUTH_COOKIE_NAME)?.value || null;
}

export async function getAuthenticatedUser(req: NextRequest) {
    const token = getAuthTokenFromRequest(req);

    if (!token) {
        return null;
    }

    const payload = await verifyAuthToken(token);

    if (!payload.sub) {
        return null;
    }

    await dbConnect();

    const user = await User.findById(payload.sub);
    return user;
}

export function hashValue(value: string) {
    return createHash('sha256').update(value).digest('hex');
}

export function generateOtp() {
    const min = 10 ** (OTP_LENGTH - 1);
    const max = (10 ** OTP_LENGTH) - 1;

    return String(randomInt(min, max + 1));
}

export function generateVerificationToken() {
    return randomUUID();
}

export function getOtpExpiryDate() {
    return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

export function getVerificationTokenExpiryDate() {
    return new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MINUTES * 60 * 1000);
}

export function getOtpSendWindowResetDate() {
    return new Date(Date.now() + OTP_SEND_WINDOW_MINUTES * 60 * 1000);
}

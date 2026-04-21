import { NextRequest, NextResponse } from 'next/server';

import dbConnect from '@/lib/db';
import { createAuthToken, getPublicUserData, hashPassword, setAuthCookie, hashValue } from '@/lib/auth-server';
import { normalizeEmail, validatePassword } from '@/lib/auth-shared';
import User from '@/models/User';
import Otp from '@/models/Otp';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const email = normalizeEmail(body.email || '');
        const password = String(body.password || '');
        const name = String(body.name || '').trim();

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            return NextResponse.json({ error: passwordError }, { status: 400 });
        }

        const verificationToken = String(body.verificationToken || '').trim();
        if (!verificationToken) {
            return NextResponse.json({ error: 'Verification token is required.' }, { status: 400 });
        }

        await dbConnect();

        const verificationRecord = await Otp.findOne({ email });

        if (
            !verificationRecord ||
            !verificationRecord.verification_token_hash ||
            !verificationRecord.verification_token_expires_at
        ) {
            return NextResponse.json({ error: 'Verification token not found. Verify OTP again.' }, { status: 400 });
        }

        if (verificationRecord.verification_token_expires_at.getTime() <= Date.now()) {
            await Otp.deleteOne({ _id: verificationRecord._id });
            return NextResponse.json({ error: 'Verification token expired. Verify OTP again.' }, { status: 400 });
        }

        if (verificationRecord.verification_token_hash !== hashValue(verificationToken)) {
            return NextResponse.json({ error: 'Invalid verification token.' }, { status: 400 });
        }

        await dbConnect();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
        }

        const password_hash = await hashPassword(password);

        const user = await User.create({
            email,
            name,
            password_hash,
            avatar_url: null,
        });

        const token = await createAuthToken(user._id.toString(), user.email);
        const response = NextResponse.json({
            status: 'success',
            user: getPublicUserData(user),
        });
        setAuthCookie(response, token);

        return response;
    } catch (error) {
        console.error('Signup API Error:', error);
        return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 });
    }
}

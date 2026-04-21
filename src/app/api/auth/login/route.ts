
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { comparePassword, createAuthToken, getPublicUserData, setAuthCookie } from '@/lib/auth-server';
import { normalizeEmail } from '@/lib/auth-shared';
import User from '@/models/User';

export async function POST(req: NextRequest) {
    try {
        const { email: rawEmail, password } = await req.json();
        const email = normalizeEmail(rawEmail || '');

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email }).select('+password_hash');

        if (!user?.password_hash) {
            return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        const isPasswordValid = await comparePassword(String(password), user.password_hash);

        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        const token = await createAuthToken(user._id.toString(), user.email);
        const response = NextResponse.json({
            status: 'success',
            user: getPublicUserData(user),
        });
        setAuthCookie(response, token);

        return response;
    } catch (error: unknown) {
        console.error('Login API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

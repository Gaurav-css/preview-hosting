import { NextRequest, NextResponse } from 'next/server';

import dbConnect from '@/lib/db';
import {
    generateVerificationToken,
    getVerificationTokenExpiryDate,
    hashValue,
} from '@/lib/auth-server';
import { normalizeEmail, OTP_MAX_ATTEMPTS } from '@/lib/auth-shared';
import Otp from '@/models/Otp';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const email = normalizeEmail(body.email || '');
        const otp = String(body.otp || '').trim();

        if (!email || !otp) {
            return NextResponse.json({ error: 'Email and OTP are required.' }, { status: 400 });
        }

        await dbConnect();

        const record = await Otp.findOne({ email });

        if (!record) {
            return NextResponse.json({ error: 'OTP not found. Please request a new code.' }, { status: 404 });
        }

        if (record.expires_at.getTime() <= Date.now()) {
            await Otp.deleteOne({ _id: record._id });
            return NextResponse.json({ error: 'OTP has expired. Please request a new code.' }, { status: 400 });
        }

        if (record.attempts >= OTP_MAX_ATTEMPTS) {
            await Otp.deleteOne({ _id: record._id });
            return NextResponse.json({ error: 'Too many invalid attempts. Please request a new code.' }, { status: 429 });
        }

        const otpHash = hashValue(otp);

        if (record.otp_hash !== otpHash) {
            record.attempts += 1;

            if (record.attempts >= OTP_MAX_ATTEMPTS) {
                await Otp.deleteOne({ _id: record._id });
                return NextResponse.json({ error: 'Too many invalid attempts. Please request a new code.' }, { status: 429 });
            }

            await record.save();

            return NextResponse.json({ error: 'Invalid OTP.' }, { status: 400 });
        }

        const verificationToken = generateVerificationToken();
        const verificationTokenExpiry = getVerificationTokenExpiryDate();

        record.verification_token_hash = hashValue(verificationToken);
        record.verification_token_expires_at = verificationTokenExpiry;
        record.expires_at = verificationTokenExpiry;
        record.attempts = 0;
        await record.save();

        return NextResponse.json({
            status: 'success',
            verificationToken,
        });
    } catch (error) {
        console.error('Verify OTP API Error:', error);
        return NextResponse.json({ error: 'Failed to verify OTP.' }, { status: 500 });
    }
}

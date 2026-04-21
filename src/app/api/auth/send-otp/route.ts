import { NextRequest, NextResponse } from 'next/server';

import dbConnect from '@/lib/db';
import { generateOtp, getOtpExpiryDate, hashValue } from '@/lib/auth-server';
import { normalizeEmail, OTP_SEND_LIMIT, OTP_SEND_WINDOW_MINUTES } from '@/lib/auth-shared';
import { sendOtpEmail } from '@/lib/mailjet';
import Otp from '@/models/Otp';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const email = normalizeEmail(body.email || '');

        if (!email) {
            return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
        }

        await dbConnect();

        const now = new Date();
        const otp = generateOtp();
        const otpHash = hashValue(otp);
        const otpExpiry = getOtpExpiryDate();

        const existingRecord = await Otp.findOne({ email });

        let sendCount = 1;
        let sendWindowStartedAt = now;

        if (existingRecord) {
            const windowExpiresAt = new Date(
                existingRecord.send_window_started_at.getTime() + OTP_SEND_WINDOW_MINUTES * 60 * 1000,
            );
            const withinWindow = windowExpiresAt.getTime() > now.getTime();

            if (withinWindow) {
                sendCount = existingRecord.send_count + 1;
                sendWindowStartedAt = existingRecord.send_window_started_at;
            }

            if (withinWindow && existingRecord.send_count >= OTP_SEND_LIMIT) {
                return NextResponse.json(
                    { error: 'Too many OTP requests. Please wait before requesting another code.' },
                    { status: 429 },
                );
            }
        }

        await sendOtpEmail(email, otp);

        await Otp.findOneAndUpdate(
            { email },
            {
                $set: {
                    otp_hash: otpHash,
                    expires_at: otpExpiry,
                    attempts: 0,
                    send_count: sendCount,
                    send_window_started_at: sendWindowStartedAt,
                },
                $unset: {
                    verification_token_hash: 1,
                    verification_token_expires_at: 1,
                },
            },
            {
                upsert: true,
                new: true,
            },
        );

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error('Send OTP API Error:', error);
        return NextResponse.json({ error: 'Failed to send OTP.' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedUser, getPublicUserData } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthenticatedUser(req);

        if (!user) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        return NextResponse.json({ user: getPublicUserData(user) });
    } catch (error) {
        console.error('Auth me error:', error);
        return NextResponse.json({ user: null }, { status: 401 });
    }
}

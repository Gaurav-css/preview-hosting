const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
const PASSWORD_NUMBER_REGEX = /\d/;

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_SEND_LIMIT = 3;
export const OTP_SEND_WINDOW_MINUTES = 15;
export const OTP_MAX_ATTEMPTS = 5;
export const VERIFICATION_TOKEN_EXPIRY_MINUTES = 15;
export const OTP_LENGTH = 6;

export interface AuthUser {
    _id: string;
    email: string;
    name: string;
    avatar_url?: string | null;
    created_at?: string;
}

export function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

export function validatePassword(password: string) {
    if (password.length < PASSWORD_MIN_LENGTH) {
        return 'Password must be at least 8 characters long.';
    }

    if (!PASSWORD_UPPERCASE_REGEX.test(password)) {
        return 'Password must include at least one uppercase letter.';
    }

    if (!PASSWORD_NUMBER_REGEX.test(password)) {
        return 'Password must include at least one number.';
    }

    return null;
}

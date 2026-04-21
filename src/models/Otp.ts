import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
    email: string;
    otp_hash: string;
    expires_at: Date;
    attempts: number;
    send_count: number;
    send_window_started_at: Date;
    verification_token_hash?: string;
    verification_token_expires_at?: Date;
    created_at: Date;
    updated_at: Date;
}

const OtpSchema = new Schema<IOtp>(
    {
        email: { type: String, required: true, unique: true, index: true },
        otp_hash: { type: String, required: true },
        expires_at: { type: Date, required: true, index: true },
        attempts: { type: Number, default: 0 },
        send_count: { type: Number, default: 1 },
        send_window_started_at: { type: Date, required: true },
        verification_token_hash: { type: String },
        verification_token_expires_at: { type: Date },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    },
);

OtpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Otp || mongoose.model<IOtp>('Otp', OtpSchema);

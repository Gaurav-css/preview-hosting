import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    name: string;
    password_hash: string;
    avatar_url?: string;
    created_at: Date;
}

const UserSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String },
    password_hash: { type: String, required: true, select: false },
    avatar_url: { type: String },
    created_at: { type: Date, default: Date.now },
});

UserSchema.set('toJSON', {
    transform: (_doc, ret: { password_hash?: string }) => {
        delete ret.password_hash;
        return ret;
    },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

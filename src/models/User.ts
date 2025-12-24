import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    firebase_uid: string;
    email: string;
    name: string;
    avatar_url?: string;
    created_at: Date;
}

const UserSchema = new Schema<IUser>({
    firebase_uid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    name: { type: String },
    avatar_url: { type: String },
    created_at: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

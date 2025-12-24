import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
    user_id: mongoose.Types.ObjectId;
    project_name: string;
    preview_url: string;
    storage_path: string;
    entry_point: string;
    expires_at: Date;
    status: 'active' | 'expired';
    created_at: Date;
}

const ProjectSchema = new Schema<IProject>({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    project_name: { type: String, required: true },
    preview_url: { type: String, required: true, unique: true },
    storage_path: { type: String, required: true },
    entry_point: { type: String, default: 'index.html' },
    expires_at: { type: Date, required: true },
    status: { type: String, enum: ['active', 'expired'], default: 'active' },
    created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

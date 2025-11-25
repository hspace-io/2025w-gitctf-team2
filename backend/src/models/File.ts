import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
    filename: string;     
    originalName: string; 
    uploader: mongoose.Types.ObjectId; 
    size: number;
    mimetype: string;
    createdAt: Date;
}

const FileSchema = new Schema<IFile>(
    {
        filename: { type: String, required: true, unique: true },
        originalName: { type: String, required: true },
        uploader: { 
            type: Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        size: { type: Number, required: true },
        mimetype: { type: String, required: true },
    },
    { timestamps: true }
    );


export default mongoose.model<IFile>('File', FileSchema);

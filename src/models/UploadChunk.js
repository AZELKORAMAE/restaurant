import mongoose from 'mongoose';

// Temporary storage for chunked uploads (large 3D scans exceed serverless body limits).
const UploadChunkSchema = new mongoose.Schema({
    uploadId: { type: String, required: true, index: true },
    owner: { type: String, required: true },
    index: { type: Number, required: true },
    data: Buffer,
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 6 },
});
UploadChunkSchema.index({ uploadId: 1, index: 1 }, { unique: true });

export default mongoose.models.UploadChunk || mongoose.model('UploadChunk', UploadChunkSchema);

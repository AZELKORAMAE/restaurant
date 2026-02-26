import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema({
    filename: String,
    contentType: String,
    data: Buffer,
}, { timestamps: true });

export default mongoose.models.Media || mongoose.model('Media', MediaSchema);
